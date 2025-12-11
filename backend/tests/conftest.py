"""Pytest configuration and fixtures."""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import app
from app.models import User, Rule, UserRole, RuleAction

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Create a test admin user."""
    user = User(
        name="Test Admin",
        api_key="test_admin_key",
        role=UserRole.ADMIN,
        credits=1000
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def member_user(db):
    """Create a test member user."""
    user = User(
        name="Test Member",
        api_key="test_member_key",
        role=UserRole.MEMBER,
        credits=100
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def seed_rules(db):
    """Seed test rules."""
    rules = [
        Rule(
            priority=1,
            pattern=r"^rm\s+-rf\s+/",
            action=RuleAction.AUTO_REJECT,
            description="Reject dangerous rm -rf / commands"
        ),
        Rule(
            priority=2,
            pattern=r":\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:",
            action=RuleAction.AUTO_REJECT,
            description="Reject fork bomb patterns"
        ),
        Rule(
            priority=5,
            pattern=r"^ls|^cat|^pwd|^echo",
            action=RuleAction.AUTO_ACCEPT,
            description="Auto-accept safe read-only commands"
        ),
        Rule(
            priority=100,
            pattern=".*",
            action=RuleAction.AUTO_REJECT,
            description="Default: reject all unmatched commands"
        ),
    ]
    for rule in rules:
        db.add(rule)
    db.commit()
    return rules

