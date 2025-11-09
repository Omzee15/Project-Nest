#!/bin/bash

# ProjectNest Startup Script
# This script sets up and runs both the backend and frontend servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/Backend"
FRONTEND_DIR="$SCRIPT_DIR/Frontend"

# PID files for tracking processes
BACKEND_PID_FILE="/tmp/projectnest_backend.pid"
FRONTEND_PID_FILE="/tmp/projectnest_frontend.pid"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "$CYAN" "╔════════════════════════════════════════════════════════╗"
    print_message "$CYAN" "║                                                        ║"
    print_message "$CYAN" "║              🚀 ProjectNest Launcher 🚀               ║"
    print_message "$CYAN" "║                                                        ║"
    print_message "$CYAN" "╚════════════════════════════════════════════════════════╝"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_message "$BLUE" "🔍 Checking prerequisites..."
    
    # Check Go
    if ! command -v go &> /dev/null; then
        print_message "$RED" "❌ Go is not installed. Please install Go 1.24 or higher."
        exit 1
    fi
    print_message "$GREEN" "✓ Go installed: $(go version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_message "$RED" "❌ Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    print_message "$GREEN" "✓ Node.js installed: $(node --version)"
    
    # Check for Bun or npm
    if command -v bun &> /dev/null; then
        PACKAGE_MANAGER="bun"
        print_message "$GREEN" "✓ Bun installed: $(bun --version)"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        print_message "$GREEN" "✓ npm installed: $(npm --version)"
    else
        print_message "$RED" "❌ Neither Bun nor npm is installed. Please install one."
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_message "$YELLOW" "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is running."
    else
        print_message "$GREEN" "✓ PostgreSQL installed"
    fi
    
    echo ""
}

# Function to check environment files
check_env_files() {
    print_message "$BLUE" "📝 Checking environment files..."
    
    local missing_env=false
    
    # Check Backend .env
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_message "$YELLOW" "⚠️  Backend .env file not found!"
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            print_message "$CYAN" "   Creating from .env.example..."
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_message "$YELLOW" "   Please configure $BACKEND_DIR/.env with your database credentials"
            missing_env=true
        else
            print_message "$RED" "❌ .env.example not found in Backend directory"
            exit 1
        fi
    else
        print_message "$GREEN" "✓ Backend .env found"
    fi
    
    # Check Frontend .env
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_message "$YELLOW" "⚠️  Frontend .env file not found!"
        if [ -f "$FRONTEND_DIR/.env.example" ]; then
            print_message "$CYAN" "   Creating from .env.example..."
            cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
            print_message "$YELLOW" "   Please configure $FRONTEND_DIR/.env with your API keys"
            missing_env=true
        else
            print_message "$RED" "❌ .env.example not found in Frontend directory"
            exit 1
        fi
    else
        print_message "$GREEN" "✓ Frontend .env found"
    fi
    
    if [ "$missing_env" = true ]; then
        echo ""
        print_message "$RED" "⚠️  Environment files were created. Please configure them before running."
        print_message "$YELLOW" "   1. Set up your PostgreSQL database credentials in Backend/.env"
        print_message "$YELLOW" "   2. Add your Google Gemini API key in Frontend/.env"
        print_message "$YELLOW" "   3. Run this script again after configuration"
        exit 1
    fi
    
    echo ""
}

