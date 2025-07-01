# EasyFox Development Setup for GitHub Codespaces

This guide helps you set up and run EasyFox in GitHub Codespaces with automatic port configuration.

## 🚀 Quick Start

### Auto-Configuration (Recommended)
If you're using the devcontainer.json configuration, ports 3000 and 3001 will be automatically set to public when the Codespace starts.

### Manual Start
```bash
./dev-start.sh
```
This script will:
- Auto-detect Codespaces environment
- Update .env with correct URLs
- Automatically set ports to public (if GitHub CLI is available)
- Install dependencies
- Start both frontend and backend

### Option 2: Start Services Separately

#### Frontend Only
```bash
./dev-frontend.sh
```

#### Backend Only
```bash
./dev-backend.sh
```

## 🔧 Automatic Port Configuration

### Method 1: DevContainer Configuration (Recommended)
The repository includes `.devcontainer/devcontainer.json` which automatically:
- Sets ports 3000 and 3001 to public
- Installs required dependencies
- Configures VS Code extensions

### Method 2: Manual Port Setup
If automatic setup fails, run:
```bash
./set-ports-public.sh
```

Or manually in VS Code:
1. Open the "Ports" tab
2. Right-click on ports 3000 and 3001
3. Select "Port Visibility" → "Public"

### 1. Environment Configuration

The scripts automatically configure URLs for Codespaces, but you can manually update `.env`:

**For Codespaces:**
```env
NEXT_PUBLIC_SITE_URL=https://YOUR_CODESPACE_NAME-3000.app.github.dev
NEXT_PUBLIC_API_URL=https://YOUR_CODESPACE_NAME-3001.app.github.dev
```

**For Local Development:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Required API Keys

Update these in `.env`:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 3. Port Configuration in Codespaces

**IMPORTANT:** Make sure to set ports as PUBLIC in GitHub Codespaces:

1. Open the "Ports" tab in VS Code
2. Right-click on ports `3000` and `3001`
3. Select "Port Visibility" → "Public"

## 🌐 Access URLs

After starting the services:

**In Codespaces:**
- Frontend: `https://YOUR_CODESPACE_NAME-3000.app.github.dev`
- Backend: `https://YOUR_CODESPACE_NAME-3001.app.github.dev`

**Local Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `./dev-start.sh` | Start both frontend and backend |
| `./dev-frontend.sh` | Start only frontend (Next.js) |
| `./dev-backend.sh` | Start only backend (Express.js) |

## 🔍 Troubleshooting

### CORS Issues
- Make sure ports are set to PUBLIC in Codespaces
- Check that CORS_ORIGIN in .env matches your frontend URL
- Restart services after changing environment variables

### Authentication Issues
- Verify NEXT_PUBLIC_SITE_URL matches your actual Codespaces URL
- Check Supabase auth settings for allowed redirect URLs

### API Issues
- Ensure GEMINI_API_KEY is set correctly
- Check backend logs for detailed error messages
- Verify N8N webhook URL is accessible

## 📝 Environment Variables Reference

### Frontend (.env)
```env
# Node Environment
NODE_ENV=development

# Site URLs (auto-configured by scripts)
NEXT_PUBLIC_SITE_URL=https://YOUR_CODESPACE-3000.app.github.dev
NEXT_PUBLIC_API_URL=https://YOUR_CODESPACE-3001.app.github.dev

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://niyvcieaapojhoqyinmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Auth
NEXT_PUBLIC_AUTH_REDIRECT_URL=/auth/callback
NEXT_PUBLIC_AUTH_ERROR_URL=/login?error=auth_failed

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_CHAT_MODEL=gemini-1.5-pro
GEMINI_SUGGESTION_MODEL=gemini-1.5-flash

# N8N Integration
N8N_WEBHOOK_URL=https://n8n.aiphuc.com/webhook/easyfox-ai-assistant
```

### Backend (server/.env or inherited)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=https://YOUR_CODESPACE-3000.app.github.dev
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With,X-CSRF-Token
CORS_CREDENTIALS=true

# Security
JWT_SECRET=easyfox-jwt-secret-key-2025-development
```

## 🎯 Next Steps

After successful setup:

1. **Update API Key**: Replace `your_gemini_api_key_here` with your actual Gemini API key
2. **Configure Supabase**: Ensure your Codespaces URL is added to Supabase Auth allowed URLs
3. **Test Features**: Try the onboarding flow, chat interface, and API endpoints
4. **Check Logs**: Monitor both frontend and backend logs for any issues

## 📞 Support

If you encounter issues:
1. Check the console logs in browser developer tools
2. Check backend logs in the terminal
3. Verify all environment variables are set correctly
4. Ensure ports are public in Codespaces
