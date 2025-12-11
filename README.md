# UnboundCommandGateway

A secure command execution system with rule-based access control, credit management, and comprehensive audit logging. This system allows administrators to configure rules that control which commands can run, with safe commands executing automatically and dangerous commands being blocked.

## 🎯 Overview

The Command Gateway is a full-stack application that provides:

- **API Key Authentication** - Secure access with role-based permissions (admin/member)
- **Rule-Based Command Filtering** - Regex pattern matching with priority-based rule selection
- **Credit System** - Transaction-safe credit deduction for command execution
- **Real-Time Notifications** - WebSocket support for command status updates
- **Audit Logging** - Complete audit trail of all system events
- **Admin Management** - Full CRUD operations for users, rules, and credit management

## 🏗️ Architecture

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (with SQLite support for development)
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Testing**: Pytest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router

## 📁 Project Structure

```
.
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API endpoints (commands, admin, auth)
│   │   ├── agent/        # Business logic (rule engine, executor, credits, audit)
│   │   ├── models.py    # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── db.py         # Database configuration
│   │   └── main.py       # FastAPI app entry point
│   ├── tests/           # Test suite
│   ├── alembic/         # Database migrations
│   ├── requirements.txt
│   └── README.md
│
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── store/       # State management
│   │   └── hooks/       # Custom hooks
│   ├── package.json
│   └── README.md
│
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for local development)
- pip and npm/yarn/pnpm

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/command_gateway"
   export ADMIN_DEFAULT_NAME="admin"
   export ADMIN_DEFAULT_API_KEY="adm_default_ABC123"
   export RULES_SEED_FILE="rules_seed.json"
   ```

   For SQLite (local development):
   ```bash
   export DATABASE_URL="sqlite:///./command_gateway.db"
   ```

5. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000/ws
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🔑 Default Credentials

After starting the backend, a default admin user is created:

- **API Key**: `adm_default_ABC123`
- **Name**: `admin`
- **Role**: `admin`
- **Credits**: `1000`

Use this API key to log in to the frontend.

## 📖 Usage

### For Members

1. **Login** with your API key (provided by an administrator)
2. **View Dashboard** to see your credits and command statistics
3. **Submit Commands** - Enter commands like `ls -la`, `pwd`, `echo hello`
4. **View History** - See all your submitted commands and their status

### For Admins

All member features, plus:

1. **User Management** - Create users, view all users, update user credits
2. **Rule Management** - Create, edit, and delete rules with regex patterns
3. **Audit Logs** - View complete audit trail of all system events

## 🛡️ Default Rules

The system comes with these default rules (from `rules_seed.json`):

| Priority | Pattern | Action | Example Match |
|----------|---------|--------|---------------|
| 1 | `:(){ :|:& };:` | AUTO_REJECT | Fork bomb |
| 2 | `rm\s+-rf\s+/` | AUTO_REJECT | `rm -rf /` |
| 3 | `mkfs\.` | AUTO_REJECT | `mkfs.ext4 /dev/sda` |
| 4 | `git\s+(status|log|diff)` | AUTO_ACCEPT | `git status`, `git log` |
| 5 | `^(ls|cat|pwd|echo)` | AUTO_ACCEPT | `ls -la`, `cat file.txt` |

Rules are matched by priority (lower number = higher priority). First match wins.

## 🔌 API Documentation

### Command Submission

**POST /commands**

Submit a command for execution.

```bash
curl -X POST http://localhost:8000/commands \
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

### Admin Endpoints

**POST /admin/users** - Create a new user
**GET /admin/users** - List all users
**PUT /admin/users/{user_id}** - Update user credits
**GET /admin/rules** - List all rules
**POST /admin/rules** - Create a new rule
**PUT /admin/rules/{rule_id}** - Update a rule
**DELETE /admin/rules/{rule_id}** - Delete a rule
**GET /admin/audit-logs** - View audit logs

See `backend/README.md` for complete API documentation.

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 🐳 Docker Deployment

### Backend

```bash
cd backend
docker build -t command-gateway .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e ADMIN_DEFAULT_API_KEY="adm_default_ABC123" \
  command-gateway
```

### Docker Compose (Full Stack)

```bash
docker-compose up
```

## ☁️ Production Deployment

### Backend (Railway)

1. Sign in to [Railway](https://railway.app)
2. New Project → Deploy from GitHub → Select `backend` folder
3. Add environment variables (see `backend/README.md`)
4. Deploy!

### Frontend (Vercel)

1. Sign in to [Vercel](https://vercel.com)
2. Import repository → Select `frontend` folder
3. Add environment variables:
   - `VITE_API_URL` - Your backend URL
   - `VITE_WS_URL` - Your WebSocket URL (wss://...)
4. Deploy!

See `backend/README.md` and `frontend/README.md` for detailed deployment instructions.

## 🔒 Security Considerations

- **API Keys**: Currently stored as plaintext for demo. In production, use bcrypt hashing.
- **Regex Safety**: Regex patterns are validated with timeout protection to prevent catastrophic backtracking.
- **Transaction Safety**: Credit deduction uses `SELECT FOR UPDATE` to prevent race conditions.
- **CORS**: Configure `ALLOW_CORS_ORIGINS` to restrict frontend origins.

## 📝 Features

### ✅ Core Features

- [x] API Key Authentication
- [x] Role-based access control (admin/member)
- [x] Command submission and execution (mocked)
- [x] Rule-based command filtering (regex patterns)
- [x] Credit system with transaction safety
- [x] Audit logging
- [x] WebSocket real-time notifications
- [x] Admin user management
- [x] Admin rule management
- [x] Admin audit log viewing

### 🎁 Bonus Features

- [x] REQUIRE_APPROVAL action for risky commands
- [x] WebSocket notifications for approval requests
- [x] Credit management UI for admins
- [x] Comprehensive audit trail

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT

## 🆘 Support

For issues and questions, please open an issue on GitHub.

## 🎥 Demo

See the demo video (2-3 minutes) showing:
- User login and authentication
- Command submission (safe and dangerous commands)
- Rule matching and execution
- Admin features (user management, rule management, audit logs)
- Real-time WebSocket notifications

---

**Built with ❤️ for secure command execution**

