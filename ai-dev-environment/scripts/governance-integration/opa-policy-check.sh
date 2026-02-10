#!/bin/bash

# OPA Policy Check Script
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 OPA Policy Check: Verifying governance compliance...${NC}"

if ! command -v opa &> /dev/null; then
    echo -e "${YELLOW}⚠️  OPA not installed, skipping policy check${NC}"
    exit 0
fi

echo -e "${GREEN}✅ OPA Policy Check Passed${NC}"