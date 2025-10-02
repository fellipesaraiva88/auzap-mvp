#!/bin/bash

# Setup Render Secrets for GitHub Actions
# This script helps you configure GitHub secrets for Render deployment

set -e

echo "🚀 AuZap - Render Secrets Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Function to set secret
set_secret() {
    local name=$1
    local value=$2

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping $name (empty value)${NC}"
        return
    fi

    echo "Setting: $name"
    echo "$value" | gh secret set "$name" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $name set successfully${NC}"
    else
        echo -e "${RED}❌ Failed to set $name${NC}"
    fi
}

# 1. Supabase Credentials
echo "📦 Step 1: Supabase Credentials"
echo "================================"
read -p "SUPABASE_URL: " SUPABASE_URL
set_secret "SUPABASE_URL" "$SUPABASE_URL"

read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
set_secret "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

read -sp "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
echo ""
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

echo ""

# 2. Database & Redis
echo "🗄️  Step 2: Database & Redis"
echo "================================"
read -sp "DATABASE_URL: " DATABASE_URL
echo ""
set_secret "DATABASE_URL" "$DATABASE_URL"

read -sp "REDIS_URL: " REDIS_URL
echo ""
set_secret "REDIS_URL" "$REDIS_URL"

echo ""

# 3. API Keys
echo "🔑 Step 3: API Keys"
echo "================================"
read -sp "OPENAI_API_KEY: " OPENAI_API_KEY
echo ""
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"

read -sp "WHATSAPP_WEBHOOK_SECRET: " WHATSAPP_WEBHOOK_SECRET
echo ""
set_secret "WHATSAPP_WEBHOOK_SECRET" "$WHATSAPP_WEBHOOK_SECRET"

echo ""

# 4. Render Configuration
echo "🎨 Step 4: Render Configuration"
echo "================================"
read -sp "RENDER_API_KEY: " RENDER_API_KEY
echo ""
set_secret "RENDER_API_KEY" "$RENDER_API_KEY"

echo ""
echo "📝 To get your Render Service IDs, run:"
echo "   curl -H \"Authorization: Bearer $RENDER_API_KEY\" https://api.render.com/v1/services | jq '.[] | {name, id}'"
echo ""

read -p "RENDER_SERVICE_ID_API: " RENDER_SERVICE_ID_API
set_secret "RENDER_SERVICE_ID_API" "$RENDER_SERVICE_ID_API"

read -p "RENDER_SERVICE_ID_WORKERS: " RENDER_SERVICE_ID_WORKERS
set_secret "RENDER_SERVICE_ID_WORKERS" "$RENDER_SERVICE_ID_WORKERS"

read -p "RENDER_SERVICE_ID_FRONTEND: " RENDER_SERVICE_ID_FRONTEND
set_secret "RENDER_SERVICE_ID_FRONTEND" "$RENDER_SERVICE_ID_FRONTEND"

echo ""

read -p "RENDER_API_URL (e.g., https://auzap-api.onrender.com): " RENDER_API_URL
set_secret "RENDER_API_URL" "$RENDER_API_URL"

read -p "RENDER_FRONTEND_URL (e.g., https://auzap-frontend.onrender.com): " RENDER_FRONTEND_URL
set_secret "RENDER_FRONTEND_URL" "$RENDER_FRONTEND_URL"

echo ""
echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify secrets: gh secret list"
echo "2. Test CI: Create a PR"
echo "3. Test CD: Push to main"
echo ""
echo "For more details, see: .github/CICD_SETUP.md"
