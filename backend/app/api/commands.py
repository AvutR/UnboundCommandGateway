"""Command submission endpoints."""
from datetime import datetime
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Command, ActionTaken, RuleAction
from app.schemas import CommandRequest, CommandResponse, CommandDetailResponse
from app.agent.rule_engine import match_rule
from app.agent.executor import simulate_execution
from app.agent.credits import deduct_credit
from app.agent.audit import log_event
from app.notifications.ws import send_to_user, send_to_admins
from app.api.auth import get_current_user

router = APIRouter(prefix="/commands", tags=["commands"])


@router.post("", response_model=CommandResponse)
async def submit_command(
    request: CommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a command for execution.
    
    Implements the full transaction flow:
    1. Check credits
    2. Match rules (first priority wins)
    3. Apply rule action (reject/accept/require approval)
    4. Execute if accepted (atomic credit deduction + execution)
    5. Save command record
    6. Send WebSocket notification
    """
    command_text = request.command_text.strip()
    
    # Step 1: Check credits (before rule matching for early rejection)
    if current_user.credits < 1:
        # Create command record with REJECTED status
        command = Command(
            user_id=current_user.id,
            command_text=command_text,
            matched_rule_id=None,
            action_taken=ActionTaken.REJECTED,
            cost=0,
            result=None
        )
        db.add(command)
        log_event(
            db,
            current_user.id,
            "COMMAND_REJECTED",
            {"reason": "INSUFFICIENT_CREDITS", "command_text": command_text}
        )
        db.commit()
        
        return CommandResponse(
            status="rejected",
            reason="INSUFFICIENT_CREDITS",
            command_id=command.id
        )
    
    # Step 2: Match rules
    matched_rule = match_rule(command_text, db)
    
    # Step 3: Handle no match
    if not matched_rule:
        command = Command(
            user_id=current_user.id,
            command_text=command_text,
            matched_rule_id=None,
            action_taken=ActionTaken.REJECTED,
            cost=0,
            result=None
        )
        db.add(command)
        log_event(
            db,
            current_user.id,
            "NO_MATCH",
            {"command_text": command_text}
        )
        db.commit()
        
        return CommandResponse(
            status="rejected",
            reason="NO_MATCHING_RULE",
            command_id=command.id
        )
    
    # Step 4: Handle AUTO_REJECT
    if matched_rule.action == RuleAction.AUTO_REJECT:
        command = Command(
            user_id=current_user.id,
            command_text=command_text,
            matched_rule_id=matched_rule.id,
            action_taken=ActionTaken.REJECTED,
            cost=0,
            result=None
        )
        db.add(command)
        log_event(
            db,
            current_user.id,
            "COMMAND_REJECTED",
            {
                "reason": "AUTO_REJECT",
                "rule_id": str(matched_rule.id),
                "command_text": command_text
            }
        )
        db.commit()
        
        # Send notification
        await send_to_user(current_user.id, {
            "type": "command_update",
            "command_id": str(command.id),
            "status": "rejected",
            "reason": "AUTO_REJECT"
        })
        
        return CommandResponse(
            status="rejected",
            reason="AUTO_REJECT",
            command_id=command.id
        )
    
    # Step 5: Handle REQUIRE_APPROVAL
    if matched_rule.action == RuleAction.REQUIRE_APPROVAL:
        command = Command(
            user_id=current_user.id,
            command_text=command_text,
            matched_rule_id=matched_rule.id,
            action_taken=ActionTaken.PENDING,
            cost=0,
            result=None
        )
        db.add(command)
        log_event(
            db,
            current_user.id,
            "COMMAND_PENDING_APPROVAL",
            {
                "command_id": str(command.id),
                "rule_id": str(matched_rule.id),
                "command_text": command_text
            }
        )
        db.commit()
        
        # Send notification to admins
        await send_to_admins({
            "type": "approval_request",
            "command_id": str(command.id),
            "command_text": command_text,
            "submitted_by": str(current_user.id),
            "user_name": current_user.name
        }, db)
        
        # Send notification to user
        await send_to_user(current_user.id, {
            "type": "command_update",
            "command_id": str(command.id),
            "status": "pending"
        })
        
        return CommandResponse(
            status="pending",
            command_id=command.id
        )
    
    # Step 6: Handle AUTO_ACCEPT (atomic transaction)
    if matched_rule.action == RuleAction.AUTO_ACCEPT:
        # Use SELECT FOR UPDATE to lock user row
        success, new_balance = deduct_credit(db, current_user.id, amount=1)
        
        if not success:
            # Insufficient credits after lock
            command = Command(
                user_id=current_user.id,
                command_text=command_text,
                matched_rule_id=matched_rule.id,
                action_taken=ActionTaken.REJECTED,
                cost=0,
                result=None
            )
            db.add(command)
            log_event(
                db,
                current_user.id,
                "COMMAND_REJECTED",
                {"reason": "INSUFFICIENT_CREDITS", "command_text": command_text}
            )
            db.commit()
            
            return CommandResponse(
                status="rejected",
                reason="INSUFFICIENT_CREDITS",
                command_id=command.id
            )
        
        # Execute command
        execution_result = simulate_execution(command_text)
        
        # Create command record
        command = Command(
            user_id=current_user.id,
            command_text=command_text,
            matched_rule_id=matched_rule.id,
            action_taken=ActionTaken.ACCEPTED,
            cost=1,
            result=execution_result,
            executed_at=datetime.utcnow()
        )
        db.add(command)
        
        # Log audit event
        log_event(
            db,
            current_user.id,
            "COMMAND_EXECUTED",
            {
                "command_id": str(command.id),
                "rule_id": str(matched_rule.id),
                "command_text": command_text,
                "cost": 1
            }
        )
        
        # Commit transaction
        db.commit()
        
        # Send WebSocket notification
        await send_to_user(current_user.id, {
            "type": "command_update",
            "command_id": str(command.id),
            "status": "executed",
            "result": execution_result,
            "new_balance": new_balance
        })
        
        return CommandResponse(
            status="executed",
            result=execution_result,
            new_balance=new_balance,
            command_id=command.id
        )
    
    # Should never reach here
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unknown rule action"
    )


@router.get("", response_model=List[CommandDetailResponse])
def list_commands(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List commands for the current user."""
    commands = db.query(Command).filter(
        Command.user_id == current_user.id
    ).order_by(Command.created_at.desc()).offset(skip).limit(limit).all()
    
    return commands


@router.get("/{command_id}", response_model=CommandDetailResponse)
def get_command(
    command_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific command by ID."""
    command = db.query(Command).filter(
        Command.id == command_id,
        Command.user_id == current_user.id
    ).first()
    
    if not command:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command not found"
        )
    
    return command

