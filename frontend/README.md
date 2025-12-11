# Command Gateway Frontend

A modern React + TypeScript frontend for the Command Gateway system, featuring real-time WebSocket updates, command submission, and admin management interfaces.

## Features

- 🔐 **API Key Authentication** - Secure login with API keys
- 📊 **Dashboard** - Overview of credits, command stats, and recent activity
- 💻 **Command Submission** - Submit commands with real-time feedback
- 📜 **Command History** - View all submitted commands
- 👥 **User Management** (Admin) - Create and manage users
- 🛡️ **Rule Management** (Admin) - Create and manage execution rules
- 🔔 **Real-Time Updates** - WebSocket notifications for command status

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Routing
- **Lucide React** - Icons

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
VITE_API_URL=https://your-backend.up.railway.app
VITE_WS_URL=wss://your-backend.up.railway.app/ws
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Set the root directory to `frontend`
4. Add environment variables:
   - `VITE_API_URL` - Your backend API URL
   - `VITE_WS_URL` - Your WebSocket URL (wss://...)
5. Deploy!

Vercel will automatically:
- Detect Vite as the build tool
- Run `npm run build`
- Serve the `dist` directory

## Project Structure

```
frontend/
├── src/
│   ├── api/           # API client and types
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── store/         # Zustand state management
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind configuration
└── package.json       # Dependencies
```

## Usage

### Login

1. Enter your API key (provided by an administrator)
2. Click "Login"
3. You'll be redirected to the dashboard

### Submit Commands

1. Navigate to "Commands"
2. Enter a command (e.g., `ls -la`, `pwd`)
3. Click "Submit"
4. View the result in real-time

### View History

1. Navigate to "History"
2. See all your submitted commands
3. Filter by status (executed, rejected, pending)

### Admin Features

**User Management:**
- Create new users
- View all users and their credits
- Copy API keys (shown only once on creation)

**Rule Management:**
- Create rules with regex patterns
- Edit existing rules
- Delete rules
- Rules are matched by priority (lower number = higher priority)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.up.railway.app` |
| `VITE_WS_URL` | WebSocket URL | `wss://backend.up.railway.app/ws` |

## Development

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### WebSocket Connection Issues

- Ensure `VITE_WS_URL` is set correctly (must use `wss://` for HTTPS)
- Check that your backend WebSocket endpoint is accessible
- Verify CORS settings on the backend

### API Connection Issues

- Verify `VITE_API_URL` is correct
- Check that the backend is running and accessible
- Ensure your API key is valid

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## License

MIT

