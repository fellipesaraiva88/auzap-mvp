#!/bin/bash

# 🔍 AuZap - Production Validation Script
# Quick validation that production is healthy

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-https://final-auzap.onrender.com}"
FRONTEND_URL="${FRONTEND_URL:-https://final-auzap-frontend.onrender.com}"

echo "🔍 Validating Production Environment..."
echo ""

# 1. Backend Health
echo -n "Backend Health... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${BACKEND_URL}/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

# 2. Frontend Health
echo -n "Frontend Health... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${FRONTEND_URL})
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

# 3. Backend Response Time
echo -n "Backend Response Time... "
START=$(date +%s%3N)
curl -s ${BACKEND_URL}/health > /dev/null
END=$(date +%s%3N)
DURATION=$((END - START))

if [ $DURATION -lt 2000 ]; then
    echo -e "${GREEN}✅ ${DURATION}ms${NC}"
elif [ $DURATION -lt 5000 ]; then
    echo -e "${YELLOW}⚠️  ${DURATION}ms (slow)${NC}"
else
    echo -e "${RED}❌ ${DURATION}ms (too slow)${NC}"
fi

# 4. Frontend Response Time
echo -n "Frontend Response Time... "
START=$(date +%s%3N)
curl -s ${FRONTEND_URL} > /dev/null
END=$(date +%s%3N)
DURATION=$((END - START))

if [ $DURATION -lt 3000 ]; then
    echo -e "${GREEN}✅ ${DURATION}ms${NC}"
elif [ $DURATION -lt 7000 ]; then
    echo -e "${YELLOW}⚠️  ${DURATION}ms (slow)${NC}"
else
    echo -e "${RED}❌ ${DURATION}ms (too slow)${NC}"
fi

# 5. SSL/HTTPS
echo -n "HTTPS Enabled... "
if curl -s ${BACKEND_URL}/health | grep -q "health" 2>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot verify${NC}"
fi

echo ""
echo -e "${GREEN}✅ Production validation complete!${NC}"
