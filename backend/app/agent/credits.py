"""Credit management with transaction safety."""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import User


def deduct_credit(db: Session, user_id: str, amount: int = 1) -> tuple[bool, Optional[int]]:
    """
    Deduct credits from a user atomically using SELECT FOR UPDATE.
    
    Args:
        db: Database session
        user_id: UUID of the user
        amount: Amount of credits to deduct (default 1)
        
    Returns:
        Tuple of (success, new_balance) or (False, None) if insufficient credits
    """
    # Use SELECT FOR UPDATE to lock the row
    stmt = select(User).where(User.id == user_id).with_for_update()
    user = db.execute(stmt).scalar_one_or_none()
    
    if not user:
        return False, None
    
    if user.credits < amount:
        return False, None
    
    user.credits -= amount
    db.flush()  # Flush to get updated balance
    
    return True, user.credits

