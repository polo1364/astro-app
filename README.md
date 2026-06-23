# Astro Observatory

Swiss Ephemeris 驅動的繁中專業占星工作台。

**作者：** 蝦蝦 · **版本：** 0.2.0

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

> **若 Build Log 出現 `backend/`、`frontend/`、`Roulette.png` 並 Failed**  
> 代表 Root Directory 仍是 repo 根目錄。請依下方步驟改為 `backend` 或 `frontend`。

建立 Railway Project，新增 **兩個 Service**（同一個 GitHub repo）：

| 服務 | Root Directory | Config 檔路徑（Settings 另填） |
|------|----------------|--------------------------------|
| Backend | `backend` | `/backend/railway.toml` |
| Frontend | `frontend` | `/frontend/railway.toml` |

### Railway 設定步驟（每個 Service 各做一次）

1. 點進 Service → **Settings**
2. **Root Directory** 填 `backend` 或 `frontend`（不要留空）
3. **Config file path** 填 `/backend/railway.toml` 或 `/frontend/railway.toml`
4. 儲存後按 **Redeploy**

| 服務 | Root Directory | Start Command |
|------|----------------|---------------|
| Frontend | `frontend` | `npm run start` |
| Backend | `backend` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Frontend Variables:**
- `NEXT_PUBLIC_API_URL` = backend 公開 URL

**Backend Variables:**
- `FRONTEND_URL` = frontend 公開 URL
- `PUBLIC_API_URL` = backend 公開 URL（Facebook 分享 OG 圖用，須 HTTPS）
- `DEEPSEEK_API_KEY` = DeepSeek API Key
- `DEEPSEEK_BASE_URL` = https://api.deepseek.com
- `DEEPSEEK_MODEL` = deepseek-chat
- `DATABASE_URL` = **用 Railway「Add Reference」連 Postgres**（見下方）
- `PORT` = Railway 自動注入，勿手動覆寫

### 連接 Postgres（瀏覽人數／每日運勢持久化）

1. Railway Project 內先新增 **PostgreSQL** 服務
2. 點進 **Backend** → **Variables**
3. 按 **Add Reference**（或 **New Variable** → **Reference**）
4. 選 Postgres 服務 → 選 `DATABASE_URL`
5. 儲存後 **Redeploy Backend**
6. 驗證：開啟 `https://你的後端/health`，應看到 `"database":"postgresql"`

勿手動輸入 `${{Postgres.DATABASE_URL}}` 文字；若點眼睛顯示 **empty**，代表引用未成功，Backend 會退回 SQLite，瀏覽人數每次部署歸零。

### 常見部署失敗

1. **只建立一個 Service**：本專案是 monorepo，必須分別建立 `frontend` 與 `backend` 兩個 Service，並在 Settings → Root Directory 設為 `frontend` 或 `backend`（不可留空用 repo 根目錄）。
2. **GitHub Deployments 顯示 Failed**：到 [Railway Dashboard](https://railway.com) 點該次部署 → View Logs，查看 build / start 錯誤訊息。
3. **Backend build 失敗**：多為 `pyswisseph` 編譯問題；已於 `backend/nixpacks.toml` 加入 `gcc`。重新 Deploy 即可。
4. **Frontend 啟動後立刻掛掉**：確認 `npm start` 使用 `$PORT`（已設定於 `package.json`）。

## API 端點

- `POST /natal` — 本命盤計算
- `POST /transit` — 行運計算
- `GET /settings/deepseek` — DeepSeek 設定狀態
- `PUT /settings/deepseek` — 儲存 API Key（僅本地）
- `POST /settings/deepseek/test` — 測試連線
- `POST /interpret/natal` — AI 本命解讀
- `POST /interpret/transit` — AI 行運解讀
