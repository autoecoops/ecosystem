#!/bin/bash

# 遷移腳本：從 packages/config 到 platforms/platform-1
# 作者：SuperNinja
# 日期：2025-01-14

set -e  # 遇到錯誤立即退出

# 定義變量
SOURCE="packages/config"
TARGET="platforms/platform-1"
LOG_FILE="migration.log"

# 日誌函數
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 開始遷移
log "=== 開始遷移 ==="
log "來源：$SOURCE"
log "目標：$TARGET"

# 步驟 1：驗證來源
log "步驟 1：驗證來源"
if [ ! -d "$SOURCE" ]; then
    log "錯誤：來源目錄不存在"
    exit 1
fi
log "✓ 來源目錄存在"

# 步驟 2：驗證目標
log "步驟 2：驗證目標"
if [ -d "$TARGET" ]; then
    log "警告：目標目錄已存在"
    log "正在檢查目標目錄內容..."
    FILES_IN_TARGET=$(find "$TARGET" -type f 2>/dev/null | wc -l)
    if [ "$FILES_IN_TARGET" -gt 0 ]; then
        log "錯誤：目標目錄不為空"
        exit 1
    fi
    log "✓ 目標目錄為空，可以繼續"
else
    log "✓ 目標目錄不存在，將創建"
fi

# 步驟 3：創建目標目錄
log "步驟 3：創建目標目錄"
mkdir -p "$TARGET"
log "✓ 目標目錄已創建"

# 步驟 4：複製內容
log "步驟 4：複製內容"
log "步驟 4：複製內容"
shopt -s dotglob
cp -r "$SOURCE/"* "$TARGET/" 2>&1 | tee -a "$LOG_FILE"
shopt -u dotglob
cp_exit=${PIPESTATUS[0]}
shopt -u dotglob
if [ "$cp_exit" -ne 0 ]; then
    log "錯誤：複製內容失敗 (cp exit code: $cp_exit)"
    exit "$cp_exit"
fi
log "✓ 內容已複製"

# 步驟 5：驗證複製
log "步驟 5：驗證複製"
FILES_IN_SOURCE=$(find "$SOURCE" -type f 2>/dev/null | wc -l)
FILES_IN_TARGET=$(find "$TARGET" -type f 2>/dev/null | wc -l)

log "來源文件數：$FILES_IN_SOURCE"
log "目標文件數：$FILES_IN_TARGET"

if [ "$FILES_IN_SOURCE" -ne "$FILES_IN_TARGET" ]; then
    log "警告：文件數不匹配"
    log "請手動檢查"
fi

# 步驟 6：驗證關鍵文件
log "步驟 6：驗證關鍵文件"
if [ ! -f "$TARGET/package.json" ]; then
    log "錯誤：package.json 不存在"
    exit 1
fi
log "✓ package.json 存在"

if [ ! -f "$TARGET/turbo.json" ]; then
    log "錯誤：turbo.json 不存在"
    exit 1
fi
log "✓ turbo.json 存在"

if [ ! -f "$TARGET/pnpm-workspace.yaml" ]; then
    log "錯誤：pnpm-workspace.yaml 不存在"
    exit 1
fi
log "✓ pnpm-workspace.yaml 存在"

# 步驟 7：更新 package.json
log "步驟 7：更新 package.json"
if command -v sed &> /dev/null; then
    # 使用便攜方式更新 package.json 中的 name 字段
    if sed 's/"name":[[:space:]]*"[^"]*"/"name": "platform-1"/' "$TARGET/package.json" > "$TARGET/package.json.tmp"; then
        mv "$TARGET/package.json.tmp" "$TARGET/package.json"
        # 驗證替換是否成功
        if grep -q '"name":[[:space:]]*"platform-1"' "$TARGET/package.json"; then
            log "✓ package.json 已更新"
        else
            log "警告：package.json name 字段可能未成功更新，請手動檢查"
        fi
    else
        log "錯誤：更新 package.json 失敗，請手動檢查並更新 name 字段"
        rm -f "$TARGET/package.json.tmp"
        exit 1
    fi
else
    log "警告：sed 命令不可用，跳過更新"
    log "請手動更新 package.json 中的包名稱"
fi

# 步驟 8：驗證目錄結構
log "步驟 8：驗證目錄結構"
if [ ! -d "$TARGET/apps" ]; then
    log "警告：apps 目錄不存在"
fi

if [ ! -d "$TARGET/packages" ]; then
    log "警告：packages 目錄不存在"
fi

if [ ! -d "$TARGET/scripts" ]; then
    log "警告：scripts 目錄不存在"
fi

log "✓ 目錄結構驗證完成"

# 完成遷移
log "=== 遷移完成 ==="
log "請檢查以下項目："
log "1. 驗證所有文件已正確複製"
log "2. 更新根級配置文件"
log "3. 更新所有引用路徑"
log "4. 執行 pnpm install"
log "5. 執行 pnpm build"
log "6. 執行 pnpm dev"
log ""
log "遷移日誌已保存到：$LOG_FILE"