#!/bin/bash
#
# Production Safety Checks
# 
# This script validates that dangerous development flags are not present in
# production environments. It should run before every build.
#
# Usage:
#   bash scripts/check-production-safety.sh
#
# Exit codes:
#   0 - All checks passed
#   1 - Critical security issue found

set -e

echo ""
echo "🔒 Running Production Safety Checks..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Check 1: Environment files
echo ""
echo "📄 Checking environment files..."

if [ -f .env.production ]; then
  if grep -q "DISABLE_AUTH_CHECK=true" .env.production 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: DISABLE_AUTH_CHECK=true found in .env.production${NC}"
    echo "   This flag must NEVER be set in production"
    FAILED=1
  fi
  
  if grep -q "ALLOW_AUTH_BYPASS_IN_DEV=true" .env.production 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: ALLOW_AUTH_BYPASS_IN_DEV=true found in .env.production${NC}"
    echo "   This flag must NEVER be set in production"
    FAILED=1
  fi
fi

if [ -f .env ]; then
  if grep -q "DISABLE_AUTH_CHECK=true" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: DISABLE_AUTH_CHECK=true found in .env${NC}"
    echo "   This should only be in .env.local for development"
    # Don't fail, but warn - .env might be for local dev
  fi
fi

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Environment files check passed${NC}"
fi

# Check 2: Vercel/Hosting Platform Detection
echo ""
echo "☁️  Checking hosting platform environment..."

if [ ! -z "$VERCEL" ] || [ ! -z "$VERCEL_ENV" ]; then
  echo "   Detected: Vercel deployment"
  
  if [ "$DISABLE_AUTH_CHECK" = "true" ]; then
    echo -e "${RED}❌ CRITICAL: DISABLE_AUTH_CHECK=true set on Vercel${NC}"
    echo "   Auth bypass is not allowed on Vercel"
    FAILED=1
  fi
  
  if [ "$ALLOW_AUTH_BYPASS_IN_DEV" = "true" ]; then
    echo -e "${RED}❌ CRITICAL: ALLOW_AUTH_BYPASS_IN_DEV=true set on Vercel${NC}"
    echo "   Auth bypass is not allowed on Vercel"
    FAILED=1
  fi
  
  if [ "$VERCEL_ENV" = "production" ]; then
    echo "   Environment: Production"
    # Extra strict checks for production
    if [ -z "$KITCHEN_JWT_SECRET" ]; then
      echo -e "${RED}❌ CRITICAL: KITCHEN_JWT_SECRET not set in production${NC}"
      FAILED=1
    fi
  fi
  
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Vercel environment check passed${NC}"
  fi
fi

# Check 3: NODE_ENV validation
echo ""
echo "🔧 Checking NODE_ENV..."

if [ "$NODE_ENV" = "production" ]; then
  echo "   NODE_ENV: production"
  
  if [ "$DISABLE_AUTH_CHECK" = "true" ]; then
    echo -e "${RED}❌ CRITICAL: Auth bypass attempted in production${NC}"
    FAILED=1
  fi
  
  if [ "$ALLOW_AUTH_BYPASS_IN_DEV" = "true" ]; then
    echo -e "${RED}❌ CRITICAL: Dev bypass flag set in production${NC}"
    FAILED=1
  fi
  
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ NODE_ENV check passed${NC}"
  fi
else
  echo "   NODE_ENV: ${NODE_ENV:-not set}"
  echo "   ℹ️  Skipping production-only checks"
fi

# Check 4: Git history check (don't commit sensitive env vars)
echo ""
echo "📝 Checking git for committed secrets..."

if command -v git &> /dev/null; then
  if git rev-parse --git-dir > /dev/null 2>&1; then
    # Check if .env.local is tracked (it shouldn't be)
    if git ls-files --error-unmatch .env.local > /dev/null 2>&1; then
      echo -e "${RED}❌ CRITICAL: .env.local is tracked by git${NC}"
      echo "   This file contains secrets and should be in .gitignore"
      FAILED=1
    else
      echo -e "${GREEN}✅ .env.local not tracked by git${NC}"
    fi
    
    # Check if any env files with bypass flags are tracked
    if git grep -q "DISABLE_AUTH_CHECK=true" -- "*.env*" 2>/dev/null; then
      echo -e "${YELLOW}⚠️  WARNING: DISABLE_AUTH_CHECK=true found in tracked files${NC}"
      echo "   Review and remove from version control"
    fi
  else
    echo "   ℹ️  Not a git repository, skipping"
  fi
else
  echo "   ℹ️  Git not available, skipping"
fi

# Check 5: Required secrets validation
echo ""
echo "🔑 Checking required secrets..."

SECRETS_OK=1

if [ "$NODE_ENV" = "production" ] || [ "$VERCEL_ENV" = "production" ]; then
  # Production requires these secrets
  if [ -z "$KITCHEN_JWT_SECRET" ]; then
    echo -e "${RED}❌ Missing: KITCHEN_JWT_SECRET${NC}"
    SECRETS_OK=0
  fi
  
  if [ -z "$SANITY_WRITE_TOKEN" ]; then
    echo -e "${RED}❌ Missing: SANITY_WRITE_TOKEN${NC}"
    SECRETS_OK=0
  fi
  
  if [ $SECRETS_OK -eq 1 ]; then
    echo -e "${GREEN}✅ Required secrets present${NC}"
  else
    FAILED=1
  fi
else
  echo "   ℹ️  Not production, skipping required secrets check"
fi

# Final Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ FAILED: Production safety checks did not pass${NC}"
  echo ""
  echo "CRITICAL SECURITY ISSUES DETECTED"
  echo ""
  echo "Your build has been blocked to prevent security vulnerabilities."
  echo "Please review the errors above and fix them before deploying."
  echo ""
  echo "Common fixes:"
  echo "  1. Remove DISABLE_AUTH_CHECK from production environment"
  echo "  2. Remove ALLOW_AUTH_BYPASS_IN_DEV from production environment"
  echo "  3. Ensure .env.local is in .gitignore and not committed"
  echo "  4. Set required secrets in production environment"
  echo ""
  echo "See docs/INTERNAL-SECURITY-DEV.md for more information."
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ SUCCESS: All production safety checks passed${NC}"
  echo ""
  echo "Your build is safe to proceed."
  echo ""
  exit 0
fi
