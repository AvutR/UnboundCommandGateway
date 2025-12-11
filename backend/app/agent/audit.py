"""Audit logging."""
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models import AuditLog


def log_event(
    db: Session,
    actor_user_id: Optional[UUID],
    event_type: str,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Log an audit event.
    
    Args:
        db: Database session
        actor_user_id: UUID of the user who triggered the event (None for system)
        event_type: Type of event (e.g., COMMAND_EXECUTED, COMMAND_REJECTED)
        details: Optional dictionary with additional details
        
    Returns:
        The created AuditLog instance
    """
    audit_log = AuditLog(
        actor_user_id=actor_user_id,
        event_type=event_type,
        details=details or {}
    )
    db.add(audit_log)
    db.flush()
    return audit_log

