# Contracts-L1: AI驅動的契約管理與分析平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![CI/CD](https://github.com/your-org/contracts-l1/workflows/CI/badge.svg)](https://github.com/your-org/contracts-l1/actions)

Contracts-L1 是一個採用漸進式架構設計的現代化契約管理平台,整合先進的語義引擎與人工智慧技術,為企業提供智能化的契約分析、風險評估與合規管理解決方案。

## ✨ 核心特性

### 智能契約分析
系統運用大型語言模型深度理解契約內容,自動識別付款條款、責任限制、終止條件、智慧財產權等關鍵條款。分析過程採用多層推理引擎,根據契約複雜度智能選擇本地模型或雲端 API,在成本與品質間取得最佳平衡。每個條款都附帶風險評分與詳細說明,幫助使用者快速掌握契約要點。

### 語義搜尋與推薦
建構在向量化與圖結構的混合語義引擎之上,系統能夠理解查詢的深層語意而非僅做關鍵字匹配。使用者可以用自然語言描述需求,系統會返回語義相關的契約與條款。相似契約推薦功能自動發現歷史契約中的相關案例,為新契約談判提供參考基準。

### 零成本部署方案
整個系統基於開源技術棧與免費雲端服務構建,無需信用卡即可完整部署。前端託管在 Vercel,後端運行於 Railway,資料儲存使用 Supabase,快取層採用 Upstash Redis。這些服務的免費方案足以支撐初期數千用戶的使用需求,當業務增長時可以無縫升級到付費方案而無需重構系統。

### 漸進式架構演進
專案設計支援從單體應用平滑演進到微服務架構,從全程式碼開發過渡到低程式碼配置。初期團隊可以使用模組化單體快速迭代,當規模增長時選擇性地將資源密集模組拆分為獨立服務。業務邏輯透過零碼配置檔案管理,非技術人員也能調整風險評分規則與合規檢查標準。

## 🚀 快速開始

### 環境需求

專案需要以下軟體環境:

- Node.js 版本 20 或更新版本,推薦使用 LTS 版本以確保穩定性
- pnpm 版本 8 或更新版本作為套件管理器,提供比 npm 更快的安裝速度與更好的 monorepo 支援
- Docker 與 Docker Compose 用於本地開發環境,運行 PostgreSQL、Redis、Neo4j 等服務
- Git 用於版本控制與協作開發

### 本地開發設定

首先複製專案倉庫並安裝依賴:

```bash
git clone https://github.com/your-org/contracts-l1.git
cd contracts-l1
pnpm install
```

啟動本地服務容器,這會自動配置開發所需的資料庫、快取與圖資料庫:

```bash
docker-compose -f docker/docker-compose.dev.yml up -d
```

初始化資料庫結構並載入測試數據:

```bash
pnpm run db:migrate
pnpm run db:seed
```

複製環境變數範例檔案並根據需要調整設定:

```bash
cp .env.example .env.local
```

啟動開發伺服器,Turborepo 會並行運行所有服務:

```bash
pnpm run dev
```

現在可以訪問以下端點:

- 前端應用: http://localhost:3000
- API 服務: http://localhost:4000
- API 文檔: http://localhost:4000/api-docs
- Prisma Studio: http://localhost:5555

### 生產環境部署

完整的零成本部署指南請參考 [部署文檔](docs/deployment/zero-cost-deployment-guide.md),該文檔詳細說明如何將系統部署到 Vercel、Railway、Supabase 等免費雲端平台,預計完成時間約兩到三小時。

## 📖 文檔

### 架構文檔
- [系統架構設計](docs/architecture/system-design.md) - 整體架構概覽與設計決策
- [資料模型說明](docs/architecture/data-model.md) - 資料庫結構與關係定義
- [架構演進指南](docs/architecture/evolution-guide.md) - 從單體到微服務的遷移路徑
- [架構決策記錄](docs/architecture/ADR/) - 重要技術決策的歷史脈絡

### API 文檔
- [REST API 參考](docs/api/openapi.yml) - OpenAPI 3.0 規範
- [GraphQL Schema](docs/api/graphql-schema.gql) - GraphQL 查詢介面
- [Webhook 說明](docs/api/webhooks.md) - 事件通知機制

### 開發指南
- [開發環境設定](docs/development/setup.md) - 詳細的環境配置步驟
- [編碼規範](docs/development/coding-standards.md) - 程式碼風格與最佳實踐
- [貢獻指南](docs/development/contributing.md) - 如何參與專案開發
- [測試策略](docs/development/testing.md) - 單元、整合、端到端測試

