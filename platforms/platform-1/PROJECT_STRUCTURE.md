# Contracts-L1 完整目錄結構
# 支援漸進式演進:單體→混合→微服務
# 支援多編碼範式:有碼→微碼→零碼

contracts-l1/
├── .github/
│   ├── workflows/                 # CI/CD 自動化工作流
│   │   ├── pr-check.yml          # PR 檢查:代碼品質、測試、安全掃描
│   │   ├── pr-architecture-review.yml  # AI 架構審查
│   │   ├── deploy-dev.yml        # 開發環境自動部署
│   │   ├── deploy-staging.yml    # 測試環境部署
│   │   └── deploy-production.yml # 生產環境部署(需審批)
│   ├── CODEOWNERS               # 代碼所有權定義
│   └── PULL_REQUEST_TEMPLATE.md  # PR 模板

├── apps/                         # 應用程序目錄
│   ├── web/                      # Next.js 前端應用(有碼)
│   │   ├── src/
│   │   │   ├── app/             # App Router 路由
│   │   │   ├── components/      # React 組件
│   │   │   ├── lib/             # 工具函數
│   │   │   └── styles/          # 樣式文件
│   │   ├── public/              # 靜態資源
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── api/                      # Express.js 後端 API(有碼)
│   │   ├── src/
│   │   │   ├── routes/          # API 路由定義
│   │   │   ├── services/        # 業務邏輯層
│   │   │   ├── models/          # 數據模型
│   │   │   ├── middleware/      # 中間件
│   │   │   └── utils/           # 工具函數
│   │   ├── tests/               # 測試文件
│   │   └── package.json
│   │
│   ├── worker/                   # 背景任務處理器(有碼)
│   │   ├── src/
│   │   │   ├── jobs/            # 任務定義
│   │   │   ├── processors/      # 任務處理邏輯
│   │   │   └── queue.ts         # 佇列管理
│   │   └── package.json
│   │
│   ├── admin-panel/              # 管理後台(微碼 - Retool/Appsmith)
│   │   ├── config/              # 低程式碼平台配置
│   │   ├── custom-components/   # 自定義組件
│   │   └── README.md            # 部署指引
│   │
│   └── workflow-automation/      # 工作流自動化(微碼 - n8n)
│       ├── workflows/           # n8n 工作流定義 JSON
│       ├── credentials/         # 憑證配置(加密)
│       └── README.md

├── packages/                     # 共享代碼套件
│   ├── shared/                   # 共享類型與工具
│   │   ├── src/
│   │   │   ├── types/           # TypeScript 類型定義
│   │   │   ├── constants/       # 常量定義
│   │   │   ├── utils/           # 通用工具函數
│   │   │   └── validators/      # 數據驗證器
│   │   └── package.json
│   │
│   ├── ui/                       # 共享 UI 組件庫
│   │   ├── src/
│   │   │   ├── components/      # 可重用組件
│   │   │   ├── hooks/           # 自定義 React Hooks
│   │   │   └── styles/          # 設計系統
│   │   └── package.json
│   │
│   ├── ai-engine/                # AI 推理引擎封裝
│   │   ├── src/
│   │   │   ├── providers/       # 各 AI 服務提供商封裝
│   │   │   ├── router/          # 智能路由決策
│   │   │   ├── cache/           # 結果快取
│   │   │   └── cost-tracker/    # 成本追蹤
│   │   └── package.json
│   │
│   ├── semantic-engine/          # 語義引擎實作
│   │   ├── src/
│   │   │   ├── vector/          # 向量化語義折疊
│   │   │   ├── graph/           # 圖結構語義
│   │   │   ├── hybrid/          # 混合搜尋
│   │   │   └── indexing/        # 實時索引
│   │   └── package.json
│   │
│   └── database/                 # 數據庫 Schema 與遷移
│       ├── prisma/
│       │   ├── schema.prisma    # Prisma Schema 定義
│       │   ├── migrations/      # 數據庫遷移歷史
│       │   └── seed.ts          # 測試數據種子
│       └── package.json

