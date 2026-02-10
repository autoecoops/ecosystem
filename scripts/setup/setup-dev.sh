#!/bin/bash

# Contracts-L1 開發環境一鍵設定腳本
# 此腳本會自動完成所有必要的設定步驟

set -e  # 遇到錯誤立即退出

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 顯示歡迎訊息
echo -e "${GREEN}"
cat << "EOF"
   ____            _                  _           _     _ 
  / ___|___  _ __ | |_ _ __ __ _  ___| |_ ___    | |   / |
 | |   / _ \| '_ \| __| '__/ _` |/ __| __/ __|___| |   | |
 | |__| (_) | | | | |_| | | (_| | (__| |_\__ \___| |___| |
  \____\___/|_| |_|\__|_|  \__,_|\___|\__|___/   |_____|_|
                                                            
EOF
echo -e "${NC}"
echo "AI 驅動的契約管理與分析平台 - 開發環境設定"
echo "=========================================="
echo ""

# 檢查前置需求
log_info "檢查前置需求..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    log_error "未安裝 Node.js，請先安裝 Node.js 20 或更新版本"
    log_info "下載地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_error "Node.js 版本過舊 (當前: v$NODE_VERSION)，需要 v20 或更新版本"
    exit 1
fi
log_success "Node.js 版本: $(node -v) ✓"

# 檢查 pnpm
if ! command -v pnpm &> /dev/null; then
    log_warning "未安裝 pnpm，正在安裝..."
    npm install -g pnpm
    log_success "pnpm 安裝完成"
fi
log_success "pnpm 版本: $(pnpm -v) ✓"

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    log_error "未安裝 Docker，請先安裝 Docker Desktop"
    log_info "下載地址: https://www.docker.com/products/docker-desktop"
    exit 1
fi
log_success "Docker 版本: $(docker -v) ✓"

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "未安裝 Docker Compose"
    exit 1
fi
log_success "Docker Compose 版本: $(docker-compose -v) ✓"

echo ""
log_info "前置需求檢查完成 ✓"
echo ""

# 安裝依賴
log_info "安裝 npm 套件依賴..."
pnpm install
log_success "依賴安裝完成"

# 設定環境變數
log_info "設定環境變數..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    log_success "已創建 .env.local 文件"
    log_warning "請編輯 .env.local 填入必要的 API 金鑰"
else
    log_info ".env.local 已存在，跳過"
fi

# 啟動 Docker 服務
log_info "啟動本地服務 (PostgreSQL, Redis, Neo4j, Qdrant)..."
docker-compose -f docker/docker-compose.dev.yml up -d
log_success "Docker 服務已啟動"

# 等待資料庫就緒
log_info "等待 PostgreSQL 就緒..."
sleep 5
until docker exec contracts-l1-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""
log_success "PostgreSQL 已就緒"

# 執行資料庫遷移
log_info "執行資料庫遷移..."
cd packages/database
pnpm run generate
pnpm run migrate
cd ../..
log_success "資料庫遷移完成"

# 載入測試數據 (可選)
read -p "是否載入測試數據? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "載入測試數據..."
    cd packages/database
    pnpm run seed
    cd ../..
    log_success "測試數據載入完成"
fi

# 顯示服務訊息
echo ""
echo "=========================================="
log_success "開發環境設定完成！"
echo "=========================================="
echo ""
echo "可用服務:"
echo "  • PostgreSQL:  localhost:5432"
echo "  • Redis:       localhost:6379"
echo "  • Neo4j:       http://localhost:7474"
echo "  • Qdrant:      http://localhost:6333"
echo "  • MinIO:       http://localhost:9001"
echo "  • MailHog:     http://localhost:8025"
echo ""
echo "下一步:"
echo "  1. 編輯 .env.local 填入 API 金鑰"
echo "  2. 執行 'pnpm run dev' 啟動開發伺服器"
echo "  3. 訪問 http://localhost:3000"
echo ""
echo "實用指令:"
echo "  • pnpm run dev          - 啟動所有服務"
echo "  • pnpm run dev:web      - 只啟動前端"
echo "  • pnpm run dev:api      - 只啟動 API"
echo "  • pnpm run db:studio    - 開啟資料庫管理介面"
echo "  • pnpm run docker:down  - 停止 Docker 服務"
echo ""
log_info "如遇到問題，請查看項目文檔或開啟 Issue"
echo ""
