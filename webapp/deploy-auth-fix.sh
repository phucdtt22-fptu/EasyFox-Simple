#!/bin/bash

echo "🔄 Deploying EasyFox authentication fix..."
echo "📦 Docker image: phucdtt22fptu/easyfox-simple-fe:latest"
echo ""

# Pull latest image
echo "📥 Pulling latest Docker image..."
docker-compose pull

# Restart services
echo "🔄 Restarting services..."
docker-compose up -d

# Show running containers
echo ""
echo "✅ Services status:"
docker-compose ps

echo ""
echo "🎉 Deploy completed!"
echo ""
echo "🔍 Next steps:"
echo "1. Verify Supabase Dashboard settings:"
echo "   - Site URL: https://e.tinmoius.com"
echo "   - Redirect URLs:"
echo "     * https://e.tinmoius.com/auth/callback"
echo "     * https://e.tinmoius.com/"
echo "     * http://localhost:3000/auth/callback"
echo "     * http://localhost:3000/"
echo ""
echo "2. Test email authentication:"
echo "   - Register new account at https://e.tinmoius.com/register"
echo "   - Check email for confirmation link"
echo "   - Verify redirect works to /auth/callback"
echo ""
echo "3. Check logs if issues persist:"
echo "   docker-compose logs -f webapp"
