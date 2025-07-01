#!/bin/bash

# EasyFox Auto Setup Script for New Codespaces
# This script runs automatically when Codespace starts

echo "🦊 EasyFox Auto Setup Starting..."

# Check if this is a new Codespace
if [ ! -f "/tmp/.easyfox-setup-done" ]; then
    echo "🔧 First-time setup detected"
    
    # Wait for Codespace to be fully ready
    sleep 5
    
    # Set ports to public using GitHub CLI
    if [ -n "$CODESPACE_NAME" ] && command -v gh &> /dev/null; then
        echo "🌐 Setting ports to public..."
        
        # Try to set ports public
        gh codespace ports visibility 3000:public -c $CODESPACE_NAME 2>/dev/null && echo "✅ Port 3000 set to public"
        gh codespace ports visibility 3001:public -c $CODESPACE_NAME 2>/dev/null && echo "✅ Port 3001 set to public"
        
        echo "🌐 Access URLs:"
        echo "Frontend: https://$CODESPACE_NAME-3000.app.github.dev"
        echo "Backend:  https://$CODESPACE_NAME-3001.app.github.dev"
    fi
    
    # Install dependencies
    if [ -f "package.json" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    if [ -f "server/package.json" ]; then
        echo "📦 Installing backend dependencies..."
        cd server && npm install && cd ..
    fi
    
    # Mark setup as complete
    touch /tmp/.easyfox-setup-done
    
    echo "✅ EasyFox setup complete!"
    echo "Run ./dev-start.sh to start development"
else
    echo "✅ EasyFox already configured"
fi
