# Contracts-L1 零成本部署完整指南

## 概述

本指南將引導您完成 Contracts-L1 的零成本部署,整個過程無需信用卡,所有服務都使用免費方案。預計完成時間為 2-3 小時。

## 前置需求

### 必需帳號(全部免費)
1. GitHub 帳號 - 程式碼託管與 CI/CD
2. Vercel 帳號 - 前端託管
3. Railway 帳號 - 後端 API 託管
4. Supabase 帳號 - 資料庫與儲存
5. Upstash 帳號 - Redis 快取
6. Hugging Face 帳號 - AI 模型託管

### 可選帳號(增強功能)
7. Pinecone 帳號 - 向量資料庫
8. Cloudflare 帳號 - CDN 與 DNS
9. Sentry 帳號 - 錯誤追蹤
10. Better Stack 帳號 - 監控告警

## 第一階段:本地開發環境設定

### 步驟 1: 複製程式碼倉庫

```bash
# 複製倉庫
git clone https://github.com/your-org/contracts-l1.git
cd contracts-l1

# 安裝 pnpm(如果尚未安裝)
npm install -g pnpm

# 安裝所有依賴
pnpm install

# 複製環境變數範例
cp .env.example .env.local
```

### 步驟 2: 本地服務啟動

使用 Docker Compose 啟動本地開發所需的服務:

```bash
# 啟動 PostgreSQL, Redis, Neo4j
docker-compose -f docker/docker-compose.dev.yml up -d

# 等待服務就緒
sleep 10

# 執行資料庫遷移
pnpm run db:migrate

# 載入測試數據(可選)
pnpm run db:seed
```

### 步驟 3: 啟動開發伺服器

```bash
# 使用 Turbo 並行啟動所有服務
pnpm run dev

# 或分別啟動
pnpm run dev:web      # 前端 http://localhost:3000
pnpm run dev:api      # API http://localhost:4000
pnpm run dev:worker   # 背景任務處理器
```

開發環境現在應該在本地運行。訪問 http://localhost:3000 查看前端應用。

## 第二階段:Supabase 資料庫設定

### 步驟 1: 創建 Supabase 專案

1. 前往 https://supabase.com
2. 點擊 "Start your project"
3. 使用 GitHub 帳號登入
4. 創建新組織(免費)
5. 創建新專案:
   - 名稱: contracts-l1-prod
   - 密碼: 使用強密碼(保存到密碼管理器)
   - 區域: 選擇最近的區域(亞太選擇 Singapore)
   - 定價方案: Free(包含 500MB 資料庫,2GB 儲存)

### 步驟 2: 獲取連接資訊

1. 在專案設定中找到 "Database" 部分
2. 複製以下資訊:
   - Database URL (Connection pooling)
   - API URL
   - anon public key
   - service_role secret key

3. 更新本地 .env.local:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### 步驟 3: 執行資料庫遷移

```bash
# 使用 Prisma 遷移到 Supabase
pnpm run db:migrate -- --schema=production

# 驗證資料庫結構
pnpm run db:studio
```

## 第三階段:Railway 後端部署

### 步驟 1: 創建 Railway 專案

1. 前往 https://railway.app
2. 使用 GitHub 帳號登入
3. 創建新專案 "New Project"
4. 選擇 "Deploy from GitHub repo"
5. 授權 Railway 存取您的 GitHub
6. 選擇 contracts-l1 倉庫

### 步驟 2: 配置服務

Railway 會自動偵測 monorepo 結構,手動配置各服務:

#### API 服務配置
1. 點擊 "New Service" → "Backend API"
2. 設定:
   - Root Directory: `apps/api`
   - Build Command: `pnpm run build`
   - Start Command: `pnpm run start:prod`
3. 環境變數:
```env
NODE_ENV=production
DATABASE_URL=${{Supabase.DATABASE_URL}}
REDIS_URL=${{Upstash.REDIS_URL}}
JWT_SECRET=<生成隨機字串>
OPENAI_API_KEY=${{secrets.OPENAI_API_KEY}}
```

