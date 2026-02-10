#!/bin/bash

# Governance Seal Script for AI Changes
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔐 Governance Seal: Starting AI change sealing...${NC}"

if [ -z "$(git diff --name-only)" ]; then
    echo -e "${YELLOW}⚠️  No changes detected${NC}"
    exit 0
fi

# Generate hash
GIT_DIFF=$(git diff HEAD)
HASH=$(echo "$GIT_DIFF" | sha256sum | cut -d' ' -f1)
echo -e "${GREEN}✓ Hash generated: $HASH${NC}"

# Generate plan.json
mkdir -p evidence
cat > evidence/plan-${HASH}.json << EOF
{
  "id": "$HASH",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "type": "ai-change",
  "source": "continue-dev",
  "sealed": true
}
EOF

echo -e "${GREEN}✓ Plan generated: evidence/plan-${HASH}.json${NC}"

# Record to Evidence Layer
cat >> evidence/ai-changes.log << EOF
Hash: $HASH
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Status: SEALED
EOF

echo -e "${GREEN}✓ Recorded in evidence/ai-changes.log${NC}"

# Commit changes
git add evidence/
git commit -m "🤖 AI edit sealed: $HASH"

echo -e "${GREEN}🎉 Governance Seal completed!${NC}"