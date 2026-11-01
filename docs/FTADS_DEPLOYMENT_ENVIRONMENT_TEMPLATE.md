# FTADS Production Environment Variables Template

This document provides the definitive reference for environment variables required across **Render Web Service (Backend)** and **Render Static Site (Frontend)**.

> [!CAUTION]
> Never commit actual passwords, private connection strings, or production secrets to Git. Enter these values directly into the Render Dashboard's Environment settings.

---

## 1. Render Web Service (Backend API)

These variables must be added in **Render Dashboard $\rightarrow$ Web Service $\rightarrow$ Environment**:

| Variable Name | Required? | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Configures Express and libraries for high-performance production mode |
| `PORT` | **Automatic** | `10000` | Port automatically provided by Render; handled dynamically by code |
| `API_PREFIX` | **Yes** | `/api` | Base route prefix for all endpoints |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/dbname?sslmode=require` | Connection URI to your existing PostgreSQL database |
| `DB_SSL` | **Yes** | `true` | Enforces TLS encryption for external database communication |
| `CORS_ORIGIN` | **Yes** | `https://ftads-analyst-dashboard.onrender.com` | Exact URL of your deployed Render frontend |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS`| No | `1000` | Maximum allowed API requests per IP in the window |
| `ALGORITHM_VERSION` | No | `1.0.0` | Detection engine release version |
| `ANOMALY_ALERT_THRESHOLD`| No | `60.0` | Default score threshold to auto-trigger compliance alerts |
| `DEMO_MODE` | **Yes** | `false` | Disables demo features in production |
| `ALLOW_DEMO_RESEED` | **Yes** | `false` | Critical safety flag: prevents resetting the production database |

### Alternative to `DATABASE_URL` (Discrete Credentials)
If your existing database provider does not give a single URI, use these instead of `DATABASE_URL`:
| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `ep-xyz.us-east-2.aws.neon.tech` | Remote database server host |
| `DB_PORT` | `5432` | Remote PostgreSQL port |
| `DB_USER` | `ftads_admin` | Database username |
| `DB_PASSWORD` | `<secure-password>` | Database user password |
| `DB_NAME` | `ftads_production` | Database name |
| `DB_SSL` | `true` | Must be `true` for cloud hosts |

---

## 2. Render Static Site (Frontend SPA)

These variables must be added in **Render Dashboard $\rightarrow$ Static Site $\rightarrow$ Environment**:

| Variable Name | Required? | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `https://ftads-backend.onrender.com/api` | Full public URL to your deployed Render backend API |
| `VITE_APP_TITLE` | No | `FTADS Financial Security Analyst` | Title displayed in the browser window/tab |
| `VITE_APP_VERSION` | No | `1.0.0` | Version string displayed in navigation and layout |

> [!NOTE]
> In Vite applications, all variables prefixed with `VITE_` are baked into the static JavaScript bundles during `npm run build`. Never put database credentials, passwords, or secret backend keys into frontend environment variables!
