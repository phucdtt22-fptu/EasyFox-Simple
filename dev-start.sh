#!/bin/bash

# EasyFox Development Startup Script for GitHub Codespaces
# This script sets up the environment and starts both frontend and backend

set -e

echo "🦊 Starting EasyFox Development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in Codespaces
if [ -n "$CODESPACE_NAME" ]; then
    print_status "Detected GitHub Codespaces environment: $CODESPACE_NAME"
    
    # Get the Codespaces URL for port 3000 (frontend)
    CODESPACE_URL="https://$CODESPACE_NAME-3000.app.github.dev"
    BACKEND_URL="https://$CODESPACE_NAME-3001.app.github.dev"
    
    print_status "Frontend will be available at: $CODESPACE_URL"
    print_status "Backend will be available at: $BACKEND_URL"
    
    # Update .env file with Codespaces URLs
    print_status "Updating .env file with Codespaces URLs..."
    
    # Create a temporary .env file with updated URLs
    cp .env .env.backup
    
    # Update URLs in .env
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$CODESPACE_URL|g" .env
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$BACKEND_URL|g" .env
    sed -i "s|API_URL=.*|API_URL=$BACKEND_URL|g" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=$CODESPACE_URL|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$CODESPACE_URL|g" .env
    
    print_success "Environment URLs updated successfully!"
    
    # Automatically set ports to public using GitHub CLI
    print_status "Setting ports 3000 and 3001 to public..."
    
    # Check if GitHub CLI is available
    if command -v gh &> /dev/null; then
        # Set port 3000 to public
        gh codespace ports visibility 3000:public -c $CODESPACE_NAME 2>/dev/null || {
            print_warning "Could not auto-set port 3000 to public via CLI"
        }
        
        # Set port 3001 to public  
        gh codespace ports visibility 3001:public -c $CODESPACE_NAME 2>/dev/null || {
            print_warning "Could not auto-set port 3001 to public via CLI"
        }
        
        print_success "Ports set to public automatically!"
    else
        print_warning "GitHub CLI not available. Please manually set ports 3000 and 3001 to PUBLIC in the Ports tab!"
    fi
else
    print_status "Running in local development environment"
    # Use localhost URLs for local development
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:3000|g" .env
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:3001|g" .env
    sed -i "s|API_URL=.*|API_URL=http://localhost:3001|g" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:3000|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3000|g" .env
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Stop any existing processes and clear ports
print_status "Stopping any existing processes and clearing ports..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Kill processes using ports 3000 and 3001
if command -v lsof &> /dev/null; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
else
    # Alternative method if lsof is not available
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 3001/tcp 2>/dev/null || true
fi

print_success "Cleared all existing processes and ports!"

# Wait a moment for ports to be released
sleep 3

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed!"
else
    print_status "Frontend dependencies already installed"
fi

# Check for required environment variables
print_status "Checking environment variables..."

if grep -q "your_gemini_api_key_here" .env; then
    print_warning "GEMINI_API_KEY is not set. Please update .env file with your actual API key."
    print_warning "Get your API key from: https://makersuite.google.com/app/apikey"
fi

# Function to start both frontend and backend
start_services() {
    print_status "Starting development server (frontend + backend)..."
    print_status "This will start both Next.js frontend and Express backend automatically."
    npm run dev &
    DEV_PID=$!
    print_success "Development server started with PID: $DEV_PID"
}

# Function to cleanup processes on exit
cleanup() {
    print_status "Cleaning up processes..."
    if [ ! -z "$DEV_PID" ]; then
        kill $DEV_PID 2>/dev/null || true
    fi
    print_success "Cleanup completed"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Start services
print_status "Starting services..."

# Install backend dependencies first to ensure smooth startup
if [ -d "server" ]; then
    print_status "Ensuring backend dependencies are installed..."
    cd server
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Backend dependencies installed!"
    else
        print_status "Backend dependencies already installed"
    fi
    cd ..
fi

# Start both frontend and backend using npm run dev
start_services

# Wait a moment for services to start
sleep 5

# Print access information
echo ""
echo "🚀 EasyFox Development Environment Started!"
echo "=================================="

if [ -n "$CODESPACE_NAME" ]; then
    echo "Frontend: $CODESPACE_URL"
    echo "Backend:  $BACKEND_URL"
    echo ""
    echo "✅ Ports have been automatically set to public!"
    echo "If auto-configuration failed, manually set ports 3000 and 3001 to public:"
    echo "1. Go to the 'Ports' tab in VS Code"
    echo "2. Right-click on ports 3000 and 3001"
    echo "3. Select 'Port Visibility' → 'Public'"
else
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:3001"
fi

echo ""
echo "📝 Both services are running via npm run dev (concurrently)"
echo "   - Frontend: Next.js with Turbopack"
echo "   - Backend:  Express.js with auto-reload"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================="

# Wait for user input to keep script running
wait
