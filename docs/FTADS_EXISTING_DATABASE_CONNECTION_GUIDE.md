# FTADS Existing PostgreSQL Database Connection Guide

## 1. Overview & Non-Negotiable Database Rules

In accordance with FTADS production deployment guidelines:
- **No new Render PostgreSQL database is provisioned.**
- **Existing database data and schemas are strictly preserved.**
- **No destructive migrations or accidental reseeding will be run on production.**

This guide covers how the Node.js/Express backend connects securely to your **already existing PostgreSQL database** when running on Render.

---

## 2. Connection Architecture

```
 Render Web Service (Cloud)
 [Node.js pg.Pool]
       |
       |  Encrypted TLS Connection (SSL: rejectUnauthorized: false)
       v
 External PostgreSQL Provider Host
 (Supabase / Neon / AWS RDS / Aiven / Railway / Self-Hosted VPS)
       |
 [ftads_dev / production database schema]
 - transactions
 - anomaly_results
 - alerts
 - audit_logs
 - detection_settings
```

---

## 3. Supported Connection Mechanisms

The FTADS backend (`server/src/config/database.js`) supports two secure connection methods:

### Method A: Single Connection URI (`DATABASE_URL`) - Recommended
Render provides a single environment variable input where you paste your existing PostgreSQL connection string:

```
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require
```

### Method B: Discrete Parameter Variables
Alternatively, individual connection parameters can be provided:
```
DB_HOST=<remote-hostname.provider.com>
DB_PORT=5432
DB_USER=<database-user>
DB_PASSWORD=<secure-password>
DB_NAME=<database-name>
DB_SSL=true
```

---

## 4. SSL & Security Enforcement

When connecting across public cloud infrastructure to external database hosts:
1. `DB_SSL=true` must be set.
2. In `server/src/config/database.js`, the configuration automatically sets:
   ```javascript
   ssl: config.DB_SSL ? { rejectUnauthorized: false } : false
   ```
   This prevents SSL certificate handshake failures common when connecting to cloud providers that use self-signed or intermediate root certificates.

---

## 5. Identifying Where Your Existing Database Is Hosted

Check your existing PostgreSQL host:
| Provider | Typical Hostname Pattern | External Port | SSL Required? |
| :--- | :--- | :--- | :--- |
| **Neon** | `ep-xyz-123.us-east-2.aws.neon.tech` | `5432` | Yes (`sslmode=require`) |
| **Supabase** | `aws-0-us-west-1.pooler.supabase.com` | `5432` or `6543` | Yes (`sslmode=require`) |
| **Aiven** | `pg-xyz.aivencloud.com` | Custom (e.g. `12345`) | Yes |
| **AWS RDS** | `xyz.cxyz.us-east-1.rds.amazonaws.com` | `5432` | Yes |
| **Local Machine (127.0.0.1)** | `127.0.0.1` / `localhost` | `5432` | Cannot accept inbound cloud traffic without tunneling |

> [!IMPORTANT]
> If your existing database currently runs strictly locally on `127.0.0.1` on your development machine, Render cloud servers in Oregon cannot reach your laptop's loopback address directly. To make your existing database accessible to Render:
> 1. Export your existing database schema and records (`pg_dump`) to a free hosted cloud PostgreSQL instance (such as Neon, Supabase, or Aiven); OR
> 2. Expose your local port via a secure tunnel (such as Cloudflare Tunnel or ngrok) with a static URL.

---

## 6. Pre-Deployment Verification

Before triggering production deployment on Render, test your external database credentials locally:

```powershell
# Set temporary connection string to verify
$env:DATABASE_URL="postgresql://user:pass@remote-host:5432/dbname"
$env:DB_SSL="true"

# Run non-destructive health test
node -e "import('./server/src/config/database.js').then(async m => { const res = await m.testConnection(); console.log(res); process.exit(0); })"
```

Expected output:
```json
{ "connected": true, "database": "your_db_name", "serverTime": "2026-11-01T..." }
```