#### Worker 服務配置
1. 點擊 "New Service" → "Worker"
2. 設定:
   - Root Directory: `apps/worker`
   - Build Command: `pnpm run build`
   - Start Command: `pnpm run start:prod`
3. 使用相同的環境變數

### 步驟 3: 配置自定義域名(可選)

1. 在 API 服務設定中找到 "Settings" → "Domains"
2. 生成 Railway 子域名或連接自定義域名
3. 記錄 API URL 供前端使用

## 第四階段:Vercel 前端部署

### 步驟 1: 導入專案到 Vercel

1. 前往 https://vercel.com
2. 使用 GitHub 帳號登入
3. 點擊 "Add New..." → "Project"
4. 導入 contracts-l1 倉庫
5. Framework Preset: 自動偵測為 Next.js
6. Root Directory: `apps/web`

### 步驟 2: 配置環境變數

在 Vercel 專案設定中添加環境變數:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API Backend
NEXT_PUBLIC_API_URL=https://contracts-l1-api.up.railway.app

# Analytics (可選)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

### 步驟 3: 部署

1. 點擊 "Deploy"
2. Vercel 會自動構建並部署
3. 部署完成後獲得 URL: https://contracts-l1.vercel.app
4. 每次推送到 main 分支會自動重新部署

## 第五階段:Upstash Redis 設定

### 步驟 1: 創建 Redis 資料庫

1. 前往 https://upstash.com
2. 使用 GitHub 帳號登入
3. 創建新資料庫:
   - 名稱: contracts-l1-cache
   - 類型: Global (最佳延遲)
   - 區域: 選擇最近區域

### 步驟 2: 獲取連接資訊

1. 在資料庫詳情頁面複製 Redis URL
2. 更新 Railway 與本地環境變數:
```env
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

## 第六階段:AI 模型整合

### 選項 A: 使用免費 API 配額

#### OpenAI (推薦用於生產品質)
1. 註冊 https://platform.openai.com
2. 新帳號獲得 $5 免費額度
3. 在 API keys 創建新金鑰
4. 添加到環境變數:
```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview
```

#### Google Gemini (高免費配額)
1. 前往 https://aistudio.google.com
2. 獲取 API 金鑰(每分鐘 60 次免費請求)
3. 添加到環境變數:
```env
GOOGLE_AI_API_KEY=AIza...
```

### 選項 B: 自託管開源模型

使用 Hugging Face Spaces 免費 GPU:

1. 前往 https://huggingface.co
2. 創建新 Space:
   - SDK: Gradio
   - Hardware: CPU basic (免費) 或 T4 small (免費但有隊列)
3. 上傳模型部署腳本
4. 獲得推理端點 URL
5. 配置:
```env
HF_INFERENCE_ENDPOINT=https://xxx.hf.space
HF_API_KEY=hf_...
```

## 第七階段:語義引擎部署

### 向量索引 - Pinecone

1. 註冊 https://www.pinecone.io
2. 創建免費索引:
   - 名稱: contracts-semantic
   - Dimensions: 384 (匹配 MiniLM 模型)
   - Metric: cosine
   - Region: us-east-1
3. 獲取 API 金鑰與環境
4. 配置:
```env
PINECONE_API_KEY=xxx
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=contracts-semantic
```

### 圖資料庫 - Neo4j Aura Free

1. 註冊 https://neo4j.com/cloud/aura
2. 創建免費實例(50,000 nodes, 175,000 relationships)
3. 記錄連接字串與密碼
4. 配置:
```env
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
```

## 第八階段:CI/CD 設定

### GitHub Actions 配置

所有工作流程已在 `.github/workflows/` 目錄中定義,需要設定 Secrets:

1. 前往 GitHub 倉庫 Settings → Secrets → Actions
2. 添加以下 Secrets:

```
# Railway 部署
RAILWAY_TOKEN=xxx

# Vercel 部署
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx

# AI 服務
OPENAI_API_KEY=sk-proj-...
GOOGLE_AI_API_KEY=AIza...

