#!/bin/bash

# 🔒 AuZap - Security Validation Script

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECKS=0
PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    CHECKS=$((CHECKS + 1))
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}✅ PASS:${NC} $1"
}

check_fail() {
    CHECKS=$((CHECKS + 1))
    FAILED=$((FAILED + 1))
    echo -e "${RED}❌ FAIL:${NC} $1"
}

check_warn() {
    CHECKS=$((CHECKS + 1))
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

echo -e "${CYAN}🔒 Security Validation${NC}\n"

# Check for exposed secrets
if git grep -q -i "sk-proj-" -- "*.ts" "*.js" "*.json" 2>/dev/null; then
    check_fail "OpenAI API keys found in git"
else
    check_pass "No OpenAI keys exposed"
fi

if grep -q "\.env" .gitignore 2>/dev/null; then
    check_pass ".env in .gitignore"
else
    check_fail ".env NOT in .gitignore"
fi

echo ""
echo -e "${CYAN}📊 Security Summary${NC}"
echo -e "  Total: ${CHECKS} | ${GREEN}Passed: ${PASSED}${NC} | ${YELLOW}Warnings: ${WARNINGS}${NC} | ${RED}Failed: ${FAILED}${NC}"

[ $FAILED -eq 0 ]
