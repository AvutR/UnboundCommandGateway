"""Tests for database seeding."""
import os
import json
import pytest
from app.models import Rule, User, UserRole
from app.db import SessionLocal


def test_rules_seeded_on_startup(client, db):
    """Test that rules are seeded from rules_seed.json on startup."""
    # Rules should be seeded by the startup handler
    # Since we're using a test database, we need to manually trigger seeding
    from app.main import seed_rules
    
    # Clear any existing rules
    db.query(Rule).delete()
    db.commit()
    
    # Seed rules
    seed_rules(db)
    
    # Verify rules exist
    rules = db.query(Rule).all()
    assert len(rules) > 0
    
    # Verify specific rules exist
    fork_bomb_rule = db.query(Rule).filter(
        Rule.description.like("%fork bomb%")
    ).first()
    assert fork_bomb_rule is not None
    assert fork_bomb_rule.action.value == "AUTO_REJECT"


def test_default_admin_seeded(client, db):
    """Test that default admin is seeded on startup."""
    from app.main import seed_default_admin
    
    # Clear any existing admins
    db.query(User).filter(User.role == UserRole.ADMIN).delete()
    db.commit()
    
    # Set environment variable
    os.environ["ADMIN_DEFAULT_NAME"] = "test_admin"
    os.environ["ADMIN_DEFAULT_API_KEY"] = "test_admin_key_123"
    
    # Seed admin
    seed_default_admin(db)
    
    # Verify admin exists
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None
    assert admin.name == "test_admin"
    assert admin.api_key == "test_admin_key_123"