### 使用者指南
- [快速入門](docs/user-guides/getting-started.md) - 新使用者導覽
- [功能說明](docs/user-guides/features.md) - 完整功能介紹
- [常見問題](docs/user-guides/faq.md) - 疑難解答

## 🏗️ 專案結構

專案採用 monorepo 架構,使用 Turborepo 管理多個應用與套件:

```
contracts-l1/
├── apps/                    # 應用程式
│   ├── web/                # Next.js 前端
│   ├── api/                # Express 後端 API
│   ├── worker/             # 背景任務處理
│   └── admin-panel/        # 管理後台(低程式碼)
├── packages/                # 共享套件
│   ├── shared/             # 共享類型與工具
│   ├── ui/                 # UI 組件庫
│   ├── ai-engine/          # AI 推理引擎
│   ├── semantic-engine/    # 語義處理引擎
│   └── database/           # 資料庫 Schema
├── config/                  # 配置檔案(零碼)
├── docs/                    # 文檔
└── scripts/                 # 自動化腳本
```

完整的目錄結構說明請參考 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)。

## 🛠️ 技術棧

### 前端技術
- Next.js 14 搭配 App Router 提供現代化的 React 開發體驗
- TypeScript 5.3 確保型別安全與開發效率
- Tailwind CSS 3 實現響應式設計與一致的視覺風格
- Radix UI 提供無障礙的基礎組件
- Zustand 作為輕量級狀態管理解決方案

### 後端技術
- Node.js 20 與 Express.js 構建高性能 API 服務
- Prisma ORM 簡化資料庫操作與遷移管理
- Bull Queue 處理異步任務與背景工作
- OpenAPI 3.0 規範自動生成 API 文檔
- JWT 實現無狀態的身份驗證機制

### 資料儲存
- PostgreSQL 15 作為主要關聯式資料庫
- Redis 7 提供高速快取與會話儲存
- Neo4j Community Edition 建構知識圖譜
- Pinecone 或 Qdrant 儲存語義向量

### AI 與機器學習
- OpenAI GPT-4 進行複雜契約分析
- Sentence Transformers 生成語義向量
- Hugging Face Models 提供開源替代方案
- LangChain 編排複雜的 AI 工作流程

### 開發工具
- GitHub Actions 實現完整的 CI/CD 流程
- Jest 與 Playwright 覆蓋單元與端到端測試
- ESLint 與 Prettier 維護代碼品質
- Turborepo 加速 monorepo 的建構與測試
- CodeRabbit AI 輔助代碼審查

## 🔄 架構演進路徑

### 階段一:智能單體 (當前)
適合團隊規模二到五人,月活躍用戶數千人以內。所有服務在單一應用程序中運行但邏輯清晰分離,部署在 Railway 單一容器。使用 Supabase PostgreSQL 單一實例,透過 Schema 隔離不同業務領域。這個階段專注於快速驗證產品價值,建立核心功能,收集使用者回饋。

### 階段二:混合架構
當團隊擴展到五至十五人,月活躍用戶上萬時開始演進。資源密集的 AI 分析服務與語義索引服務拆分為獨立微服務,部署在專門的運算資源上。核心業務邏輯保持在單體應用以維持開發效率。服務間透過 REST API 與消息佇列通訊,開始使用服務發現與負載均衡。

### 階段三:完全微服務
團隊規模十五人以上,月活躍用戶數十萬時的目標架構。每個業務能力由獨立服務提供,擁有專屬資料庫與團隊所有權。使用 Kubernetes 編排容器,Istio 管理服務網格。實施事件驅動架構,服務間透過事件流進行異步通訊,實現最終一致性。

詳細的演進策略與遷移指南請參考 [架構演進文檔](docs/architecture/evolution-guide.md)。

## 🧪 測試

專案維持高測試覆蓋率確保代碼品質:

```bash
# 運行所有測試
pnpm run test

# 單元測試
pnpm run test:unit

# 整合測試(需要資料庫)
pnpm run test:integration

# 端到端測試
pnpm run test:e2e

# 測試覆蓋率報告
pnpm run test:coverage
```

目標覆蓋率指標:
- 單元測試覆蓋率大於百分之八十
- 關鍵業務邏輯覆蓋率百分之百
- API 端點整合測試完整覆蓋
- 核心使用者流程端到端測試覆蓋

## 📊 監控與可觀測性

### 指標收集
使用 Prometheus 收集系統指標,Grafana Cloud 免費方案可視化。預配置的儀表板包括系統健康狀況、API 效能指標、AI 使用成本、使用者行為分析。關鍵指標包括請求量、回應時間、錯誤率、資料庫連接數、快取命中率、佇列長度。

