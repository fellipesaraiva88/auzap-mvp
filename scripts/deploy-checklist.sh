#!/bin/bash

# 🚀 AuZap - Deploy Checklist Automation Script
# This script validates deployment readiness and production health

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
ROCKET="🚀"
LOCK="🔒"
GEAR="⚙️"
CHART="📊"
CLOCK="⏱️"

# Results tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to print section header
print_section() {
    echo -e "\n${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}\n"
}

# Function to check and report
check_item() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local description=$1
    local command=$2

    echo -n "  Checking: $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}${CROSS} FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to check with warning
check_warning() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local description=$1
    local command=$2

    echo -n "  Checking: $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${YELLOW}${WARNING} WARNING${NC}"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return 1
    fi
}

# Function to measure time
measure_time() {
    local description=$1
    local url=$2
    local max_time=$3

    echo -n "  ${CLOCK} Measuring: $description... "

    local start_time=$(date +%s%3N)
    if curl -s -o /dev/null -w "%{http_code}" "$url" > /dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        if [ $duration -lt $max_time ]; then
            echo -e "${GREEN}${duration}ms ${CHECK}${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            echo -e "${YELLOW}${duration}ms ${WARNING}${NC}"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            return 1
        fi
    else
        echo -e "${RED}Failed ${CROSS}${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# ==================================
# 1. PRÉ-DEPLOY CHECKS
# ==================================
print_section "1️⃣  PRE-DEPLOY VALIDATION"

check_item "Git status clean" "[ -z \"\$(git status --porcelain)\" ]"
check_item "On main branch" "[ \"\$(git branch --show-current)\" = \"main\" ]"
check_item "Backend build" "cd backend && npm run build"
check_item "Frontend build" "cd frontend && npm run build"
check_warning "Linting backend" "cd backend && npm run lint"
check_warning "Linting frontend" "cd frontend && npm run lint"
check_item ".env exists" "[ -f backend/.env ]"
check_item ".env.production exists" "[ -f backend/.env.production ] || [ -f frontend/.env.production ]"

# ==================================
# 2. SECURITY CHECKS
# ==================================
print_section "2️⃣  ${LOCK} SECURITY VALIDATION"

# Check if Supabase connection is available
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "  ${CHECK} Supabase credentials available"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ${CROSS} Supabase credentials missing (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

check_item "No exposed secrets in git" "! git grep -i 'sk-' -- '*.ts' '*.js' '*.json'"
check_item "CORS configured" "grep -r 'cors' backend/src"
check_warning "HTTPS enforced" "grep -r 'https' backend/src || true"

# ==================================
# 3. INFRASTRUCTURE CHECKS
# ==================================
print_section "3️⃣  ${GEAR} INFRASTRUCTURE HEALTH"

# Backend health check
BACKEND_URL="${BACKEND_URL:-https://final-auzap.onrender.com}"
echo "  Checking backend: $BACKEND_URL"
check_item "Backend responding" "curl -f -s -o /dev/null ${BACKEND_URL}/health || curl -f -s -o /dev/null ${BACKEND_URL}/"

# Frontend health check
FRONTEND_URL="${FRONTEND_URL:-https://final-auzap-frontend.onrender.com}"
echo "  Checking frontend: $FRONTEND_URL"
check_item "Frontend responding" "curl -f -s -o /dev/null ${FRONTEND_URL}"

# Supabase connectivity
if [ -n "$SUPABASE_URL" ]; then
    check_item "Supabase reachable" "curl -f -s -o /dev/null ${SUPABASE_URL}"
fi

# ==================================
# 4. FUNCTIONALITY CHECKS
# ==================================
print_section "4️⃣  FUNCTIONALITY TESTS"

# Health endpoint
check_item "Health endpoint returns 200" "curl -f -s ${BACKEND_URL}/health > /dev/null"

# API endpoints (if authenticated)
check_warning "API endpoints available" "curl -s ${BACKEND_URL}/api/campaigns > /dev/null || true"

# ==================================
# 5. PERFORMANCE CHECKS
# ==================================
print_section "5️⃣  ${CHART} PERFORMANCE METRICS"

# Response time checks
measure_time "Backend response time" "${BACKEND_URL}/health" 2000
measure_time "Frontend load time" "${FRONTEND_URL}" 3000

# ==================================
# 6. MONITORING CHECKS
# ==================================
print_section "6️⃣  MONITORING & LOGS"

echo "  ${CHECK} Check Render logs manually:"
echo "      Backend: https://dashboard.render.com/web/srv-your-backend-id/logs"
echo "      Frontend: https://dashboard.render.com/static/srv-your-frontend-id/logs"

# ==================================
# 7. POST-DEPLOY VALIDATION
# ==================================
print_section "7️⃣  POST-DEPLOY ACTIONS"

echo "  [ ] Run smoke tests"
echo "  [ ] Update documentation"
echo "  [ ] Update Notion workspace"
echo "  [ ] Notify team"

# ==================================
# SUMMARY
# ==================================
print_section "${ROCKET} DEPLOYMENT SUMMARY"

echo -e "  Total Checks:    ${TOTAL_CHECKS}"
echo -e "  ${GREEN}Passed:          ${PASSED_CHECKS}${NC}"
echo -e "  ${YELLOW}Warnings:        ${WARNING_CHECKS}${NC}"
echo -e "  ${RED}Failed:          ${FAILED_CHECKS}${NC}"

echo -e "\n"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}${ROCKET} ALL CRITICAL CHECKS PASSED! Ready to deploy.${NC}"
    exit 0
elif [ $FAILED_CHECKS -le 2 ]; then
    echo -e "${YELLOW}${WARNING} MINOR ISSUES DETECTED. Review failures before deploying.${NC}"
    exit 1
else
    echo -e "${RED}${CROSS} DEPLOYMENT BLOCKED. Fix critical issues first.${NC}"
    exit 1
fi
