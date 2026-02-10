# AI Development Environment - Zero Cost & Fully Self-Hosted

一個完全私有、可審計、零成本的 AI 開發環境，完美整合 HashBoundary、ReplayEngine、ClosedLoop、Evidence Layer、OPA Policy 和 Seal 治理框架。

## 🎯 核心特性

- ✅ **完全私有**: 所有 AI 操作在本地執行，數據永不離開機器
- ✅ **零成本**: 使用開源模型和自托管服務
- ✅ **治理友好**: 所有 AI 操作自動密封、可審計、可重播
- ✅ **強大功能**: 接近 Cursor 體驗的代碼理解和操作能力
- ✅ **完整集成**: Continue.dev + Ollama + Aider 完美組合

## 📦 組件介紹

### 1. Continue.dev (主 IDE 助手)
- 最接近 Cursor 的開源方案
- 支持 VS Code / JetBrains / Neovim
- Agent mode、inline edit、多文件重構
- 聊天、代碼搜索、@codebase

### 2. Ollama (本地模型服務器)
- 運行本地開源模型
- 推薦模型：
  - `deepseek-coder-v2:16b` - 最強代碼生成
  - `qwen2.5-coder:32b` - 平衡性能
  - `llama3.1:70b` - 強大推理

### 3. Aider (CLI 強力 agent)
- 命令行 AI 助手
- Git-aware 重構工具
- 自動 commit、undo
- 適合 CI/CD 和批量任務

## 🚀 快速開始 (10 分鐘)

### Step 1: 啟動 Docker 服務

```bash
cd ai-dev-environment/docker
docker-compose up -d
```

這會啟動：
- Ollama (模型服務器)
- OPA (治理引擎)
- Redis (緩存)
- MinIO (證據存儲)

### Step 2: 下載模型

```bash
# 進入 Ollama 容器
docker exec -it ollama bash

# 下載推薦模型
ollama pull deepseek-coder-v2:16b
ollama pull llama3.1:70b

# 測試模型
ollama run deepseek-coder-v2:16b "Hello, how are you?"
```

### Step 3: 安裝 Continue.dev

1. VS Code → Extensions → 搜索 **Continue**
2. 安裝後點擊側邊欄 Continue 圖標
3. 複製配置：

```bash
cp ai-dev-environment/continue/config.json ~/.continue/config.json
```

### Step 4: (選配) 安裝 Aider

```bash
pip install aider-chat

# 進入專案目錄
cd /workspace/contracts-l1-complete-final

# 使用 Aider
aider --model ollama/deepseek-coder-v2:16b
```

## 🔐 治理集成

所有 AI 操作自動整合治理框架：

### HashBoundary 密封
每次 AI 修改自動生成 hash 和 plan.json：
```bash
evidence/plan-{hash}.json
evidence/ai-changes.log
```

### OPA Policy 檢查
修改前自動執行合規檢查：
```bash
# Continue 自動執行
bash scripts/governance-integration/opa-policy-check.sh
```

### Evidence Layer
所有對話和變更記錄到證據層：
- MinIO 存儲大文件
- Redis 緩存快速查詢
- Git commit 永久記錄

### ReplayEngine
完整重播 AI 操作歷史：
```bash
# 從 plan.json 重播
node governance/scripts/replay.js evidence/plan-{hash}.json
```

## 📁 目錄結構

```
ai-dev-environment/
├── continue/                    # Continue.dev 配置
│   └── config.json             # 主配置文件
├── ollama/                      # Ollama 配置
│   └── README.md               # 模型推薦和使用指南
├── aider/                       # Aider 配置
│   └── .aider.conf.yml         # CLI 配置
├── docker/                      # Docker 服務
│   └── docker-compose.yml      # 完整服務堆疊
├── governance-integration/      # 治理集成腳本
│   ├── seal-ai-change.sh       # 密封腳本
│   ├── opa-policy-check.sh     # OPA 檢查腳本
│   └── generate-plan.sh        # 計劃生成腳本
└── docs/                        # 文檔
    ├── QUICKSTART.md           # 快速開始
    ├── GOVERNANCE.md           # 治理指南
    └── TROUBLESHOOTING.md      # 故障排除
```

## 🎮 使用示例

### Continue.dev 示例

```javascript
// 在 VS Code 中按 Cmd+L 打開 Continue
// 使用 @ 符號引用文件：
@packages/database/prisma/schema.prisma

// 使用 / 命令：
/refactor 這段代碼
/test 為這個函數寫測試
/explain 解釋這個邏輯
```

### Aider 示例

```bash
# 啟動 Aider
aider --model ollama/deepseek-coder-v2:16b

# 對話式編程
User: 重構 User model 中的 password 字段，使用 bcrypt

Aider: 自動修改代碼，運行測試，並提交變更

# 批量操作
aider --message "為所有 API 添加錯誤處理" src/api/*.ts
```

## 🔧 高級配置

### 自定義模型

在 `continue/config.json` 中添加：

```json
{
  "models": [
    {
      "title": "Custom Model",
      "provider": "ollama",
      "model": "your-model-name",
      "apiBase": "http://localhost:11434"
    }
  ]
}
```

### 自定義治理腳本

修改 `scripts/governance-integration/` 中的腳本以符合你的需求。

### 集成第三方服務

Continue 支持多種提供者：
- OpenAI API
- Anthropic API
- vLLM
- Tabby
- 自定義 HTTP 端點

## 📊 監控與日誌

### 查看證據日誌

```bash
cat evidence/ai-changes.log
```

### 查看 Docker 日誌

```bash
# Ollama 日誌
docker logs ollama

# OPA 日誌
docker logs opa

# 所有服務
docker-compose logs
```

### 監控資源使用

```bash
# GPU 使用
nvidia-smi

# 記憶體使用
docker stats
```

## 🚨 故障排除

### Ollama 連接失敗

```bash
# 檢查服務狀態
docker ps | grep ollama

# 重啟服務
docker restart ollama

# 檢查日誌
docker logs ollama
```

### Continue 無法連接模型

1. 確認 Ollama 運行在 `http://localhost:11434`
2. 檢查 `config.json` 中的 `apiBase` 設置
3. 測試 API：

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-coder-v2:16b",
  "prompt": "test"
}'
```

### 治理腳本失敗

1. 檢查腳本權限：`chmod +x scripts/governance-integration/*.sh`
2. 檢查 Git 狀態：確保在 Git repo 中
3. 查看詳細錯誤日誌

## 📚 更多資源

- [Continue.dev 文檔](https://docs.continue.dev)
- [Ollama 文檔](https://ollama.com/docs)
- [Aider 文檔](https://aider.chat/docs)
- [OPA 文檔](https://www.openpolicyagent.org/docs)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 許可證

MIT License - 與主專案一致

---

**GL Unified Charter Activated** ✅