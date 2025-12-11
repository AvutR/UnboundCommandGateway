"""Rule matching engine."""
import re
import signal
from typing import Optional
from sqlalchemy.orm import Session

from app.models import Rule, RuleAction


class RegexTimeoutError(Exception):
    """Raised when regex matching times out."""
    pass


def _timeout_handler(signum, frame):
    """Signal handler for regex timeout."""
    raise RegexTimeoutError("Regex matching timed out")


def match_rule(command_text: str, db: Session) -> Optional[Rule]:
    """
    Match command text against rules, returning the first matching rule by priority.
    
    Args:
        command_text: The command text to match
        db: Database session
        
    Returns:
        The first matching Rule by priority, or None if no match
    """
    # Load rules ordered by priority (ascending - lower number = higher priority)
    rules = db.query(Rule).order_by(Rule.priority.asc()).all()
    
    for rule in rules:
        try:
            # Set timeout for regex matching (5 seconds)
            if hasattr(signal, 'SIGALRM'):  # Unix only
                signal.signal(signal.SIGALRM, _timeout_handler)
                signal.alarm(5)
            
            try:
                # Compile and match pattern (case-insensitive)
                pattern = re.compile(rule.pattern, re.IGNORECASE)
                if pattern.search(command_text):
                    return rule
            finally:
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)  # Cancel alarm
        except RegexTimeoutError:
            # Skip this rule if it times out
            continue
        except re.error:
            # Skip invalid regex patterns
            continue
    
    return None


def validate_regex_pattern(pattern: str, timeout: int = 5) -> tuple[bool, Optional[str]]:
    """
    Validate a regex pattern for safety.
    
    Args:
        pattern: The regex pattern to validate
        timeout: Timeout in seconds
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        if hasattr(signal, 'SIGALRM'):
            signal.signal(signal.SIGALRM, _timeout_handler)
            signal.alarm(timeout)
        
        try:
            compiled = re.compile(pattern, re.IGNORECASE)
            # Test with empty string
            compiled.search("")
        finally:
            if hasattr(signal, 'SIGALRM'):
                signal.alarm(0)
        
        return True, None
    except RegexTimeoutError:
        return False, "Regex pattern matching timed out - likely catastrophic backtracking"
    except re.error as e:
        return False, f"Invalid regex pattern: {str(e)}"

