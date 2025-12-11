"""Admin endpoints for user and rule management."""
import secrets
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Rule, UserRole, RuleAction, AuditLog
from app.schemas import (
    UserCreate, UserResponse, UserWithApiKey, UserUpdate,
    RuleCreate, RuleUpdate, RuleResponse, AuditLogResponse
)
from app.api.auth import get_current_admin
from app.agent.rule_engine import validate_regex_pattern

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/users", response_model=UserWithApiKey)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Create a new user and return API key (shown only once).
    
    Only admins can create users.
    """
    # Generate API key
    api_key = f"usr_{secrets.token_urlsafe(32)}"
    
    # Determine role
    role = UserRole.ADMIN if user_data.role == "admin" else UserRole.MEMBER
    
    user = User(
        name=user_data.name,
        api_key=api_key,
        role=role,
        credits=100  # Default credits
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserWithApiKey(
        id=user.id,
        name=user.name,
        role=user.role.value,
        credits=user.credits,
        created_at=user.created_at,
        api_key=api_key
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all users (admin only)."""
    users = db.query(User).all()
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update a user's credits (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_data.credits is not None:
        user.credits = user_data.credits
    
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/rules", response_model=List[RuleResponse])
def list_rules(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all rules (admin only)."""
    rules = db.query(Rule).order_by(Rule.priority.asc()).all()
    return rules


@router.post("/rules", response_model=RuleResponse)
def create_rule(
    rule_data: RuleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Create a new rule (admin only).
    
    Validates regex pattern before saving.
    """
    # Validate regex pattern
    is_valid, error_msg = validate_regex_pattern(rule_data.pattern)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Determine action
    action = RuleAction(rule_data.action)
    
    rule = Rule(
        priority=rule_data.priority,
        pattern=rule_data.pattern,
        action=action,
        description=rule_data.description
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return rule


@router.put("/rules/{rule_id}", response_model=RuleResponse)
def update_rule(
    rule_id: UUID,
    rule_data: RuleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update a rule (admin only)."""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Update fields if provided
    if rule_data.priority is not None:
        rule.priority = rule_data.priority
    
    if rule_data.pattern is not None:
        # Validate new pattern
        is_valid, error_msg = validate_regex_pattern(rule_data.pattern)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        rule.pattern = rule_data.pattern
    
    if rule_data.action is not None:
        rule.action = RuleAction(rule_data.action)
    
    if rule_data.description is not None:
        rule.description = rule_data.description
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a rule (admin only)."""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    db.delete(rule)
    db.commit()
    
    return None


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List audit logs (admin only)."""
    logs = db.query(AuditLog).order_by(
        AuditLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    return logs

