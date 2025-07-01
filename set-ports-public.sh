#!/bin/bash

# Script to set Codespaces ports to public
# Run this if automatic port configuration fails

echo "🔧 Setting Codespaces ports to public..."

if [ -z "$CODESPACE_NAME" ]; then
    echo "❌ This script only works in GitHub Codespaces"
    exit 1
fi

# Check if GitHub CLI is available and authenticated
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found"
    
    # Try to set ports to public
    echo "🔧 Setting port 3000 to public..."
    if gh codespace ports visibility 3000:public -c $CODESPACE_NAME 2>/dev/null; then
        echo "✅ Port 3000 set to public"
    else
        echo "⚠️ Could not set port 3000 automatically"
    fi
    
    echo "🔧 Setting port 3001 to public..."
    if gh codespace ports visibility 3001:public -c $CODESPACE_NAME 2>/dev/null; then
        echo "✅ Port 3001 set to public"
    else
        echo "⚠️ Could not set port 3001 automatically"
    fi
    
    echo ""
    echo "🌐 Your URLs should be accessible at:"
    echo "Frontend: https://$CODESPACE_NAME-3000.app.github.dev"
    echo "Backend:  https://$CODESPACE_NAME-3001.app.github.dev"
    
else
    echo "❌ GitHub CLI not found or not authenticated"
    echo ""
    echo "📋 Please manually set ports to public:"
    echo "1. Open the 'Ports' tab in VS Code"
    echo "2. Right-click on port 3000 → 'Port Visibility' → 'Public'"
    echo "3. Right-click on port 3001 → 'Port Visibility' → 'Public'"
    echo ""
    echo "🌐 Then access your app at:"
    echo "Frontend: https://$CODESPACE_NAME-3000.app.github.dev"
    echo "Backend:  https://$CODESPACE_NAME-3001.app.github.dev"
fi
