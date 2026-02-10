# Contracts-L1 快速開始指南

## 🚀 5分鐘快速啟動

### 前置需求
- Node.js 20+
- pnpm 8+
- Docker Desktop

### 步驟 1: 克隆專案

```bash
git clone <your-repo-url> contracts-l1
cd contracts-l1
```

### 步驟 2: 一鍵設定

```bash
bash scripts/setup/setup-dev.sh
```

這個腳本會自動:
- ✅ 檢查環境需求
- ✅ 安裝所有依賴
- ✅ 啟動 Docker 服務
- ✅ 執行資料庫遷移
- ✅ 載入測試數據

### 步驟 3: 配置環境變數

編輯 `.env.local` 填入必要的 API 金鑰:

```bash
# 最小配置(可選,本地開發不需要)
OPENAI_API_KEY=sk-proj-your-key  # AI 分析功能需要
```

### 步驟 4: 啟動開發伺服器

```bash
pnpm run dev
```

訪問:
- 前端: http://localhost:3000
- API: http://localhost:4000
- API 文檔: http://localhost:4000/api

## 📦 當前功能狀態

### ✅ 已實作
- [x] 完整的專案結構與配置
- [x] Docker 開發環境
- [x] 資料庫 Schema 與遷移
- [x] 基礎的前端頁面
- [x] 基礎的 API 伺服器
- [x] 測試數據種子
- [x] CI/CD 工作流

### 🚧 開發中
- [ ] 使用者認證系統
- [ ] 契約上傳功能
- [ ] AI 分析引擎整合
- [ ] 語義搜尋引擎

## 🔧 實用指令

```bash
# 開發
pnpm run dev              # 啟動所有服務
pnpm run dev:web          # 只啟動前端
pnpm run dev:api          # 只啟動 API

# 建構
pnpm run build            # 建構所有應用
pnpm run build:web        # 只建構前端

# 資料庫
pnpm run db:studio        # 開啟 Prisma Studio
pnpm run db:migrate       # 執行遷移
pnpm run db:seed          # 載入測試數據

# 測試
pnpm run test             # 執行所有測試
pnpm run lint             # 代碼檢查

# Docker
pnpm run docker:dev       # 啟動 Docker 服務
pnpm run docker:down      # 停止 Docker 服務
```

## 🎯 測試帳號

載入測試數據後,可使用以下帳號登入:

```
Demo 用戶:  demo@contracts-l1.com / password123
Admin 用戶: admin@contracts-l1.com / password123
```

## 📚 下一步

1. 查看 [架構文檔](docs/architecture/system-design.md)
2. 閱讀 [開發指南](docs/development/setup.md)
3. 參考 [API 文檔](docs/api/openapi.yml)

## 🐛 遇到問題?

查看 [故障排除指南](docs/development/troubleshooting.md) 或開啟 Issue。

## 🎉 開始開發

專案已準備就緒,開始實作核心功能吧!

建議的開發順序:
1. 實作使用者認證 API
2. 實作契約上傳功能
3. 整合 AI 分析引擎
4. 開發前端頁面
5. 實作語義搜尋

Happy coding! 🚀
