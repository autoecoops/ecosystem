# AutoEcoOps 提交規範與元資料強制要求

為了確保 AutoEcoOps 生態系統的工程品質與可追溯性，本倉庫實施了嚴格的提交元資料驗證。所有提交必須符合以下規範，否則 GitHub Actions 驗證將失敗，且無法合併 Pull Request。

## 1. 提交訊息格式 (Conventional Commits)

提交訊息必須遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>(<scope>): <description>
```

### 允許的類型 (Type)
- `feat`: 新功能
- `fix`: 修補 bug
- `docs`: 文件變更
- `style`: 不影響程式碼含義的變更（空白、格式、缺少分號等）
- `refactor`: 既不修復錯誤也不添加功能的程式碼變更
- `test`: 添加缺失的測試或更正現有的測試
- `chore`: 對構建過程或輔助工具和庫（如文檔生成）的變更

### 範例
- `feat: 增加自動化審計日誌功能`
- `fix(auth): 修復 JWT 令牌過期驗證邏輯`
- `docs: 更新部署指南`

---

## 2. 作者與提交者信箱限制

為了確保提交來源的合規性，所有提交的作者 (Author) 與提交者 (Committer) 信箱必須屬於以下網域：

- `@machops.io` (官方網域)
- `@users.noreply.github.com` (GitHub 隱私信箱)

### 如何設定您的 Git 信箱
在開始貢獻前，請確保您的本地 Git 配置正確：

```bash
# 設定全域信箱
git config --global user.email "your-name@machops.io"
git config --global user.name "Your Name"

# 或僅針對此倉庫設定
git config user.email "your-name@machops.io"
git config user.name "Your Name"
```

---

## 3. 自動化驗證流程

本倉庫已啟用 GitHub Actions 工作流程 `.github/workflows/validate-commit-metadata.yml`：

1. **觸發時機**：每當開啟、同步或重新開啟 Pull Request 時。
2. **檢查內容**：
   - 掃描 PR 中的所有提交 SHA。
   - 驗證每個提交的作者與提交者信箱是否符合網域要求。
   - 驗證提交訊息是否符合正則表達式格式。
3. **強制執行**：此檢查被設定為必過狀態（Required Status Check），未通過驗證的 PR 將無法合併。

---

## 4. AI 代理整合規範

若您使用 AI 代理（如 Aider, OpenHands 等）進行開發，請務必在代理的環境變數或啟動指令中配置正確的信箱：

```bash
git config user.email "evolution@machops.io"
git config user.name "AutoEcoOps Bot"
```

AI 產出的提交訊息也必須嚴格遵守上述正則要求，以確保自動化流程的順暢。
