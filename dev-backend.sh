#!/bin/bash

# EasyFox Backend Development Script for GitHub Codespaces
# This script configures environment and starts the backend server

set -e

echo "🦊 Starting EasyFox Backend..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to sync environment variables from main .env to server .env
sync_env_vars() {
    local main_env="../.env"
    local server_env=".env"
    
    if [ -f "$main_env" ]; then
        print_status "Syncing environment variables from main .env to server .env"
        
        # Extract critical variables from main .env
        local gemini_key=$(grep "^GEMINI_API_KEY=" "$main_env" | cut -d'=' -f2)
        local supabase_url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$main_env" | cut -d'=' -f2)
        local supabase_key=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$main_env" | cut -d'=' -f2)
        local jwt_secret=$(grep "^JWT_SECRET=" "$main_env" | cut -d'=' -f2)
        local n8n_url=$(grep "^N8N_WEBHOOK_URL=" "$main_env" | cut -d'=' -f2)
        local cors_origin=$(grep "^CORS_ORIGIN=" "$main_env" | cut -d'=' -f2)
        local frontend_url=$(grep "^FRONTEND_URL=" "$main_env" | cut -d'=' -f2)
        
        # Update server .env with critical variables
        if [ -n "$gemini_key" ]; then
            if grep -q "^GEMINI_API_KEY=" "$server_env"; then
                sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$gemini_key|" "$server_env"
            else
                echo "GEMINI_API_KEY=$gemini_key" >> "$server_env"
            fi
        fi
        
        if [ -n "$cors_origin" ]; then
            if grep -q "^CORS_ORIGIN=" "$server_env"; then
                sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$cors_origin|" "$server_env"
            else
                echo "CORS_ORIGIN=$cors_origin" >> "$server_env"
            fi
        fi
        
        if [ -n "$frontend_url" ]; then
            if grep -q "^FRONTEND_URL=" "$server_env"; then
                sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$frontend_url|" "$server_env"
            else
                echo "FRONTEND_URL=$frontend_url" >> "$server_env"
            fi
        fi
        
        print_success "Environment variables synced successfully"
    else
        print_warning "Main .env file not found, using existing server .env"
    fi
}

# Check if server directory exists
if [ ! -d "server" ]; then
    print_error "Backend server directory not found!"
    print_error "Please make sure you're in the webapp directory and server/ exists"
    exit 1
fi

# Change to server directory
cd server

# Sync environment variables from main .env
sync_env_vars

# Check if we're in Codespaces and update URLs
if [ -n "$CODESPACE_NAME" ]; then
    print_status "Configuring for GitHub Codespaces: $CODESPACE_NAME"
    
    # Get the Codespaces URLs
    FRONTEND_URL="https://$CODESPACE_NAME-3000.app.github.dev"
    BACKEND_URL="https://$CODESPACE_NAME-3001.app.github.dev"
    
    # Export environment variables from parent .env with Codespaces URLs
    export NODE_ENV=development
    export PORT=3001
    export FRONTEND_URL="$FRONTEND_URL"
    export CORS_ORIGIN="$FRONTEND_URL"
    export CORS_METHODS="GET,POST,PUT,DELETE,OPTIONS"
    export CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Requested-With,X-CSRF-Token"
    export CORS_CREDENTIALS="true"
    
    print_success "Environment configured for Codespaces!"
    
    # Automatically set port to public using GitHub CLI
    print_status "Setting port 3001 to public..."
    
    # Check if GitHub CLI is available
    if command -v gh &> /dev/null; then
        # Set port 3001 to public  
        gh codespace ports visibility 3001:public -c $CODESPACE_NAME 2>/dev/null || {
            print_warning "Could not auto-set port 3001 to public via CLI"
        }
        
        print_success "Port 3001 set to public automatically!"
    else
        print_warning "GitHub CLI not available. Please manually set port 3001 to PUBLIC in the Ports tab!"
    fi
    
    echo ""
    echo "🌐 Backend will be available at: $BACKEND_URL"
    echo ""
else
    print_status "Configuring for local development"
    
    # Export environment variables for local development
    export NODE_ENV=development
    export PORT=3001
    export FRONTEND_URL="http://localhost:3000"
    export CORS_ORIGIN="http://localhost:3000"
    export CORS_METHODS="GET,POST,PUT,DELETE,OPTIONS"
    export CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Requested-With,X-CSRF-Token"
    export CORS_CREDENTIALS="true"
    
    echo ""
    echo "🌐 Backend will be available at: http://localhost:3001"
    echo ""
fi

# Load additional environment variables from parent .env if it exists
if [ -f "../.env" ]; then
    print_status "Loading environment variables from .env..."
    export $(grep -v '^#' ../.env | grep -v '^$' | xargs)
fi

# Sync environment variables from main .env to server .env
sync_env_vars

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed!"
fi

# Stop any existing backend processes and clear port 3001
print_status "Stopping any existing backend processes on port 3001..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "nodemon index.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Kill processes using port 3001
if command -v lsof &> /dev/null; then
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
else
    # Alternative method if lsof is not available
    fuser -k 3001/tcp 2>/dev/null || true
fi

print_success "Cleared existing backend processes and port 3001!"

# Wait a moment for port to be released
sleep 2

# Check for required environment variables
print_status "Checking environment variables..."

if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    print_warning "⚠️  GEMINI_API_KEY is not set!"
    print_warning "Please update .env file with your actual API key from:"
    print_warning "https://makersuite.google.com/app/apikey"
    echo ""
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_warning "⚠️  NEXT_PUBLIC_SUPABASE_URL is not set!"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    print_warning "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!"
fi

# Start the backend server
print_status "Starting Express.js backend server..."
print_status "Environment: $NODE_ENV"
print_status "Port: $PORT"
print_status "CORS Origin: $CORS_ORIGIN"

# Use npm start or node index.js
if grep -q '"start"' package.json; then
    npm start
else
    node index.js
fi