├── services/                     # 微服務目錄(混合/微服務階段)
│   ├── analysis-service/         # AI 分析微服務
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── k8s/                 # Kubernetes 配置
│   │   └── package.json
│   │
│   ├── indexing-service/         # 語義索引微服務
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── notification-service/     # 通知服務
│       ├── src/
│       └── package.json

├── config/                       # 配置文件目錄(零碼配置)
│   ├── architecture-evolution.yml     # 架構演進主配置
│   ├── semantic-engine.yml            # 語義引擎配置
│   ├── ai-models.yml                  # AI 模型編排配置
│   ├── business-rules/                # 業務規則引擎
│   │   ├── risk-scoring.yml           # 風險評分規則
│   │   ├── compliance-checks.yml      # 合規檢查規則
│   │   └── pricing-tiers.yml          # 定價方案配置
│   ├── deployment/                    # 部署配置
│   │   ├── dev.yml
│   │   ├── staging.yml
│   │   └── production.yml
│   └── monitoring/                    # 監控告警配置
│       ├── alerts.yml
│       └── dashboards.yml

├── docs/                         # 文檔目錄
│   ├── architecture/             # 架構設計文檔
│   │   ├── ADR/                 # Architecture Decision Records
│   │   ├── system-design.md     # 系統設計
│   │   ├── data-model.md        # 數據模型
│   │   └── evolution-guide.md   # 演進指南
│   ├── api/                      # API 文檔
│   │   ├── openapi.yml          # OpenAPI 規範
│   │   └── graphql-schema.gql   # GraphQL Schema
│   ├── development/              # 開發指南
│   │   ├── setup.md             # 環境設定
│   │   ├── contributing.md      # 貢獻指南
│   │   └── coding-standards.md  # 編碼規範
│   ├── deployment/               # 部署手冊
│   │   ├── zero-cost-setup.md   # 零成本部署指南
│   │   ├── migration-guide.md   # 遷移指南
│   │   └── troubleshooting.md   # 故障排除
│   └── user-guides/              # 用戶指南
│       ├── getting-started.md
│       └── features.md

├── scripts/                      # 自動化腳本
│   ├── setup/                    # 環境初始化
│   │   ├── setup-dev.sh         # 開發環境設定
│   │   ├── install-deps.sh      # 依賴安裝
│   │   └── init-database.sh     # 數據庫初始化
│   ├── deployment/               # 部署腳本
│   │   ├── deploy-vercel.sh
│   │   ├── deploy-railway.sh
│   │   └── rollback.sh
│   ├── database/                 # 數據庫管理
│   │   ├── backup.sh            # 備份腳本
│   │   ├── restore.sh           # 恢復腳本
│   │   └── migrate.sh           # 遷移執行
│   ├── monitoring/               # 監控相關
│   │   ├── health-check.sh
│   │   └── cost-report.sh
│   └── utils/                    # 工具腳本
│       ├── generate-types.sh    # 類型生成
│       └── seed-data.sh         # 測試數據生成

├── infra/                        # 基礎設施即代碼
│   ├── terraform/                # Terraform 配置(備選)
│   ├── docker/                   # Docker 配置
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   └── Dockerfile.multi-stage
│   └── kubernetes/               # K8s 配置(微服務階段)
│       ├── manifests/
│       ├── helm-charts/
│       └── kustomize/

├── tests/                        # 集成測試與E2E測試
│   ├── e2e/                      # Playwright E2E 測試
│   ├── integration/              # 集成測試
│   ├── load/                     # 負載測試(k6)
│   └── fixtures/                 # 測試數據

├── .env.example                  # 環境變數範例
├── .gitignore
├── .prettierrc                   # 代碼格式化配置
├── .eslintrc.js                  # ESLint 配置
├── tsconfig.json                 # TypeScript 根配置
├── turbo.json                    # Turborepo 配置
├── package.json                  # 根 package.json
├── pnpm-workspace.yaml           # pnpm workspace 配置
├── LICENSE
└── README.md                     # 專案說明
