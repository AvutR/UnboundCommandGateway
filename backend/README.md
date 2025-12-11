# Command Gateway Backend

A production-ready FastAPI backend for secure command execution with rule-based access control, credit management, and real-time WebSocket notifications.

## Features

- **API Key Authentication** - Secure access with role-based permissions (admin/member)
- **Rule-Based Command Filtering** - Regex pattern matching with priority-based rule selection
- **Credit System** - Transaction-safe credit deduction for command execution
- **Real-Time Notifications** - WebSocket support for command status updates
- **Audit Logging** - Complete audit trail of all system events
- **Admin Management** - Full CRUD operations for users and rules

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app and startup logic
│   ├── db.py                # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── api/
│   │   ├── commands.py      # Command submission endpoints
│   │   ├── admin.py         # Admin management endpoints
│   │   └── auth.py          # Authentication middleware
│   ├── agent/
│   │   ├── rule_engine.py   # Rule matching engine
│   │   ├── executor.py      # Mock command executor
│   │   ├── credits.py       # Credit management
│   │   └── audit.py         # Audit logging
│   └── notifications/
│       └── ws.py            # WebSocket manager
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── requirements.txt
├── Dockerfile
└── rules_seed.json          # Default rule set
```

## Setup Instructions

### Part A: Deploy to Production (Free Services)

#### 1. Create Postgres Database (Neon)

1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project named `command-gateway-db`
3. Copy the **pooled connection string** from Connection Details
4. Format: `postgresql://user:password@host/db?sslmode=require`

#### 2. Deploy Backend to Railway

1. Sign in to [https://railway.app](https://railway.app) with GitHub
2. New Project → Deploy from GitHub → Select your repo and `backend` folder
3. Add Environment Variables in Railway:

```bash
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
API_SECRET=<long-random-string>
ADMIN_DEFAULT_NAME=admin
ADMIN_DEFAULT_API_KEY=adm_default_ABC123
ALLOW_CORS_ORIGINS=https://<your-frontend>.vercel.app
RULES_SEED_FILE=rules_seed.json
```

4. Set Start Command:
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

5. Railway will generate a URL like `https://your-backend.up.railway.app`
6. Verify: Visit `https://your-backend.up.railway.app/docs` to see Swagger UI

#### 3. Deploy Frontend to Vercel (Optional)

1. Sign in to [https://vercel.com](https://vercel.com)
2. Import your repo → Select `frontend` folder
3. Add Environment Variables:
```bash
VITE_API_URL=https://<your-backend>.up.railway.app
VITE_WS_URL=wss://<your-backend>.up.railway.app/ws
```

### Part B: Local Development

#### Prerequisites

- Python 3.11+
- PostgreSQL (or use Docker Compose)
- pip

#### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:password@localhost/command_gateway"
export ADMIN_DEFAULT_NAME="admin"
export ADMIN_DEFAULT_API_KEY="adm_default_ABC123"
export RULES_SEED_FILE="rules_seed.json"
```

5. Run migrations:
```bash
alembic upgrade head
```

6. Start the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## API Endpoints

### Command Submission

**POST /commands**

Submit a command for execution.

```bash
curl -X POST https://your-backend.up.railway.app/commands \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <user_api_key>" \
  -d '{"command_text":"ls -la"}'
```

**Response:**
```json
{
  "status": "executed",
  "result": {
    "stdout": "file1.txt\nfile2.txt\n",
    "stderr": "",
    "exit_code": 0
  },
  "new_balance": 99,
  "command_id": "uuid-here"
}
```

**GET /commands**

List all commands for the current user.

```bash
curl -X GET https://your-backend.up.railway.app/commands \
  -H "X-API-KEY: <user_api_key>"
```

**GET /commands/{command_id}**

Get a specific command by ID.

```bash
curl -X GET https://your-backend.up.railway.app/commands/<command_id> \
  -H "X-API-KEY: <user_api_key>"
```

### Admin Endpoints

**POST /admin/users**

Create a new user (admin only).

```bash
curl -X POST https://your-backend.up.railway.app/admin/users \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <admin_api_key>" \
  -d '{"name":"New User","role":"member"}'
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New User",
  "role": "member",
  "credits": 100,
  "created_at": "2024-01-01T00:00:00",
  "api_key": "usr_<token>"  // Shown only once!
}
```

**GET /admin/users**

List all users (admin only).

```bash
curl -X GET https://your-backend.up.railway.app/admin/users \
  -H "X-API-KEY: <admin_api_key>"
```

**POST /admin/rules**

Create a new rule (admin only).

```bash
curl -X POST https://your-backend.up.railway.app/admin/rules \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <admin_api_key>" \
  -d '{
    "priority": 10,
    "pattern": "^test",
    "action": "AUTO_ACCEPT",
    "description": "Test rule"
  }'
