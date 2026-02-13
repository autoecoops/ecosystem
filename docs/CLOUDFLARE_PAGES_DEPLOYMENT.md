# Cloudflare Pages 部署指南

本文檔說明如何將 frontend/project-01 前端應用部署到 Cloudflare Pages。

## 問題診斷

原先的配置存在以下問題：

1. **錯誤的部署類型**: `wrangler.toml` 配置為 Cloudflare Workers (service-worker 格式)，但 Next.js 應用應該使用 Cloudflare Pages
2. **缺少輸出目錄配置**: 沒有正確指定構建輸出目錄
3. **Next.js 配置不兼容**: Next.js 配置需要啟用靜態導出（static export）才能部署到 Cloudflare Pages
4. **缺少 CI/CD 流程**: 沒有自動化部署流水線

## 修復方案

### 1. 更新 wrangler.toml

已將 `wrangler.toml` 更新為正確的 Cloudflare Pages 配置：

```toml
name = "autoecoops-ecosystem"
compatibility_date = "2024-12-01"
pages_build_output_dir = "./frontend/project-01/out"
```

### 2. 更新 Next.js 配置

在 `frontend/project-01/next.config.js` 中添加：

```javascript
output: 'export',  // 啟用靜態導出
trailingSlash: true,  // 添加尾隨斜杠以提高兼容性
```

### 3. 添加 GitHub Actions 工作流

創建 `.github/workflows/deploy-cloudflare-pages.yml` 實現自動部署。

## 部署選項

### 選項 A: 通過 Cloudflare Dashboard (推薦給初學者)

1. **登入 Cloudflare Dashboard**
   - 前往 https://dash.cloudflare.com/
   - 選擇 "Pages" 服務

2. **連接 GitHub 儲存庫**
   - 點擊 "Create a project"
   - 選擇 "Connect to Git"
   - 授權 Cloudflare 訪問您的 GitHub 帳戶
   - 選擇 `autoecoops/ecosystem` 儲存庫

3. **配置構建設置**
   ```
   Framework preset: Next.js
   Build command: cd frontend/project-01 && pnpm install && pnpm run build
   Build output directory: frontend/project-01/out
   Root directory: /
   ```

4. **配置環境變數** (如果需要)
   - 在 "Environment variables" 部分添加所需的環境變數
   - 例如: `NEXT_PUBLIC_API_URL`, `SUPABASE_URL` 等

5. **部署**
   - 點擊 "Save and Deploy"
   - Cloudflare 將自動構建並部署您的應用

### 選項 B: 通過 GitHub Actions (推薦給開發團隊)

1. **在 GitHub 設置 Secrets**
   
   前往您的 GitHub 儲存庫設置，添加以下 Secrets:
   
   - `CLOUDFLARE_API_TOKEN`: 
     * 前往 Cloudflare Dashboard → My Profile → API Tokens
     * 創建一個具有 "Cloudflare Pages: Edit" 權限的 Token
   
   - `CLOUDFLARE_ACCOUNT_ID`:
     * 在 Cloudflare Dashboard 中找到您的 Account ID
     * 通常在 URL 中: `https://dash.cloudflare.com/<account_id>/`

2. **推送代碼**
   
   當您推送代碼到 `main` 或 `master` 分支時，GitHub Actions 將自動:
   - 安裝依賴
   - 構建應用
   - 部署到 Cloudflare Pages

### 選項 C: 使用 Wrangler CLI (本地部署)

1. **安裝 Wrangler**
   ```bash
   pnpm add -g wrangler
   ```

2. **登入 Cloudflare**
   ```bash
   wrangler login
   ```

3. **構建應用**
   ```bash
   cd frontend/project-01
   pnpm run build
   ```

4. **部署**
   ```bash
   wrangler pages deploy out --project-name=autoecoops-ecosystem
   ```

## 驗證部署

部署完成後，您可以：

1. **訪問應用**
   - Cloudflare 將提供一個 URL，格式為: `https://autoecoops-ecosystem.pages.dev`
   - 您也可以配置自定義域名

2. **檢查部署日誌**
   - 在 Cloudflare Dashboard 的 Pages 項目中查看部署歷史和日誌
   - 在 GitHub Actions 中查看構建日誌（如果使用 GitHub Actions）

3. **測試功能**
   - 確保所有頁面和功能正常工作
   - 檢查 API 連接是否正常
   - 驗證環境變數是否正確配置

## 常見問題

### 1. 構建失敗：找不到依賴

**解決方案**: 確保在儲存庫根目錄有 `pnpm-lock.yaml`，並且構建命令正確切換到 `frontend/project-01` 目錄。

### 2. 部署後頁面空白

**原因**: Next.js 動態路由或服務端渲染功能與靜態導出不兼容。

**解決方案**: 
- 移除使用 `getServerSideProps` 的頁面
- 將動態路由改為靜態生成 (`getStaticPaths` + `getStaticProps`)
- 或考慮使用 Vercel 部署（完全支持 Next.js 所有功能）

### 3. API 請求失敗

**原因**: CORS 配置或 API URL 不正確。

**解決方案**:
- 檢查環境變數 `NEXT_PUBLIC_API_URL` 是否正確設置
- 確保後端 API 配置了正確的 CORS 設置
- 在 Cloudflare Pages 環境變數中添加必要的配置

### 4. 圖片或資源加載失敗

**原因**: 路徑配置問題。

**解決方案**:
- 確保在 `next.config.js` 中設置了 `images: { unoptimized: true }`
- 使用相對路徑或絕對路徑引用資源
- 檢查 `basePath` 配置是否正確

## 後續步驟

1. **配置自定義域名**
   - 在 Cloudflare Pages 設置中添加自定義域名
   - 配置 DNS 記錄指向 Cloudflare Pages

2. **設置預覽部署**
   - Pull Request 將自動創建預覽部署
   - 在合併前可以測試變更

3. **優化構建**
   - 考慮使用 Turborepo 的緩存功能加速構建
   - 配置增量構建以減少構建時間

4. **監控和分析**
   - 使用 Cloudflare Web Analytics 跟踪訪問情況
   - 設置錯誤監控和日誌記錄

## 參考資源

- [Cloudflare Pages 官方文檔](https://developers.cloudflare.com/pages/)
- [Next.js 靜態導出文檔](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [GitHub Actions for Cloudflare Pages](https://github.com/cloudflare/pages-action)
