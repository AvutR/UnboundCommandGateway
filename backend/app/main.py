"""FastAPI application entry point."""
import os
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db import engine, get_db, Base
from app.models import Rule, User, UserRole, RuleAction
from app.api import commands, admin
from app.notifications import ws

# Create database tables
Base.metadata.create_all(bind=engine)

# CORS origins
ALLOW_CORS_ORIGINS = os.getenv("ALLOW_CORS_ORIGINS", "").split(",") if os.getenv("ALLOW_CORS_ORIGINS") else ["*"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Seed rules and default admin
    db = next(get_db())
    try:
        seed_rules(db)
        seed_default_admin(db)
    finally:
        db.close()
    
    yield
    
    # Shutdown: cleanup if needed
    pass


app = FastAPI(
    title="Command Gateway API",
    description="API for secure command execution with rule-based access control",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(commands.router)
app.include_router(admin.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Command Gateway API", "version": "1.0.0"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time notifications."""
    from fastapi import WebSocket
    from app.db import SessionLocal
    
    # Get API key from query parameter or header
    api_key = websocket.query_params.get("api_key") or websocket.headers.get("X-API-KEY")
    
    if not api_key:
        await websocket.close(code=1008, reason="Missing API key")
        return
    
    # Authenticate user
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            await websocket.close(code=1008, reason="Invalid API key")
            return
        
        # Connect WebSocket
        await ws.connect_websocket(websocket, user.id)
        
        # Keep connection alive
        try:
            while True:
                # Wait for messages (client can send ping/pong)
                data = await websocket.receive_text()
                # Echo back or handle ping
                if data == "ping":
                    await websocket.send_text("pong")
        except Exception:
            pass
        finally:
            await ws.disconnect_websocket(websocket, user.id)
    finally:
        db.close()


def seed_rules(db: Session):
    """Seed rules from rules_seed.json if rules table is empty."""
    # Check if rules already exist
    if db.query(Rule).count() > 0:
        return
    
    # Load rules from file
    rules_file = os.getenv("RULES_SEED_FILE", "rules_seed.json")
    rules_path = os.path.join(os.path.dirname(__file__), "..", rules_file)
    
    if not os.path.exists(rules_path):
        # Try in current directory
        rules_path = rules_file
        if not os.path.exists(rules_path):
            print(f"Warning: {rules_file} not found, skipping rule seeding")
            return
    
    with open(rules_path, "r") as f:
        rules_data = json.load(f)
    
    for rule_data in rules_data:
        rule = Rule(
            priority=rule_data["priority"],
            pattern=rule_data["pattern"],
            action=RuleAction(rule_data["action"]),
            description=rule_data.get("description", "")
        )
        db.add(rule)
    
    db.commit()
    print(f"Seeded {len(rules_data)} rules from {rules_file}")


def seed_default_admin(db: Session):
    """Seed default admin user if no admin exists."""
    # Check if admin exists
    admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin_exists:
        return
    
    # Get admin credentials from environment
    admin_name = os.getenv("ADMIN_DEFAULT_NAME", "admin")
    admin_api_key = os.getenv("ADMIN_DEFAULT_API_KEY", "adm_default_ABC123")
    
    admin_user = User(
        name=admin_name,
        api_key=admin_api_key,
        role=UserRole.ADMIN,
        credits=1000  # Admin gets more credits
    )
    
    db.add(admin_user)
    db.commit()
    print(f"Seeded default admin user: {admin_name}")

