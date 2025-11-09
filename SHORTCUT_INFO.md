# ProjectNest Shortcut Command

## What Does the Shortcut Do?

The `run-projectNest` command is a convenient shortcut that automates the entire startup process for ProjectNest. When you run it, it:

### 1. **Dependency Checks** ✅
   - Verifies that Go is installed (required for backend)
   - Verifies that Bun is installed (required for frontend)
   - Exits with helpful error messages if dependencies are missing

### 2. **Dependency Installation** 📦
   - Automatically runs `go mod download` to install Go dependencies
   - Automatically runs `bun install` to install Node.js dependencies
   - Only installs if not already present

### 3. **Backend Server Startup** 🚀
   - Changes to the Backend directory
   - Builds and runs the Go server on port 8080
   - The server handles:
     - REST API endpoints
     - Database connections
     - JWT authentication
     - AI integrations

### 4. **Frontend Development Server Startup** 💻
   - Changes to the Frontend directory
   - Starts the Vite dev server on port 5173
   - Provides hot-reloading for development
   - Serves the React application

### 5. **Parallel Execution** ⚡
   - Runs both servers simultaneously in the same terminal
   - Shows output from both servers with clear labels
   - Monitors both processes
   - Handles graceful shutdown (Ctrl+C kills both servers)

## How to Set It Up

### Step 1: Make scripts executable
```bash
cd /path/to/projectNest
chmod +x start-projectnest.sh setup-alias.sh
```

### Step 2: Run the setup script
```bash
./setup-alias.sh
```

This script will:
- Detect your shell (zsh, bash, or fish)
- Add the alias to your shell configuration file (~/.zshrc, ~/.bashrc, etc.)
- Ask if you want to reload your shell immediately

### Step 3: Reload your shell
```bash
source ~/.zshrc  # for zsh users
# or
source ~/.bashrc  # for bash users
```

Or simply open a new terminal window.

## Usage

Once set up, you can start ProjectNest from **anywhere** on your system:

```bash
run-projectNest
```

That's it! Both servers will start, and you can access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

## What Gets Added to Your Shell Config

The setup script adds this line to your `~/.zshrc` (or equivalent):

```bash
# ProjectNest shortcut - Added by setup-alias.sh
alias run-projectNest='/absolute/path/to/projectNest/start-projectnest.sh'
```

The script uses the absolute path, so the command works from any directory.

## Stopping the Servers

Press `Ctrl+C` in the terminal where you ran `run-projectNest`. Both servers will stop gracefully.

## Troubleshooting

### Command not found
- Make sure you've sourced your shell config: `source ~/.zshrc`
- Or open a new terminal window

### Servers don't start
- Check that Go and Bun are installed: `go version` and `bun --version`
- Verify your `.env` files are set up in both Backend/ and Frontend/ directories
- Check that PostgreSQL is running and accessible

### Port already in use
- Make sure no other applications are using ports 8080 or 5173
- Or change the ports in your `.env` files

## Benefits

✅ **One command** to start everything  
✅ **Works from anywhere** on your system  
✅ **Automatic dependency installation**  
✅ **Clear, colored output** for easy monitoring  
✅ **Graceful shutdown** with Ctrl+C  
✅ **Time-saving** - no need to cd into directories or remember commands  
