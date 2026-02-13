# Vercel 部署指南 (推薦方案)

## 為什麼選擇 Vercel

您的 Next.js 應用包含大量 API Routes 和服務器端功能，**無法**使用 Cloudflare Pages 靜態導出模式。Vercel 是 Next.js 的最佳部署平台。

### Vercel 優勢

✅ **完美支持 Next.js** - 由 Next.js 開發團隊創建
✅ **支持所有功能** - API Routes、SSR、ISR、Middleware 全部可用
✅ **零配置** - 自動識別 Next.js 項目並優化配置
✅ **免費方案** - 個人和小型項目完全免費
✅ **自動 HTTPS** - 免費 SSL 證書
✅ **全球 CDN** - 自動部署到全球邊緣節點
✅ **GitHub 集成** - 每次推送自動部署
✅ **預覽部署** - PR 自動生成預覽環境
✅ **環境變數管理** - 簡單的環境變數配置

## 快速部署步驟

### 1. 註冊/登入 Vercel

前往 https://vercel.com/signup

- 使用 GitHub 帳號登入（推薦）
- 或使用 GitLab、Bitbucket、Email

### 2. 導入項目

1. 登入後點擊 **"Add New..."** → **"Project"**
2. 從列表中選擇 `autoecoops/ecosystem` 儲存庫
3. 如果沒看到儲存庫，點擊 **"Adjust GitHub App Permissions"** 授權訪問

### 3. 配置項目

**Framework Preset:** 自動檢測為 Next.js ✓

**Root Directory:** 
```
frontend/project-01
```
⚠️ 重要：必須設置根目錄為 `frontend/project-01`

**Build and Output Settings:**
- Build Command: `pnpm run build` (自動檢測)
- Output Directory: `.next` (自動設置)
- Install Command: `pnpm install` (自動檢測)

### 4. 配置環境變數

在部署前添加必要的環境變數：

點擊 **"Environment Variables"** 添加：

#### Supabase 相關
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### AI API Keys
```
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-key (如果使用)
ANTHROPIC_API_KEY=your-anthropic-key (如果使用)
```

#### 其他必要變數
根據您的 `.env.example` 文件添加其他需要的環境變數。

### 5. 部署

點擊 **"Deploy"** 按鈕

- ⏳ Vercel 將自動安裝依賴、構建應用、部署到生產環境
- 📊 可以實時查看部署日誌
- ⏱️ 首次部署通常需要 2-5 分鐘

### 6. 部署完成

✅ 部署成功後，您將獲得：

- **生產環境 URL**: `https://your-project.vercel.app`
- **預覽環境**: 每個 PR 都會自動生成預覽 URL
- **部署日誌**: 完整的構建和部署日誌

## 自動部署配置

### GitHub 集成

Vercel 自動配置 GitHub 集成：

✅ **推送到主分支** → 自動部署到生產環境
✅ **創建 PR** → 自動創建預覽部署
✅ **更新 PR** → 自動更新預覽部署
✅ **合併 PR** → 自動部署到生產環境

### 分支部署策略

**Production Branch:** `main` 或 `master`
- 推送到此分支 → 生產環境部署

**Preview Branches:** 所有其他分支
- 推送到其他分支 → 預覽環境部署

## 自定義域名配置

### 1. 添加自定義域名

在 Vercel 項目設置中：

1. 前往 **Settings** → **Domains**
2. 輸入您的域名（例如：`app.example.com`）
3. 點擊 **Add**

### 2. 配置 DNS

根據 Vercel 提供的說明配置 DNS：

**選項 A: CNAME 記錄**（推薦）
```
Type: CNAME
Name: app (或 @)
Value: cname.vercel-dns.com
```

**選項 B: A 記錄**
```
Type: A
Name: @ (或 app)
Value: 76.76.21.21
```

### 3. 驗證和啟用 HTTPS

- Vercel 自動配置 SSL 證書
- 通常在幾分鐘內完成
- 自動啟用 HTTPS 重定向