# 代碼品質
CODECOV_TOKEN=xxx
SNYK_TOKEN=xxx

# CodeRabbit AI 審查(可選)
CODERABBIT_API_KEY=xxx
```

### 測試 CI/CD

1. 創建新分支並提交變更
2. 開啟 Pull Request
3. 觀察自動觸發的檢查
4. 合併到 main 後自動部署

## 第九階段:監控與告警設定

### Sentry 錯誤追蹤

1. 註冊 https://sentry.io (免費 5,000 events/month)
2. 創建新專案
3. 獲取 DSN
4. 配置:
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
```

### Better Stack 監控

1. 註冊 https://betterstack.com (免費基礎監控)
2. 添加網站監控
3. 設定健康檢查 endpoint
4. 配置告警通知(Email/Slack)

### Grafana Cloud 指標

1. 註冊 https://grafana.com (免費 10,000 series)
2. 創建 Stack
3. 設定 Prometheus 數據源
4. 導入預製儀表板

## 第十階段:域名與 SSL 設定

### 使用 Cloudflare(免費 CDN + SSL)

1. 註冊 https://cloudflare.com
2. 添加您的域名
3. 更新域名伺服器到 Cloudflare
4. 在 DNS 設定中添加記錄:
```
Type  Name  Content
CNAME www   contracts-l1.vercel.app
CNAME api   contracts-l1-api.up.railway.app
```
5. 在 SSL/TLS 設定啟用 "Full (strict)"
6. 免費 SSL 證書自動配置

### 更新 CORS 設定

在 Railway API 服務環境變數添加:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 驗證部署

### 功能測試檢查清單

- [ ] 前端可以訪問並正常載入
- [ ] 使用者可以註冊新帳號
- [ ] 使用者可以登入
- [ ] 可以上傳測試契約
- [ ] AI 分析正常執行並返回結果
- [ ] 分析結果正確顯示
- [ ] 語義搜尋功能正常
- [ ] 相似契約推薦運作
- [ ] 郵件通知發送成功
- [ ] API 文檔可訪問
- [ ] 錯誤追蹤記錄異常
- [ ] 監控儀表板顯示指標

### 性能測試

```bash
# 使用 k6 進行負載測試
k6 run tests/load/basic-flow.js

# 檢查回應時間
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health
```

## 成本監控

### 設定預算告警

1. Vercel: Settings → Usage → 設定 Email 告警
2. Railway: Settings → Usage → 配置限額
3. Supabase: Settings → Billing → 啟用通知
4. 定期檢查 monitoring/cost-report.sh 輸出

### 預期免費額度使用率

在初期 100 個活躍用戶情況下:

- Vercel: ~5GB bandwidth / 月(限額 100GB)
- Railway: ~$3 / 月(限額 $5)
- Supabase: ~200MB database(限額 500MB)
- Upstash: ~5K commands / 日(限額 10K)
- Pinecone: ~800K vectors(限額 1M)

當接近限額時考慮優化或升級計畫。

## 故障排除

### 常見問題

**Q: 資料庫遷移失敗**
A: 檢查 DATABASE_URL 格式,確保使用 connection pooling URL

**Q: API 回應 CORS 錯誤**
A: 確認 ALLOWED_ORIGINS 包含前端域名

**Q: AI 分析超時**
A: 增加 Railway worker 的超時設定或使用更快的模型

**Q: 向量搜尋慢**
A: 檢查 Pinecone 索引配置,考慮添加快取

**Q: 部署失敗**
A: 檢查構建日誌,通常是依賴或環境變數問題

### 獲取幫助

- 技術問題: GitHub Issues
- 討論: GitHub Discussions
- 即時協助: Discord 社群

## 下一步

部署完成後,建議:

1. 完成安全檢查清單
2. 設定自動備份
3. 建立災難恢復計畫
4. 優化性能瓶頸
5. 收集用戶回饋迭代改進

恭喜!您已完成 Contracts-L1 的零成本部署。
