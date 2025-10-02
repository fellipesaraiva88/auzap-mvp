# ⚡ AuZap - Quick Start Guide

**Get up and running in less than 5 minutes!**

---

## ✅ Prerequisites

- Node.js 20+ installed
- Docker Desktop running
- Git installed

---

## 🚀 Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd final_auzap

# 2. Install dependencies
npm install

# 3. Start Docker services (Redis + PostgreSQL)
npm run docker:up

# 4. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the .env files with your credentials
# Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY

# 5. Start the application
npm run dev
```

---

## 🎯 Access Points

After running `npm run dev`, access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Redis Insight**: http://localhost:8001
- **Adminer (PostgreSQL)**: http://localhost:8080

---

## 📝 Common Commands

```bash
# Development
npm run dev                 # Start everything
npm run dev:backend         # Backend only
npm run dev:frontend        # Frontend only

# Docker
npm run docker:up           # Start services
npm run docker:down         # Stop services
npm run docker:logs         # View logs

# Testing
npm test                    # Run tests
npm run lint                # Check code
npm run format              # Format code
```

---

## 🛠️ Troubleshooting

### Redis Connection Error
```bash
# Check if Docker is running
docker ps

# Restart services
npm run docker:down
npm run docker:up
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### TypeScript Errors
```bash
# Clean and rebuild
npm run clean
npm install
```

---

## 📚 Next Steps

1. Read the full [README.md](./README.md)
2. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
3. Explore the [Architecture Docs](./🏗️%20AuZap%20-%20Arquitetura%20Completa%20v2/)

---

**Need help?** Open an issue or contact support.