```

**PUT /admin/rules/{rule_id}**

Update a rule (admin only).

```bash
curl -X PUT https://your-backend.up.railway.app/admin/rules/<rule_id> \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <admin_api_key>" \
  -d '{"priority": 99}'
```

**DELETE /admin/rules/{rule_id}**

Delete a rule (admin only).

```bash
curl -X DELETE https://your-backend.up.railway.app/admin/rules/<rule_id> \
  -H "X-API-KEY: <admin_api_key>"
```

### WebSocket

**GET /ws**

Connect to WebSocket for real-time notifications.

```javascript
const ws = new WebSocket('wss://your-backend.up.railway.app/ws?api_key=<user_api_key>');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
  // {
  //   "type": "command_update",
  //   "command_id": "uuid",
  //   "status": "executed",
  //   "result": {...},
  //   "new_balance": 99
  // }
};
```

## Example Test Cases

### 1. Submit Safe Command

```bash
curl -X POST https://your-backend.up.railway.app/commands \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <user_api_key>" \
  -d '{"command_text":"ls -la"}'
```

**Expected:** `{"status":"executed","result":{...},"new_balance":99}`

### 2. Submit Fork Bomb (Auto-Reject)

```bash
curl -X POST https://your-backend.up.railway.app/commands \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <user_api_key>" \
  -d '{"command_text":":(){ :|:& };:"}'
```

**Expected:** `{"status":"rejected","reason":"AUTO_REJECT"}`

### 3. Submit Dangerous Command (Require Approval)

```bash
curl -X POST https://your-backend.up.railway.app/commands \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <user_api_key>" \
  -d '{"command_text":"mkfs /dev/sda1"}'
```

**Expected:** `{"status":"pending"}`

## Running Tests

```bash
# Install test dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_commands.py
```

## Test Coverage

The test suite covers:

- ✅ Rule seeding on startup
- ✅ Auto-accept safe commands
- ✅ Auto-reject dangerous commands (fork bomb, rm -rf /)
- ✅ Insufficient credits handling
- ✅ Transaction safety (concurrent requests)
- ✅ Rule priority matching
- ✅ Admin endpoints (CRUD)
- ✅ Command record creation
- ✅ API key authentication

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Docker

### Build and Run

```bash
docker build -t command-gateway .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e ADMIN_DEFAULT_API_KEY="adm_default_ABC123" \
  command-gateway
```

### Docker Compose (Local Development)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: command_gateway
    ports:
      - "5432:5432"
  
  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://user:password@db/command_gateway
      ADMIN_DEFAULT_API_KEY: adm_default_ABC123
    ports:
      - "8000:8000"
    depends_on:
      - db
```

Run:
```bash
docker-compose up
```

## Default Rules

The system seeds with these default rules (from `rules_seed.json`):

1. **Priority 1**: Reject `rm -rf /` commands
2. **Priority 2**: Reject fork bomb patterns
3. **Priority 3**: Require approval for disk operations (`mkfs`, `fdisk`, `dd`)
4. **Priority 4**: Require approval for system shutdown commands
5. **Priority 5**: Auto-accept safe read-only commands (`ls`, `cat`, `pwd`, `echo`)
6. **Priority 100**: Default reject all unmatched commands

## Security Considerations

- **API Keys**: Currently stored as plaintext for demo. In production, use bcrypt hashing.
- **Regex Safety**: Regex patterns are validated with timeout protection to prevent catastrophic backtracking.
- **Transaction Safety**: Credit deduction uses `SELECT FOR UPDATE` to prevent race conditions.
- **CORS**: Configure `ALLOW_CORS_ORIGINS` to restrict frontend origins.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

