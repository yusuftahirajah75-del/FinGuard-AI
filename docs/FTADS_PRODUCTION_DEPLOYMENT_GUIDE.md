# FTADS Production Deployment Guide (Render)

## 1. Overview & Architecture

The **Financial Transaction Anomaly Detection System (FTADS)** uses a decoupled, production-grade cloud deployment architecture on [Render](https://render.com):

```
                   PUBLIC INTERNET / ANALYSTS
                              |
                +-------------+-------------+
                |                           |
                v                           v
     Render Static Site            Render Web Service
     (React 18 + Vite 6)           (Express.js + Node 20+)
     Root Dir: `client`            Root Dir: `server`
     Build: `npm run build`        Build: `npm install`
     Publish Dir: `dist`           Start: `node src/server.js`
                |                           |
                |                           v
                |                  Existing PostgreSQL Database
                |                  (External Cloud Provider)
                |                  Accessible via SSL Connection String
                +---------------------------+
```

---

## 2. Prerequisites

1. **GitHub Repository**: Accessible by your Render account (e.g. `https://github.com/yusuftahirajah75-del/FinGuard-AI`).
2. **Render Account**: Signed up at [dashboard.render.com](https://dashboard.render.com/).
3. **Existing PostgreSQL Database Credentials**:
   - Host (e.g. `ep-xyz.neon.tech`, `aws.connect.psdb.cloud`, `db.xyz.supabase.co`)
   - Port (typically `5432` or `6543`)
   - Database Name
   - Username
   - Password
   - Connection URL (e.g. `postgresql://user:password@host:port/dbname?sslmode=require`)

---

## 3. Step 1: Deploy Backend Web Service on Render

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Choose the repository: `FinGuard-AI`.
5. Configure the Web Service settings:
   - **Name**: `ftads-backend` (or your preferred name)
   - **Region**: Choose the region closest to your existing database host (e.g. Oregon US-West, Frankfurt EU).
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free` (or Starter for high-availability)

6. **Configure Environment Variables** in Render:
   Click **Add Environment Variable** for each:
   | Key | Value / Example | Purpose |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations and disables debug logs |
   | `PORT` | `10000` | Port assigned by Render (automatically bound by `process.env.PORT`) |
   | `API_PREFIX` | `/api` | Base API routing path |
   | `DATABASE_URL` | `postgresql://...` | Connection URI to your existing PostgreSQL database |
   | `DB_SSL` | `true` | Enforces TLS encryption for external database connections |
   | `CORS_ORIGIN` | `https://your-frontend.onrender.com` | Deployed frontend origin (updated once frontend is created) |
   | `ALGORITHM_VERSION` | `1.0.0` | Detection engine version stamp |
   | `ANOMALY_ALERT_THRESHOLD` | `60.0` | Baseline score threshold for triggering compliance alerts |
   | `DEMO_MODE` | `false` | Disables demo destructive endpoints in production |
   | `ALLOW_DEMO_RESEED` | `false` | Safeguard: prevents accidental database reseeding |

7. Click **Create Web Service**.
8. Wait for build to complete. The logs will display:
   ```
   ==> Starting service with 'node src/server.js'
   [INFO] Starting FTADS Server in [production] mode...
   [INFO] Database connected: '<your_db_name>' on port 5432
   [INFO] FTADS Backend API & Detection Engine is live
   [INFO] Listening on: http://localhost:10000
   ```
9. Verify Backend Health in your browser:
   `https://<your-backend-name>.onrender.com/api/health`
   Should return: `{"success": true, "data": {"status": "UP", ...}}`.

---

## 4. Step 2: Deploy Frontend Static Site on Render

1. In Render Dashboard, click **New +** $\rightarrow$ **Static Site**.
2. Select your repository: `FinGuard-AI`.
3. Configure the Static Site settings:
   - **Name**: `ftads-analyst-dashboard`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Configure Environment Variables**:
   | Key | Value | Purpose |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-backend-name>.onrender.com/api` | Directs Axios client to live Render backend |
   | `VITE_APP_TITLE` | `FTADS Financial Security Analyst` | Browser tab title |
   | `VITE_APP_VERSION` | `1.0.0` | Application release tag |

5. **Configure Single Page Application (SPA) Rewrite Rule**:
   Under **Redirects / Rewrites** in the Render static site settings:
   - Click **Add Rule**
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(This ensures refreshing `/investigation/:id`, `/alerts`, etc., does not throw a 404 error)*.

6. Click **Create Static Site**.
7. Once deployed, Render will provide a public URL: `https://<your-frontend-name>.onrender.com`.

---

## 5. Step 3: Complete CORS Handshake

1. Go back to your **Render Backend Web Service** (`ftads-backend`).
2. Go to **Environment** tab.
3. Update `CORS_ORIGIN` with your actual frontend URL:
   ```
   CORS_ORIGIN=https://<your-frontend-name>.onrender.com
   ```
4. Render will automatically redeploy the backend with the new CORS origin.

---

## 6. Step 4: End-to-End Production Verification

1. Open your frontend URL: `https://<your-frontend-name>.onrender.com`.
2. Observe the header beacon:
   - Should show green pulse with **"Engine Live"**.
3. Navigate to **Transactions** $\rightarrow$ submit a test transaction $\rightarrow$ verify it is evaluated in real-time by the statistical anomaly detection engine and stored in your existing database.
