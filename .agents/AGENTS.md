# Manganle Project Developer Rules

這些是本專案與 AI 助手 Antigravity 協同開發時需要遵守的規則：

## 對話相關
* 對話使用繁體中文，思考也使用繁體中文。
* shell 指令不使用 `&&`。
* 開發環境為 Windows，不使用 Linux 特有指令。

## Commit 與 Git 規範
* Commit Message 一律使用英文（如 `feat: ...` 或 `refactor: ...`）。
* 在執行 Git Commit 之前，務必先執行 `git status` 與 `git diff HEAD` 檢查改動。

## 開發流程
* 每次程式碼修改後，AI 助手需在本機執行 `npm run build` 進行打包驗證。
* 確認打包編譯無誤後，AI 助手即可自動進行 Git Commit 與 Push 推送，以便用戶能在手機上（Vercel）直接進行線上測試與驗證。
