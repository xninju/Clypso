# Clypso 🎬

Download YouTube videos, Shorts, Playlists and Instagram Reels, Posts, Carousels.

**Stack:** Next.js 14 (Vercel) + FastAPI/yt-dlp (Render) + Neon PostgreSQL

---

## Project Structure

```
clypso/
├── frontend/        → Deploy to Vercel
├── backend/         → Deploy to Render
└── render.yaml      → Render config
```

---

## Step 1 — Set up Neon DB

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up (free)
2. Create a new project → name it `clypso`
3. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Save it — you'll need it for Vercel env vars

---

## Step 2 — Push code to GitHub

1. Create a new GitHub repo (e.g. `clypso`)
2. Push this entire folder:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/clypso.git
git push -u origin main
```

---

## Step 3 — Deploy Backend to Render

1. Go to [https://render.com](https://render.com) and sign up (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Click **Create Web Service**
6. Wait for deploy (~2-3 min). Copy your Render URL:
   `https://clypso-api.onrender.com`

---

## Step 4 — Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up
2. Click **Add New → Project** → Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-app.onrender.com` |
| `DATABASE_URL` | Your Neon connection string |

5. Click **Deploy**

### Run Prisma migration after first deploy

In your local frontend folder:
```bash
cd frontend
npm install
npx prisma db push
```
This creates the tables in your Neon DB.

---

## Step 5 — Set up UptimeRobot (keep Render alive 24/7)

Render free tier sleeps after 15 min of inactivity. Fix this:

1. Go to [https://uptimerobot.com](https://uptimerobot.com) → free account
2. Click **Add New Monitor**
3. Settings:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Clypso API
   - **URL:** `https://your-app.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
4. Save — done! Your backend stays warm 24/7.

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API runs at http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in .env.local with:
#   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
#   DATABASE_URL=your-neon-connection-string
npx prisma db push
npm run dev
# UI runs at http://localhost:3000
```

---

## Features

| Feature | Supported |
|---------|-----------|
| YouTube videos (all qualities) | ✅ |
| YouTube Shorts | ✅ |
| YouTube Playlists (up to 50 videos) | ✅ |
| Instagram single posts | ✅ |
| Instagram Reels | ✅ |
| Instagram Carousels (multi-photo/video) | ✅ |
| Visit counter | ✅ |
| Download counter (YT + IG + Total) | ✅ |
| No login required | ✅ |
| No watermarks | ✅ |

---

## Notes

- Only **public** Instagram posts can be downloaded
- For personal use only — respect content creators' rights
- yt-dlp is updated regularly; bump the version in `requirements.txt` if downloads break