## 環境管理

### 開發環境

在本地開發時使用 `.env.local`：

```bash
# frontend/project-01/.env.local
NEXT_PUBLIC_SUPABASE_URL=your-dev-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
GROQ_API_KEY=your-dev-groq-key
```

### 生產環境

在 Vercel Dashboard 配置生產環境變數：

1. **Settings** → **Environment Variables**
2. 為每個環境（Production, Preview, Development）配置變數
3. 可以為不同環境使用不同的值

### 環境變數優先級

```
Vercel Environment Variables > .env.local > .env
```

## 監控和日誌

### 部署日誌

在 Vercel Dashboard 查看：
- **Deployments** → 選擇部署 → **View Build Logs**

### 運行時日誌

查看函數執行日誌：
- **Deployments** → 選擇部署 → **Functions**
- 點擊函數查看執行日誌

### Analytics

Vercel 提供內建的 Web Analytics：
- **Analytics** 標籤
- 免費的基本指標
- 可升級獲得更詳細的分析

## 性能優化

### 1. 圖片優化

Vercel 自動優化圖片：
```javascript
// next.config.js
const nextConfig = {
  images: {
    // 移除 unoptimized: true 以使用 Vercel Image Optimization
    domains: ['your-cdn-domain.com'],
  },
};
```

### 2. 緩存配置

API Routes 自動緩存：
```javascript
// app/api/example/route.ts
export const revalidate = 60; // 緩存 60 秒
```

### 3. Edge Functions

將 API Routes 部署到邊緣：
```javascript
// app/api/example/route.ts
export const runtime = 'edge';
```

## 常見問題

### 構建失敗

**問題**: 依賴安裝失敗
**解決**: 檢查 `package.json` 確保所有依賴都已正確聲明

**問題**: 構建超時
**解決**: 
- 檢查是否有大型依賴
- 優化構建過程
- 考慮升級 Vercel 方案

### 環境變數問題

**問題**: `NEXT_PUBLIC_*` 變數未定義
**解決**: 
- 確保變數以 `NEXT_PUBLIC_` 開頭
- 重新部署以應用新的環境變數
- 檢查變數名稱拼寫

### API Routes 錯誤

**問題**: API 返回 500 錯誤
**解決**:
- 查看函數日誌找出錯誤
- 確保所有環境變數都已配置
- 檢查 API 限流和配額

## Vercel CLI (可選)

### 安裝

```bash
npm i -g vercel
```

### 本地預覽

```bash
cd frontend/project-01
vercel dev
```

### 手動部署

```bash
cd frontend/project-01
vercel --prod
```

## 定價

### Hobby 方案（免費）
- ✅ 無限制的網站和 API
- ✅ 100 GB 帶寬/月
- ✅ 自動 HTTPS
- ✅ 預覽部署
- ✅ 適合個人項目

### Pro 方案（$20/月）
- ✅ Hobby 方案的所有功能
- ✅ 1 TB 帶寬/月
- ✅ 更高的函數執行限制
- ✅ 團隊協作
- ✅ 進階分析
- ✅ 適合商業項目

## 從 Vercel 遷移到其他平台

如果將來需要遷移，Vercel 不會鎖定您：

- ✅ 標準的 Next.js 應用
- ✅ 可以部署到任何支持 Next.js 的平台
- ✅ 沒有專有的 API 或配置

## 總結

**為什麼 Vercel 是最佳選擇:**

1. ✅ 零配置，5 分鐘部署
2. ✅ 完美支持所有 Next.js 功能
3. ✅ 免費方案足夠使用
4. ✅ 自動 CI/CD
5. ✅ 全球 CDN 和邊緣網絡
6. ✅ 優秀的開發體驗

**下一步:**

1. 前往 https://vercel.com/signup
2. 連接 GitHub 儲存庫
3. 設置根目錄為 `frontend/project-01`
4. 配置環境變數
5. 部署！

部署成功後，您將獲得一個可用的生產環境 URL，所有 API Routes 都能正常工作。
