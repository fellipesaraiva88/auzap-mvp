#!/bin/bash

# 🧪 AuZap - Smoke Test Suite
# Quick validation that critical functionality works

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-https://final-auzap.onrender.com}"
FRONTEND_URL="${FRONTEND_URL:-https://final-auzap-frontend.onrender.com}"

# Test tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected_code=$4
    local headers=${5:-}

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  Testing: $name... "

    local cmd="curl -s -o /dev/null -w '%{http_code}' -X $method"

    if [ -n "$headers" ]; then
        cmd="$cmd -H \"$headers\""
    fi

    cmd="$cmd $url"

    HTTP_CODE=$(eval $cmd)

    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $HTTP_CODE)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Print header
echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}🧪 AuZap Smoke Test Suite${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# 1. Health Checks
echo -e "${CYAN}1. Health Checks${NC}"
test_endpoint "Backend Health" "GET" "${BACKEND_URL}/health" "200"
test_endpoint "Frontend Health" "GET" "${FRONTEND_URL}" "200"
echo ""

# 2. API Endpoints
echo -e "${CYAN}2. API Endpoints${NC}"
test_endpoint "Campaigns List (Unauthorized)" "GET" "${BACKEND_URL}/api/campaigns" "401"
test_endpoint "Contacts List (Unauthorized)" "GET" "${BACKEND_URL}/api/contacts" "401"
echo ""

# 3. Auth Endpoints
echo -e "${CYAN}3. Auth Endpoints${NC}"
# Note: These will fail without valid credentials, but we're checking they exist
test_endpoint "Login Endpoint Exists" "POST" "${BACKEND_URL}/api/auth/login" "400"
test_endpoint "Signup Endpoint Exists" "POST" "${BACKEND_URL}/api/auth/signup" "400"
echo ""

# 4. Static Assets
echo -e "${CYAN}4. Frontend Assets${NC}"
test_endpoint "Frontend Index" "GET" "${FRONTEND_URL}/" "200"
test_endpoint "Frontend Assets" "GET" "${FRONTEND_URL}/vite.svg" "200"
echo ""

# Summary
echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}📊 Test Summary${NC}"
echo -e "${CYAN}================================${NC}"
echo -e "  Total Tests:     ${TESTS_RUN}"
echo -e "  ${GREEN}Passed:          ${TESTS_PASSED}${NC}"
echo -e "  ${RED}Failed:          ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed!${NC}"
    exit 1
fi
