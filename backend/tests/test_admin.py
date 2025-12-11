"""Tests for admin endpoints."""
import pytest
from app.models import User, Rule, UserRole, RuleAction


def test_create_user(client, admin_user):
    """Test creating a new user via admin endpoint."""
    response = client.post(
        "/admin/users",
        json={"name": "New User", "role": "member"},
        headers={"X-API-KEY": admin_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New User"
    assert data["role"] == "member"
    assert "api_key" in data
    assert data["api_key"].startswith("usr_")


def test_create_user_non_admin(client, member_user):
    """Test that non-admin users cannot create users."""
    response = client.post(
        "/admin/users",
        json={"name": "New User", "role": "member"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 403


def test_list_users(client, admin_user, member_user):
    """Test listing all users (admin only)."""
    response = client.get(
        "/admin/users",
        headers={"X-API-KEY": admin_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    user_names = [u["name"] for u in data]
    assert "Test Admin" in user_names
    assert "Test Member" in user_names


def test_create_rule(client, admin_user):
    """Test creating a new rule."""
    response = client.post(
        "/admin/rules",
        json={
            "priority": 10,
            "pattern": "^test",
            "action": "AUTO_ACCEPT",
            "description": "Test rule"
        },
        headers={"X-API-KEY": admin_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == 10
    assert data["pattern"] == "^test"
    assert data["action"] == "AUTO_ACCEPT"


def test_create_rule_invalid_regex(client, admin_user):
    """Test that invalid regex patterns are rejected."""
    response = client.post(
        "/admin/rules",
        json={
            "priority": 10,
            "pattern": "[invalid regex",
            "action": "AUTO_ACCEPT"
        },
        headers={"X-API-KEY": admin_user.api_key}
    )
    
    assert response.status_code == 400
    assert "Invalid regex" in response.json()["detail"]


def test_update_rule(client, admin_user, seed_rules):
    """Test updating a rule."""
    # Get first rule
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        rule = db.query(Rule).first()
        rule_id = rule.id
    finally:
        db.close()
    
    response = client.put(
        f"/admin/rules/{rule_id}",
        json={"priority": 99},
        headers={"X-API-KEY": admin_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == 99


def test_delete_rule(client, admin_user, seed_rules):
    """Test deleting a rule."""
    # Get first rule
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        rule = db.query(Rule).first()
        rule_id = rule.id
    finally:
        db.close()
    
    response = client.delete(
        f"/admin/rules/{rule_id}",
        headers={"X-API-KEY": admin_user.api_key}
    )
    
    assert response.status_code == 204
    
    # Verify rule is deleted
    db = SessionLocal()
    try:
        deleted_rule = db.query(Rule).filter(Rule.id == rule_id).first()
        assert deleted_rule is None
    finally:
        db.close()

