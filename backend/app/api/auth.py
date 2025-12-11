"""Authentication middleware and dependencies."""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

# For demo purposes, we'll use plaintext API keys
# In production, use hashed keys (bcrypt, etc.)


def get_current_user(
    x_api_key: str = Header(..., alias="X-API-KEY"),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user from API key header.
    
    Args:
        x_api_key: API key from X-API-KEY header
        db: Database session
        
    Returns:
        User object
        
    Raises:
        HTTPException: If API key is invalid
    """
    user = db.query(User).filter(User.api_key == x_api_key).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is an admin.
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        User object (admin)
        
    Raises:
        HTTPException: If user is not an admin
    """
    from app.models import UserRole
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

