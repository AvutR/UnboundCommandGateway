"""Tests for command submission endpoint."""
import pytest
from app.models import Command, ActionTaken, UserRole


def test_auto_accept_command(client, member_user, seed_rules):
    """Test that safe commands are auto-accepted and credits are deducted."""
    response = client.post(
        "/commands",
        json={"command_text": "ls -la"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "executed"
    assert data["new_balance"] == 99
    assert "result" in data
    assert data["result"]["exit_code"] == 0
    assert "stdout" in data["result"]


def test_auto_reject_fork_bomb(client, member_user, seed_rules):
    """Test that fork bomb commands are auto-rejected."""
    response = client.post(
        "/commands",
        json={"command_text": ":(){ :|:& };:"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["reason"] == "AUTO_REJECT"


def test_insufficient_credits(client, member_user, seed_rules):
    """Test that commands are rejected when user has insufficient credits."""
    # Set credits to 0
    member_user.credits = 0
    client.app.dependency_overrides[lambda: None] = lambda: None  # Keep db session
    
    # Get fresh session
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        db_user = db.query(type(member_user)).filter_by(id=member_user.id).first()
        db_user.credits = 0
        db.commit()
    finally:
        db.close()
    
    # Use the test client's db session
    response = client.post(
        "/commands",
        json={"command_text": "ls -la"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["reason"] == "INSUFFICIENT_CREDITS"


def test_no_matching_rule(client, member_user, seed_rules):
    """Test that commands with no matching rule are rejected."""
    response = client.post(
        "/commands",
        json={"command_text": "some_random_command_xyz"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["reason"] == "NO_MATCHING_RULE"


def test_rule_priority(client, member_user, seed_rules):
    """Test that rules with lower priority numbers are matched first."""
    # Both patterns could match "ls", but priority 5 (AUTO_ACCEPT) should win
    response = client.post(
        "/commands",
        json={"command_text": "ls"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "executed"  # Should be accepted, not rejected


def test_command_record_created(client, member_user, seed_rules):
    """Test that command records are created in the database."""
    response = client.post(
        "/commands",
        json={"command_text": "ls -la"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    command_id = response.json()["command_id"]
    
    # Verify command exists in database
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        command = db.query(Command).filter(Command.id == command_id).first()
        assert command is not None
        assert command.command_text == "ls -la"
        assert command.action_taken == ActionTaken.ACCEPTED
        assert command.cost == 1
        assert command.result is not None
    finally:
        db.close()


def test_list_commands(client, member_user, seed_rules):
    """Test listing commands for a user."""
    # Submit a command first
    client.post(
        "/commands",
        json={"command_text": "ls -la"},
        headers={"X-API-KEY": member_user.api_key}
    )
    
    # List commands
    response = client.get(
        "/commands",
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["command_text"] == "ls -la"


def test_get_command_by_id(client, member_user, seed_rules):
    """Test getting a specific command by ID."""
    # Submit a command
    create_response = client.post(
        "/commands",
        json={"command_text": "pwd"},
        headers={"X-API-KEY": member_user.api_key}
    )
    command_id = create_response.json()["command_id"]
    
    # Get command by ID
    response = client.get(
        f"/commands/{command_id}",
        headers={"X-API-KEY": member_user.api_key}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == command_id
    assert data["command_text"] == "pwd"


def test_invalid_api_key(client):
    """Test that invalid API key returns 401."""
    response = client.post(
        "/commands",
        json={"command_text": "ls -la"},
        headers={"X-API-KEY": "invalid_key"}
    )
    
    assert response.status_code == 401

