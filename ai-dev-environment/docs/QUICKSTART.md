# AI Development Environment - Quick Start Guide

5 分鐘快速上手本地 AI 開發環境！

## 前置要求

- Docker 和 Docker Compose
- Python 3.8+ (用於 Aider)
- VS Code (推薦)
- GPU (可選，但強烈推薦)

## 第一步：啟動服務 (2 分鐘)

```bash
# 進入 AI 環境目錄
cd ai-dev-environment/docker

# 啟動所有服務
docker-compose up -d

# 等待服務啟動
sleep 10

# 檢查服務狀態
docker-compose ps
```

預期看到所有服務都是 "Up" 狀態。

## 第二步：下載模型 (1 分鐘)

```bash
# 進入 Ollama 容器
docker exec -it ollama bash

# 下載代碼模型（首次約 5-10 分鐘）
ollama pull deepseek-coder-v2:16b

# 退出容器
exit
```

## 第三步：配置 Continue.dev (1 分鐘)

```bash
# 安裝 Continue 擴展
# VS Code → Extensions → 搜索 "Continue" → 安裝

# 複製配置文件
cp ai-dev-environment/continue/config.json ~/.continue/config.json

# 重啟 VS Code
```

## 第四步：測試 AI (1 分鐘)

在 VS Code 中：

1. 按 `Cmd+L` (Mac) 或 `Ctrl+L` (Windows/Linux) 打開 Continue
2. 輸入：`寫一個 Python 函數來計算斐波那契數列`
3. 按 Enter，等待 AI 生成代碼

恭喜！你的本地 AI 開發環境已經運行！🎉

## 常用命令

```bash
# 重啟服務
cd ai-dev-environment/docker && docker-compose restart

# 查看日誌
docker-compose logs -f ollama

# 停止服務
docker-compose down

# 更新模型
docker exec -it ollama ollama pull deepseek-coder-v2:16b
```

## 下一步

- 閱讀完整文檔：`../README.md`
- 了解治理集成：`GOVERNANCE.md`
- 故障排除：`TROUBLESHOOTING.md`