# Function to install dependencies
install_dependencies() {
    print_message "$BLUE" "📦 Installing dependencies..."
    
    # Backend dependencies
    print_message "$CYAN" "   Installing backend dependencies..."
    cd "$BACKEND_DIR"
    if go mod download; then
        print_message "$GREEN" "   ✓ Backend dependencies installed"
    else
        print_message "$RED" "   ❌ Failed to install backend dependencies"
        exit 1
    fi
    
    # Frontend dependencies
    print_message "$CYAN" "   Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        if [ "$PACKAGE_MANAGER" = "bun" ]; then
            if bun install; then
                print_message "$GREEN" "   ✓ Frontend dependencies installed"
            else
                print_message "$RED" "   ❌ Failed to install frontend dependencies"
                exit 1
            fi
        else
            if npm install; then
                print_message "$GREEN" "   ✓ Frontend dependencies installed"
            else
                print_message "$RED" "   ❌ Failed to install frontend dependencies"
                exit 1
            fi
        fi
    else
        print_message "$GREEN" "   ✓ Frontend dependencies already installed"
    fi
    
    cd "$SCRIPT_DIR"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    print_message "$YELLOW" "\n\n🛑 Shutting down ProjectNest..."
    
    # Kill backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null || true
            print_message "$GREEN" "✓ Backend stopped"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID 2>/dev/null || true
            print_message "$GREEN" "✓ Frontend stopped"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    print_message "$CYAN" "\n👋 ProjectNest stopped. Goodbye!\n"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Function to start backend
start_backend() {
    print_message "$BLUE" "🚀 Starting backend server..."
    cd "$BACKEND_DIR"
    
    # Start backend in background
    go run cmd/server/main.go > /tmp/projectnest_backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    
    # Wait a bit and check if it's running
    sleep 3
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        print_message "$GREEN" "✓ Backend started (PID: $BACKEND_PID)"
        print_message "$CYAN" "   Logs: tail -f /tmp/projectnest_backend.log"
    else
        print_message "$RED" "❌ Failed to start backend. Check logs: cat /tmp/projectnest_backend.log"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
    echo ""
}

# Function to start frontend
start_frontend() {
    print_message "$BLUE" "🎨 Starting frontend server..."
    cd "$FRONTEND_DIR"
    
    # Start frontend in background
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun dev > /tmp/projectnest_frontend.log 2>&1 &
    else
        npm run dev > /tmp/projectnest_frontend.log 2>&1 &
    fi
    
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    
    # Wait a bit and check if it's running
    sleep 3
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        print_message "$GREEN" "✓ Frontend started (PID: $FRONTEND_PID)"
        print_message "$CYAN" "   Logs: tail -f /tmp/projectnest_frontend.log"
    else
        print_message "$RED" "❌ Failed to start frontend. Check logs: cat /tmp/projectnest_frontend.log"
        cleanup
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
    echo ""
}

# Function to display access information
show_access_info() {
    echo ""
    print_message "$GREEN" "╔════════════════════════════════════════════════════════╗"
    print_message "$GREEN" "║                                                        ║"
    print_message "$GREEN" "║           ✨ ProjectNest is now running! ✨           ║"
    print_message "$GREEN" "║                                                        ║"
    print_message "$GREEN" "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_message "$CYAN" "🌐 Access URLs:"
    print_message "$MAGENTA" "   Frontend:  http://localhost:5173"
    print_message "$MAGENTA" "   Backend:   http://localhost:8080"
    print_message "$MAGENTA" "   API Docs:  http://localhost:8080/api"
    echo ""
    print_message "$CYAN" "📊 Monitoring:"
    print_message "$YELLOW" "   Backend logs:  tail -f /tmp/projectnest_backend.log"
    print_message "$YELLOW" "   Frontend logs: tail -f /tmp/projectnest_frontend.log"
    echo ""
    print_message "$CYAN" "🛑 To stop the servers:"
    print_message "$YELLOW" "   Press Ctrl+C in this terminal"
    echo ""
    print_message "$GREEN" "═══════════════════════════════════════════════════════════"
    echo ""
}

# Main execution
main() {
    print_header
    check_prerequisites
    check_env_files
    install_dependencies
    start_backend
    start_frontend
    show_access_info
    
    # Keep script running and wait for user to stop
    print_message "$CYAN" "Press Ctrl+C to stop all servers..."
    
    # Wait for both processes
    while true; do
        # Check if processes are still running
        if [ -f "$BACKEND_PID_FILE" ]; then
            BACKEND_PID=$(cat "$BACKEND_PID_FILE")
            if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
                print_message "$RED" "\n❌ Backend process died unexpectedly!"
                cleanup
                exit 1
            fi
        fi
        
        if [ -f "$FRONTEND_PID_FILE" ]; then
            FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
            if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
                print_message "$RED" "\n❌ Frontend process died unexpectedly!"
                cleanup
                exit 1
            fi
        fi
        
        sleep 5
    done
}

# Run main function
main
