# Astro Observatory

Swiss Ephemeris 驅動的繁中專業占星工作台。

## 架構

- `frontend/` — Next.js 16 + Tailwind v4
- `backend/` — FastAPI + Swiss Ephemeris + DeepSeek AI

## 本地開發

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
py -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

開啟 http://localhost:3000

## 環境變數

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

### Backend (`backend/.env`)

```
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
FRONTEND_URL=http://localhost:3000
```

## Railway 部署

建立 Railway Project，新增兩個服務：

| 服務 | Root Directory | Start Command |
|------|----------------|---------------|
| Frontend | `frontend/` | `npm start` |
| Backend | `backend/` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Frontend Variables:**
- `NEXT_PUBLIC_API_URL` = backend 公開 URL

**Backend Variables:**
- `FRONTEND_URL` = frontend 公開 URL
- `DEEPSEEK_API_KEY` = DeepSeek API Key
- `DEEPSEEK_BASE_URL` = https://api.deepseek.com
- `DEEPSEEK_MODEL` = deepseek-chat

## API 端點

- `POST /natal` — 本命盤計算
- `POST /transit` — 行運計算
- `GET /settings/deepseek` — DeepSeek 設定狀態
- `PUT /settings/deepseek` — 儲存 API Key（僅本地）
- `POST /settings/deepseek/test` — 測試連線
- `POST /interpret/natal` — AI 本命解讀
- `POST /interpret/transit` — AI 行運解讀
