#!/bin/bash

echo "Building EasyFox Frontend for aiphuc.com domain..."

# Build với environment variables cho aiphuc.com
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://niyvcieaapojhoqyinmg.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXZjaWVhYXBvamhvcXlpbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzMwODAsImV4cCI6MjA2NTIwOTA4MH0.Lc6BlY0As7UcgdVDJzTytLyEmq6TlzxTPBdUcfncLYY \
  --build-arg NEXT_PUBLIC_API_URL=https://be.aiphuc.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://e.aiphuc.com \
  --build-arg NEXT_PUBLIC_AUTH_REDIRECT_URL=/auth/callback \
  --build-arg NEXT_PUBLIC_AUTH_ERROR_URL=/login?error=auth_failed \
  -f Dockerfile \
  -t phucdtt22fptu/easyfox-simple-fe:aiphuc \
  .

echo "Build completed! Image: phucdtt22fptu/easyfox-simple-fe:aiphuc"
echo "Push with: docker push phucdtt22fptu/easyfox-simple-fe:aiphuc"
