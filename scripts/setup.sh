#!/bin/bash

# 🚀 AuZap - Setup Script
# This script automates the initial project setup

set -e  # Exit on error

echo "🐾 AuZap - Automated Setup"
echo "=========================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required. You have $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Warning: Docker not found. Install from https://docker.com"
else
    echo "✅ Docker is installed"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup environment files
echo "🔐 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (configure your credentials!)"
else
    echo "ℹ️  backend/.env already exists"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env (configure your credentials!)"
else
    echo "ℹ️  frontend/.env already exists"
fi
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
if command -v docker &> /dev/null; then
    docker-compose up -d
    echo "✅ Docker services started"
    echo "   Redis:        localhost:6379"
    echo "   PostgreSQL:   localhost:5432"
    echo "   RedisInsight: http://localhost:8001"
    echo "   Adminer:      http://localhost:8080"
else
    echo "⚠️  Skipping Docker setup (Docker not installed)"
fi
echo ""

# Final instructions
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env files with real credentials:"
echo "   - backend/.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY)"
echo "   - frontend/.env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo "Happy coding! 🚀"
