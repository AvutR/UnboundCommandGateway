"""Tests for transaction safety and concurrency."""
import threading
import time
import pytest
from app.models import User, Command
from app.db import SessionLocal


def test_concurrent_credit_deduction(client, member_user, seed_rules):
    """Test that concurrent command submissions don't cause credit race conditions."""
    # Set user to have exactly 1 credit
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == member_user.id).first()
        user.credits = 1
        db.commit()
    finally:
        db.close()
    
    results = []
    errors = []
    
    def submit_command():
        try:
            response = client.post(
                "/commands",
                json={"command_text": "ls"},
                headers={"X-API-KEY": member_user.api_key}
            )
            results.append(response.json())
        except Exception as e:
            errors.append(str(e))
    
    # Submit two commands concurrently
    thread1 = threading.Thread(target=submit_command)
    thread2 = threading.Thread(target=submit_command)
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
    
    # One should succeed, one should fail due to insufficient credits
    assert len(results) == 2
    success_count = sum(1 for r in results if r.get("status") == "executed")
    reject_count = sum(1 for r in results if r.get("status") == "rejected")
    
    assert success_count == 1, "Exactly one command should succeed"
    assert reject_count == 1, "Exactly one command should be rejected"
    
    # Verify final credit balance is 0
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == member_user.id).first()
        assert user.credits == 0, "Final balance should be 0"
    finally:
        db.close()

