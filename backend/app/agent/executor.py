"""Mock command executor."""
import re
from typing import Dict, Any


def simulate_execution(command_text: str) -> Dict[str, Any]:
    """
    Simulate command execution with mock responses.
    
    Args:
        command_text: The command to execute
        
    Returns:
        Dictionary with stdout, stderr, and exit_code
    """
    command_text = command_text.strip()
    
    # Handle ls commands
    if re.match(r'^ls\s', command_text, re.IGNORECASE) or command_text.lower() == 'ls':
        return {
            "stdout": "file1.txt\nfile2.txt\nfile3.txt\n",
            "stderr": "",
            "exit_code": 0
        }
    
    # Handle cat commands
    if re.match(r'^cat\s', command_text, re.IGNORECASE):
        filename = command_text.split()[1] if len(command_text.split()) > 1 else "file.txt"
        return {
            "stdout": f"Contents of {filename}\nLine 1\nLine 2\nLine 3\n",
            "stderr": "",
            "exit_code": 0
        }
    
    # Handle pwd
    if command_text.lower() == 'pwd':
        return {
            "stdout": "/home/user\n",
            "stderr": "",
            "exit_code": 0
        }
    
    # Handle echo
    if re.match(r'^echo\s', command_text, re.IGNORECASE):
        # Extract text after 'echo'
        echo_text = command_text[4:].strip()
        return {
            "stdout": f"{echo_text}\n",
            "stderr": "",
            "exit_code": 0
        }
    
    # Default mock response
    return {
        "stdout": f"Mock execution of: {command_text}\n",
        "stderr": "",
        "exit_code": 0
    }

