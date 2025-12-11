"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


# User schemas
class UserCreate(BaseModel):
    """Schema for creating a user."""
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="member", pattern="^(admin|member)$")


class UserResponse(BaseModel):
    """Schema for user response."""
    id: UUID
    name: str
    role: str
    credits: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithApiKey(UserResponse):
    """Schema for user response with API key (shown only once)."""
    api_key: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    credits: Optional[int] = Field(None, ge=0)


# Command schemas
class CommandRequest(BaseModel):
    """Schema for command submission."""
    command_text: str = Field(..., min_length=1)


class CommandResponse(BaseModel):
    """Schema for command response."""
    status: str
    reason: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    new_balance: Optional[int] = None
    command_id: Optional[UUID] = None


class CommandDetailResponse(BaseModel):
    """Schema for detailed command response."""
    id: UUID
    user_id: UUID
    command_text: str
    matched_rule_id: Optional[UUID] = None
    action_taken: str
    cost: int
    result: Optional[Dict[str, Any]] = None
    executed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Rule schemas
class RuleCreate(BaseModel):
    """Schema for creating a rule."""
    priority: int = Field(..., ge=0)
    pattern: str = Field(..., min_length=1)
    action: str = Field(..., pattern="^(AUTO_ACCEPT|AUTO_REJECT|REQUIRE_APPROVAL)$")
    description: Optional[str] = None


class RuleUpdate(BaseModel):
    """Schema for updating a rule."""
    priority: Optional[int] = Field(None, ge=0)
    pattern: Optional[str] = Field(None, min_length=1)
    action: Optional[str] = Field(None, pattern="^(AUTO_ACCEPT|AUTO_REJECT|REQUIRE_APPROVAL)$")
    description: Optional[str] = None


class RuleResponse(BaseModel):
    """Schema for rule response."""
    id: UUID
    priority: int
    pattern: str
    action: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Audit log schemas
class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    id: UUID
    actor_user_id: Optional[UUID] = None
    event_type: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

