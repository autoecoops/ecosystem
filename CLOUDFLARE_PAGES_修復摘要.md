# Cloudflare Pages 部署修復 - 修改摘要

## ✅ 已完成的修改

### 1. 更新 `frontend/project-01/package.json` 中的 `build:cf` 指令

**原始指令：**
```json
"build:cf": "NEXT_PUBLIC_SUPABASE_URL=https://yrfxijooswpvdpdseswy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rhTyBa4IqqV14nV_B87S7g_zKzDSYTd npx @opennextjs/cloudflare@1.16.5 build"
```

**新指令：**
```json
"build:cf": "NEXT_PUBLIC_SUPABASE_URL=https://yrfxijooswpvdpdseswy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rhTyBa4IqqV14nV_B87S7g_zKzDSYTd npx @opennextjs/cloudflare@1.16.5 build && mv .open-next/worker.js .open-next/_worker.js && if [ -d .open-next/assets ] && [ \"$(ls -A .open-next/assets 2>/dev/null)\" ]; then cp -r .open-next/assets/* .open-next/; else echo 'Warning: .open-next/assets is missing or empty; skipping asset copy.' >&2; fi && node -e 'require(\"fs\").writeFileSync(\".open-next/_routes.json\", JSON.stringify({version:1,include:[\"/*\"],exclude:[\"/_next/static/*\",\"/favicon.ico\",\"/robots.txt\",\"/sitemap.xml\",\"/404.html\",\"/BUILD_ID\"]},null,2))'"
```

**變更內容：**
- ✅ 保留了 Supabase 環境變數
- ✅ 使用 `@opennextjs/cloudflare@1.16.5` 固定版本（確保可重現的建置）
- ✅ 添加後處理步驟：
  1. `mv .open-next/worker.js .open-next/_worker.js` - 重新命名為 Cloudflare Pages 需要的格式
  2. 檢查並複製 assets 到正確位置，包含錯誤處理
  3. `node -e '...'` - 生成 `_routes.json` 路由配置檔案（只排除必要的靜態檔案）

### 2. 移除根目錄的 `wrangler.toml`

- ✅ 已移除 `wrangler.toml` 檔案
- ✅ 這樣可以避免 Cloudflare Pages 的警告訊息
- ℹ️ 注意：`frontend/project-01/wrangler.toml` 仍然保留供本地開發使用

---

## 📝 Cloudflare Pages 設定變更

完成程式碼修改後，你需要在 Cloudflare Pages 修改以下設定：

### 進入設定頁面
1. 登入 Cloudflare Dashboard
2. 進入你的 Pages 專案
3. 點選 **Settings** → **Builds & deployments**
4. 找到 **Build configuration** 區塊

### 必要的設定變更

| 設定項目 | 設定值 |
|---------|--------|
| **Framework preset** | `Next.js (Static HTML Export)` 或 `None` |
| **Build command** | `pnpm --filter="./frontend/project-01..." run build:cf` |
| **Build output directory** | `frontend/project-01/.open-next` (注意：是 `.open-next` 不是 `.open-next/assets`) |
| **Root directory** | `/` (保持根目錄，不要改成 frontend/project-01) |

> **重要：** 此專案使用 pnpm monorepo 結構，請務必使用正確的 `--filter` 語法。使用 `cd` 指令（例如 `cd frontend/project-01 && pnpm run build:cf`）會導致 pnpm 忽略 workspace 根目錄，造成依賴解析失敗。

---

## 🚀 部署步驟

1. **Merge 這個 PR** 到你的 main branch
2. **進入 Cloudflare Pages 設定頁面** 如上所述
3. **更新所有設定** 如上表所示
4. **儲存設定** (點擊 Save)
5. **重新部署**：
   - 進入 **Deployments** 分頁
   - 找到最新的失敗部署
   - 點擊 **Retry deployment**
6. **等待建置完成** - 這次應該會上傳所有檔案而不是只有 52 個

---

## 🔍 預期結果

建置成功後，`.open-next` 資料夾應該包含：

```
frontend/project-01/.open-next/
├── _worker.js          (Cloudflare Worker 入口點)
├── _routes.json        (路由配置)
├── _next/              (Next.js 靜態檔案)
├── cache/
└── [其他建置檔案]
```

之前的問題（只上傳 52 個檔案）是因為：
- ❌ `worker.js` 沒有重新命名為 `_worker.js`（Cloudflare Pages 要求）
- ❌ assets 沒有複製到正確位置
- ❌ 缺少 `_routes.json`，導致路由問題和 404 錯誤

**已修正的改進：**
- ✅ 固定 `@opennextjs/cloudflare@1.16.5` 版本，確保可重現的建置
- ✅ 添加適當的錯誤處理機制
- ✅ 清理 `_routes.json` 只排除相關的靜態資源
- ✅ 輸出目錄從 `.open-next/assets` 改為 `.open-next` 根目錄

現在這些問題都已修正！✅

---

## 📚 詳細文件

更多詳細說明和疑難排解，請參考：
- [CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md) (英文版完整文件)

---

## ⚠️ 注意事項

### 關於 Supabase API Keys
- 這些 key 是公開的匿名金鑰（NEXT_PUBLIC_* 和 sb_publishable_* 前綴表示）
- 它們設計上就是要在客戶端程式碼中公開的
- 如果想要更好的安全實務，可以考慮將它們設定為 Cloudflare Pages 的環境變數

### 關於長指令
- build:cf 指令很長，但這是為了確保與 Cloudflare Pages 直接從 GitHub 部署的相容性
- 如果需要更好的維護性，可以將後處理步驟提取到獨立的 script 檔案中

---

有任何問題，請查看 [CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md) 中的疑難排解章節！
