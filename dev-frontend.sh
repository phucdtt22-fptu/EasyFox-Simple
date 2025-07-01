#!/bin/bash

# EasyFox Frontend Development Script for GitHub Codespaces
# This script configures environment and starts the frontend

set -e

echo "🦊 Starting EasyFox Frontend..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in Codespaces and update URLs
if [ -n "$CODESPACE_NAME" ]; then
    print_status "Configuring for GitHub Codespaces: $CODESPACE_NAME"
    
    # Get the Codespaces URLs
    FRONTEND_URL="https://$CODESPACE_NAME-3000.app.github.dev"
    BACKEND_URL="https://$CODESPACE_NAME-3001.app.github.dev"
    
    # Update .env file with Codespaces URLs
    print_status "Updating environment URLs..."
    
    # Backup original .env
    cp .env .env.backup 2>/dev/null || true
    
    # Update URLs in .env
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$FRONTEND_URL|g" .env
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$BACKEND_URL|g" .env
    sed -i "s|API_URL=.*|API_URL=$BACKEND_URL|g" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$FRONTEND_URL|g" .env
    
    print_success "Environment configured for Codespaces!"
    
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
    
    echo ""
    echo "🌐 Access URLs:"
    echo "Frontend: $FRONTEND_URL"
    echo "Backend:  $BACKEND_URL"
    echo ""
else
    print_status "Configuring for local development"
    
    # Use localhost URLs for local development
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:3000|g" .env
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:3001|g" .env
    sed -i "s|API_URL=.*|API_URL=http://localhost:3001|g" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:3000|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3000|g" .env
    
    echo ""
    echo "🌐 Access URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:3001"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed!"
fi

# Stop any existing processes and clear ports
print_status "Stopping any existing processes on ports 3000 and 3001..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true

# Kill processes using ports 3000 and 3001
if command -v lsof &> /dev/null; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
else
    # Alternative method if lsof is not available
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 3001/tcp 2>/dev/null || true
fi

print_success "Cleared existing processes and ports!"

# Wait a moment for ports to be released
sleep 2

# Check for API key
if grep -q "your_gemini_api_key_here" .env; then
    print_warning "⚠️  GEMINI_API_KEY is not set!"
    print_warning "Please update .env file with your actual API key from:"
    print_warning "https://makersuite.google.com/app/apikey"
    echo ""
fi

# Start the development server
print_status "Starting Next.js development server..."

# Export environment variables for child processes, but ensure frontend runs on port 3000
export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
export PORT=3000

# Start only the frontend
npx next dev --turbo --port 3000
