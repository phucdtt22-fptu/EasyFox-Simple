<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# EasyFox Marketing Platform - Copilot Instructions

## Project Overview
EasyFox is a marketing automation platform designed for small and medium businesses in the US (nail salons, spas, restaurants, cafes, etc.). The platform provides AI-powered content creation, scheduling, and campaign management.

## Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Backend**: N8N workflows
- **UI**: Modern, bright colors (orange/red theme matching EasyFox brand)

## Key Features
1. **User Authentication**: Supabase Auth integration
2. **AI Chat Interface**: Markdown support with syntax highlighting
3. **Onboarding Flow**: AI-driven user information collection
4. **Campaign Management**: 4-tier content structure
5. **Content Scheduling**: Multi-platform social media scheduling
6. **N8N Integration**: AI agent communication

## Architecture Guidelines
- Use TypeScript throughout
- Implement proper error handling
- Follow Next.js App Router patterns
- Use Supabase RLS for security
- Maintain responsive design
- Vietnamese language support

## Color Scheme
- Primary: Orange (#f97316 / orange-500)
- Secondary: Red (#dc2626 / red-600)
- Background: Light orange/red gradients
- Text: Gray shades for readability

## Database Schema
- `users`: Extended Supabase auth with business info
- `chat_history`: AI conversation storage
- `campaigns`: Marketing campaign data
- `schedule`: 4-tier content structure (pillars → categories → angles → briefs)
- `settings`: User preferences

## Best Practices
1. Always use TypeScript interfaces from `/src/types/`
2. Implement proper loading states
3. Use Supabase RLS policies
4. Handle Vietnamese text properly
5. Maintain brand colors and modern UI
6. Include proper error boundaries
