# 🚀 Quick Setup Guide

This guide will help you get ProjectNest up and running in minutes.

## Prerequisites

Make sure you have the following installed:
- **Go 1.24+**: [Download Go](https://go.dev/dl/)
- **Node.js 18+**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL 14+**: [Download PostgreSQL](https://www.postgresql.org/download/)
- **Bun** (optional, but recommended): [Install Bun](https://bun.sh/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/Omzee15/projectNest.git
cd projectNest
```

## Step 2: Setup PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE projectnest;

# Create user (optional, if you want a dedicated user)
CREATE USER projectnest_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE projectnest TO projectnest_user;

# Exit
\q
```

## Step 3: Configure Environment Variables

The startup script will create `.env` files from the examples if they don't exist. Configure them:

### Backend Configuration (`Backend/.env`)

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=projectnest
DB_SSLMODE=disable

# Server Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0

# Application Configuration
APP_ENV=development
LOG_LEVEL=info

# CORS Configuration
FRONTEND_PORT=5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Configuration (`Frontend/.env`)

```bash
# Frontend Port
VITE_PORT=5173
VITE_BACKEND_PORT=8080
VITE_API_BASE_URL=http://localhost:8080/api

# Google Gemini AI Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 4: Run the Startup Script

The easiest way to start ProjectNest:

```bash
./start-projectnest.sh
```

This script will:
- ✅ Check all prerequisites
- ✅ Verify environment files exist
- ✅ Install all dependencies
- ✅ Start the backend server
- ✅ Start the frontend development server
- ✅ Monitor both processes

## Step 5: Access the Application

Once the script shows "ProjectNest is now running!", open your browser:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Base**: http://localhost:8080/api

## Manual Setup (Alternative)

If you prefer to run the servers manually:

### Backend

```bash
cd Backend
go mod download
go run cmd/server/main.go
```

### Frontend

```bash
cd Frontend

# Using Bun
bun install
bun dev

# Or using npm
npm install
npm run dev
```

## Stopping the Application

When using the startup script, simply press **Ctrl+C** in the terminal. The script will gracefully shut down both servers.

## Troubleshooting

### Port Already in Use

If you see an error about ports already in use:

```bash
# Check what's using the ports
lsof -i :8080  # Backend
lsof -i :5173  # Frontend

# Kill the process
kill -9 <PID>
```

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check your database credentials in `Backend/.env`

3. Test the connection:
   ```bash
   psql -h localhost -U postgres -d projectnest
   ```

### Go Module Errors

```bash
cd Backend
go mod tidy
go mod download
```

### Frontend Dependencies Issues

```bash
cd Frontend

# Using Bun
bun install --force

# Using npm
rm -rf node_modules package-lock.json
npm install
```

## Database Migrations

The application will automatically run migrations on startup. If you need to run them manually:

```bash
cd Backend
# Migrations are in the migrations/ folder
# They run automatically when the server starts
```

## Development Tips

### View Logs

Backend logs:
```bash
tail -f /tmp/projectnest_backend.log
```

Frontend logs:
```bash
tail -f /tmp/projectnest_frontend.log
```

### Building for Production

Backend:
```bash
cd Backend
go build -o projectnest-server cmd/server/main.go
./projectnest-server
```

Frontend:
```bash
cd Frontend
bun run build  # or npm run build
bun run preview  # or npm run preview
```

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to `Frontend/.env`

## Next Steps

1. Register a new account at http://localhost:5173
2. Create your first project
3. Try the AI project generation feature
4. Explore the brainstorm canvas and flowchart tools
5. Add team members and collaborate!

## Need Help?

- Check the [main README](README.md) for more details
- Open an issue on [GitHub](https://github.com/Omzee15/projectNest/issues)
- Review the logs for error messages

---

Happy project managing! 🚀
