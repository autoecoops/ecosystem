#!/bin/bash

# One-Click Setup Script for AI Development Environment
# 自動化部署腳本 - 一鍵設置整個 AI 開發環境

set -e

# 顏色輸出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Development Environment Setup${NC}"
echo "======================================"
echo ""

# 檢查 Docker
echo -e "${BLUE}[1/6] Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

# 檢查 Docker Compose
echo -e "${BLUE}[2/6] Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose not found. Using docker compose plugin.${NC}"
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi
echo -e "${GREEN}✓ Docker Compose ready${NC}"

# 創建必要的目錄
echo -e "${BLUE}[3/6] Creating directories...${NC}"
mkdir -p evidence plans
mkdir -p governance/policies
echo -e "${GREEN}✓ Directories created${NC}"

# 設置腳本權限
echo -e "${BLUE}[4/6] Setting script permissions...${NC}"
chmod +x scripts/governance-integration/*.sh 2>/dev/null || true
echo -e "${GREEN}✓ Scripts permissions set${NC}"

# 啟動 Docker 服務
echo -e "${BLUE}[5/6] Starting Docker services...${NC}"
cd docker
$COMPOSE_CMD up -d

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

# 檢查服務狀態
echo -e "${BLUE}[6/6] Checking service status...${NC}"
cd ..
$COMPOSE_CMD -f docker/docker-compose.yml ps

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Download AI model:"
echo -e "   ${YELLOW}docker exec -it ollama ollama pull deepseek-coder-v2:16b${NC}"
echo ""
echo "2. Install Continue.dev:"
echo -e "   ${YELLOW}VS Code → Extensions → Search 'Continue' → Install${NC}"
echo ""
echo "3. Copy configuration:"
echo -e "   ${YELLOW}cp continue/config.json ~/.continue/config.json${NC}"
echo ""
echo "4. Read the quick start guide:"
echo -e "   ${YELLOW}cat docs/QUICKSTART.md${NC}"
echo ""
echo -e "${GREEN}GL Unified Charter Activated ✅${NC}"