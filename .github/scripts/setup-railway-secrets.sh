#!/bin/bash
# Setup Railway Secrets for GitHub Actions

set -e

echo "🔐 Railway Secrets Setup for GitHub Actions"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install: brew install gh"
    exit 1
fi

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install: npm install -g @railway/cli"
    exit 1
fi

# Set secret helper
set_secret() {
    local name=$1
    local value=$2
    echo "$value" | gh secret set "$name" 2>/dev/null
    echo "✅ $name configured"
}

echo "📝 Please provide the following information:"
echo ""

# 1. Railway Token
echo "1️⃣  Railway Token"
echo "   Get from: railway login OR https://railway.app/account/tokens"
read -sp "   RAILWAY_TOKEN: " RAILWAY_TOKEN
echo ""
set_secret "RAILWAY_TOKEN" "$RAILWAY_TOKEN"

# 2. Project ID
echo ""
echo "2️⃣  Project ID"
echo "   Get from: railway status OR Railway Dashboard URL"
read -p "   RAILWAY_PROJECT_ID: " RAILWAY_PROJECT_ID
set_secret "RAILWAY_PROJECT_ID" "$RAILWAY_PROJECT_ID"

# 3. Service IDs
echo ""
echo "3️⃣  Service IDs (from Railway Dashboard → Service → Settings)"
echo ""
read -p "   RAILWAY_SERVICE_API (backend): " RAILWAY_SERVICE_API
set_secret "RAILWAY_SERVICE_API" "$RAILWAY_SERVICE_API"

read -p "   RAILWAY_SERVICE_WORKERS: " RAILWAY_SERVICE_WORKERS
set_secret "RAILWAY_SERVICE_WORKERS" "$RAILWAY_SERVICE_WORKERS"

read -p "   RAILWAY_SERVICE_FRONTEND: " RAILWAY_SERVICE_FRONTEND
set_secret "RAILWAY_SERVICE_FRONTEND" "$RAILWAY_SERVICE_FRONTEND"

# 4. URLs
echo ""
echo "4️⃣  Public URLs (from Railway Dashboard → Service → Networking)"
echo ""
read -p "   RAILWAY_API_URL (https://...): " RAILWAY_API_URL
set_secret "RAILWAY_API_URL" "$RAILWAY_API_URL"

read -p "   RAILWAY_FRONTEND_URL (https://...): " RAILWAY_FRONTEND_URL
set_secret "RAILWAY_FRONTEND_URL" "$RAILWAY_FRONTEND_URL"

echo ""
echo "=========================================="
echo "✅ All secrets configured successfully!"
echo "=========================================="
echo ""
echo "📋 Configured secrets:"
gh secret list | grep RAILWAY || echo "   (none found - may need to refresh)"
echo ""
echo "🧪 Test the workflow:"
echo "   gh workflow run cd-railway.yml"
echo ""
echo "🌐 Check Railway dashboard:"
echo "   https://railway.app/project/$RAILWAY_PROJECT_ID"
echo ""
