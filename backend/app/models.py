"""SQLAlchemy models for the command gateway system."""
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db import Base


class UserRole(PyEnum):
    """User role enumeration."""
    ADMIN = "admin"
    MEMBER = "member"


class ActionTaken(PyEnum):
    """Command action enumeration."""
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    PENDING = "PENDING"


class RuleAction(PyEnum):
    """Rule action enumeration."""
    AUTO_ACCEPT = "AUTO_ACCEPT"
    AUTO_REJECT = "AUTO_REJECT"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    api_key = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.MEMBER)
    credits = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    commands = relationship("Command", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor_user")


class Rule(Base):
    """Rule model."""
    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    priority = Column(Integer, nullable=False, index=True)
    pattern = Column(Text, nullable=False)
    action = Column(Enum(RuleAction), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    commands = relationship("Command", back_populates="matched_rule")


class Command(Base):
    """Command model."""
    __tablename__ = "commands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    command_text = Column(Text, nullable=False)
    matched_rule_id = Column(UUID(as_uuid=True), ForeignKey("rules.id"), nullable=True)
    action_taken = Column(Enum(ActionTaken), nullable=False)
    cost = Column(Integer, nullable=False, default=1)
    result = Column(JSON, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="commands")
    matched_rule = relationship("Rule", back_populates="commands")


class AuditLog(Base):
    """Audit log model."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    event_type = Column(String(255), nullable=False, index=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    actor_user = relationship("User", back_populates="audit_logs")

