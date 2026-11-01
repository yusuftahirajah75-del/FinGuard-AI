# FTADS Production Testing & Verification Checklist

Use this checklist to perform rigorous end-to-end verification once both the backend and frontend are deployed on Render.

---

## 1. Pre-Deployment Verification (Local & CI)

- [ ] All 54 backend tests pass (`npm run server:test`).
- [ ] All 21 frontend tests pass (`npm run client:test`).
- [ ] Total 75 automated tests pass with 0 failures (`npm test`).
- [ ] Production frontend builds cleanly with zero errors (`npm run build`).
- [ ] No uncommitted changes on active deployment branch (`git status`).
- [ ] All changes pushed to remote repository (`git push origin main`).

---

## 2. Backend Web Service Verification (Render)

- [ ] **Build Step**: Render successfully runs `npm install` with code 0.
- [ ] **Startup Step**: `node src/server.js` binds to `process.env.PORT` assigned by Render.
- [ ] **Database Connection**: Startup logs confirm: `Database connected: '<dbname>' on port 5432`.
- [ ] **Public Health Check**:
  ```powershell
  curl https://<your-backend>.onrender.com/api/health
  ```
  Returns:
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "database": { "connected": true }
    }
  }
  ```
- [ ] **Database Read Operation**:
  ```powershell
  curl https://<your-backend>.onrender.com/api/dashboard/summary
  ```
  Returns real aggregates from your existing database.

---

## 3. Frontend Static Site Verification (Render)

- [ ] **Static Site Deployment**: Render completes build and deploys to `https://<your-frontend>.onrender.com`.
- [ ] **SPA Deep-Link Reload**:
  - Navigate directly to `https://<your-frontend>.onrender.com/transactions`.
  - Press `Ctrl + Shift + R` (hard refresh).
  - Confirm page renders properly without a Render 404 (verifying the `/* -> /index.html` rewrite rule).
- [ ] **Connectivity Beacon**: Header displays green pulsating beacon **"Engine Live"**.
- [ ] **Zero Disconnection Banners**: Red warning banner does not appear.

---

## 4. End-to-End Workflow Verification

Perform this non-destructive financial transaction test:

1. **Ingest Test Transaction**:
   - Navigate to **Transactions** tab.
   - Click **+ Ingest New Transaction**.
   - Input sample test data:
     - Customer Reference: `CUST-PROD-TEST`
     - Source Account: `ACC-PROD-SRC`
     - Beneficiary: `BEN-PROD-TEST`
     - Amount: `150.00`
     - Channel: `ONLINE`
   - Click **Submit Transaction**.
   - Confirm success notification: *"Transaction successfully created"*.

2. **Forensic Telemetry Verification**:
   - Find the newly created transaction in the Transaction Explorer.
   - Click the transaction row to navigate to `/investigation/:id`.
   - Confirm all fields match the persisted record.

3. **On-Demand Anomaly Detection**:
   - On the investigation page, click **Analyze Transaction**.
   - Confirm the engine computes:
     - Amount MAD & modified Z-score
     - Velocity burst window counts
     - Circadian probability score
     - Duplicate transaction checks
     - Counterparty novelty factor
   - Confirm the Risk Gauge animates to display the score and risk level.

4. **Alert Lifecycle & Audit Trail**:
   - Navigate to **Alerts** page.
   - Click an open alert case.
   - Assign an analyst name (`Analyst-Verifier`).
   - Add an investigation note (`"Verified on production environment"`).
   - Click **Resolve Alert** or **Mark False Positive**.
   - Verify the immutable **Audit Trail** logs the action with timestamp and actor name.

5. **Academic Confusion Matrix**:
   - Navigate to **Detection Analytics** page.
   - Confirm the Confusion Matrix grid displays $TP, FP, TN, FN$.
   - Move the Anomaly Threshold Slider (e.g. from 60 to 30) and confirm the recalculation of Accuracy, Precision, Recall, and F1-Score.

---

## 5. Security & Protection Checklist

- [ ] **No Exposed Secrets**: No database passwords or private API tokens in client bundles.
- [ ] **CORS Protection**: Accessing the API from an unapproved domain yields `CORS policy violation`.
- [ ] **Rate Limiting**: Sending $\ge 1000$ rapid requests returns `429 Too Many Requests`.
- [ ] **CSV Injection Protection**: Exported CSV files prepend `'` to formula triggers (`=`, `+`, `-`, `@`).
- [ ] **Production Safeguard**: Calling `POST /api/detection/reset-demo` in production returns `403 Forbidden`.
