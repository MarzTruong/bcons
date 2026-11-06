# Cài MCP cho Claude Code (mỗi máy cài riêng)

MCP = "phích cắm" cho Claude dùng thêm công cụ ngoài, ví dụ tra tài liệu Remotion mới nhất hay mở trình duyệt xem landing page.
Repo **không** commit `.mcp.json`: Windows cần `cmd /c npx ...`, cloud/macOS/Linux dùng `npx ...`, một file chung không chạy được ở cả hai. Mỗi máy cài một lần ở phạm vi người dùng (`--scope user`), dùng cho mọi phiên.

Chỉ cài 2 cái:
- `context7`: tra tài liệu chuẩn của Remotion 4.x, Node 22.
- `playwright`: mở trình duyệt kiểm tra landing page (`engine/landing/`) và khung hình.
Không cài `sequential-thinking` (model đã tự suy luận từng bước, cài thêm chỉ tốn ngữ cảnh).

## Laptop / máy bàn Windows (PowerShell)
```powershell
claude mcp add --scope user context7 -- cmd /c npx -y @upstash/context7-mcp@latest
claude mcp add --scope user playwright -- cmd /c npx -y @playwright/mcp@latest
claude mcp list
```

## macOS / Linux
```bash
claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest
```

## Phiên cloud (claude.ai/code)
Máy cloud tạo mới mỗi phiên nên lệnh trên không giữ lại. Cloud đã có sẵn trình duyệt Playwright (em dùng trực tiếp). Muốn có `context7` ở cloud: mạng của môi trường phải cho phép `context7.com`; báo em để thêm vào cài đặt môi trường.

## Bật hook chặn commit (mỗi máy, một lần)
```powershell
git config core.hooksPath .githooks
```
Sau lệnh này, mọi lần commit (kể cả anh tự commit) đều bị chặn nếu có `.env`, `data/`, `anh/`, `*.xlsx`, `*.mp4`, `out/`, `node_modules/`.