### 錯誤追蹤
Sentry 免費方案提供每月五千個事件的錯誤追蹤能力。所有未捕獲的異常自動上報,包含完整的堆疊追蹤、使用者上下文、環境資訊。錯誤可以分組、分配給團隊成員、追蹤修復進度。整合 GitHub 自動在相關 commit 中關聯問題。

### 日誌管理
結構化日誌使用 JSON 格式輸出,便於機器解析與搜尋。開發環境日誌輸出到控制台,生產環境聚合到 Loki 或 Grafana Cloud。日誌分級為 debug、info、warn、error,生產環境預設 info 級別。敏感資訊如密碼、令牌在日誌中自動脫敏。

## 💰 成本優化

### 零成本運營策略
初期階段完全基於免費服務運營,無需任何費用。關鍵優化措施包括積極的快取策略減少重複計算與 API 呼叫、批次處理合併小請求降低網路開銷、查詢優化確保資料庫效能、資源池化重用連接與物件、延遲載入僅載入必要資源。

### 成本監控
實時追蹤所有可能產生費用的資源使用,包括 API 令牌消耗、資料庫查詢次數、頻寬使用量、函式執行時間。當接近免費額度限制時自動發送告警,觸發降級策略。每週生成成本報告,分析趨勢預測何時需要升級方案。

### 升級路徑
當免費額度不足時,可以選擇性升級特定服務。優先升級瓶頸服務如資料庫或 API 呼叫,保持其他服務免費。使用混合方案在成本與性能間取得平衡,例如付費雲端 AI 與免費本地模型並用。詳細的升級建議請參考 [成本優化文檔](docs/deployment/cost-optimization.md)。

## 🔒 安全性

### 身份驗證與授權
使用 JWT 實現無狀態身份驗證,令牌包含使用者識別碼與角色資訊。支援電子郵件密碼登入、OAuth 社交登入、多因素認證。基於角色的存取控制劃分管理員、分析師、檢視者權限。API 速率限制防止濫用,每個端點有獨立的限額配置。

### 資料保護
所有敏感資料在儲存時使用 AES-256 加密,包括密碼、API 金鑰、契約內容。傳輸層強制使用 TLS 1.3,禁用舊版不安全協定。個人識別資訊遵循 GDPR 要求,使用者可以匯出或刪除所有個人數據。定期的安全掃描檢測已知漏洞,自動更新依賴套件。

### 合規性
系統設計符合資料保護法規要求,包括資料處理記錄、使用者同意管理、資料攜帶權、被遺忘權。稽核日誌記錄所有敏感操作,保留期限符合法規要求。資料備份加密儲存在多個地理位置,確保災難恢復能力。

## 🤝 參與貢獻

我們歡迎任何形式的貢獻,包括但不限於新功能開發、錯誤修復、文檔改進、設計優化。在開始之前,請閱讀 [貢獻指南](docs/development/contributing.md) 了解開發流程與編碼規範。

### 開發流程
1. Fork 專案倉庫到您的 GitHub 帳號
2. 創建功能分支從 develop 分出,使用描述性名稱如 feature/semantic-search-enhancement
3. 提交變更確保遵循編碼規範,包含充分的測試與文檔
4. 推送分支到您的 Fork 倉庫
5. 開啟 Pull Request 到主倉庫的 develop 分支,詳細描述變更內容與動機
6. 等待程式碼審查團隊成員會檢視您的 PR 並提供回饋
7. 根據回饋修改必要時更新 PR
8. 合併當所有檢查通過且獲得批准後,PR 會被合併

### 行為準則
參與專案的所有成員都應遵循我們的行為準則,尊重他人、包容差異、建設性溝通、專業協作。我們致力於創造友善、歡迎的社群環境,讓每個人都能貢獻其才能。

## 📄 授權

本專案採用 MIT 授權條款,詳細內容請參考 [LICENSE](LICENSE) 檔案。您可以自由使用、修改、分發本軟體,無論商業或非商業用途,只需保留原始授權聲明。

## 🙏 致謝

本專案的實現依賴許多優秀的開源專案與免費服務:

- OpenAI 提供強大的語言模型能力
- Vercel 提供卓越的前端託管服務
- Railway 提供簡潔的後端部署平台
- Supabase 提供完整的後端即服務解決方案
- Hugging Face 提供豐富的開源模型資源
- 所有貢獻者與支持者的寶貴付出

## 📞 聯絡方式

- 專案倉庫: https://github.com/your-org/contracts-l1
- 問題回報: https://github.com/your-org/contracts-l1/issues
- 討論區: https://github.com/your-org/contracts-l1/discussions
- 電子郵件: support@contracts-l1.com
- Discord 社群: https://discord.gg/contracts-l1

---

用 ❤️ 與 ☕ 打造 | Made by Contracts-L1 Team
