# FTADS Frontend-Backend Integration Guide

## 1. Architectural Relationship

The **FTADS Analyst Dashboard** is completely decoupled from the **Node.js/Express Backend API**:
- **Zero Frontend Anomaly Scoring**: All Median Absolute Deviation (MAD), modified Z-scores, rolling velocity burst evaluations, circadian models, duplicate transfers, and weighted risk scores are strictly computed by backend statistical services.
- **Single Source of Truth**: The frontend reads all KPI summaries, transaction lists, case audits, and detection explanations directly from the backend via parameterized RESTful endpoints.

---

## 2. API Communication Contract

All backend responses adhere to the standard FTADS response envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

The frontend Axios client (`client/src/services/api/apiClient.js`) transparently unwraps `response.data` using an interceptor, simplifying service calls:

```javascript
// apiClient.js
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(normalizeError(error))
);
```

---

## 3. Centralized API Services Mapping

| Frontend Service | Backend Route | HTTP Method | Functionality |
| :--- | :--- | :--- | :--- |
| `healthService.checkHealth()` | `/api/health` | `GET` | Health check, uptime, PostgreSQL connectivity status |
| `dashboardService.getDashboardSummary()` | `/api/dashboard/summary` | `GET` | Aggregated KPIs, risk distribution, channel volumes |
| `transactionService.getTransactions(params)` | `/api/transactions` | `GET` | Paginated, filtered, and sorted transactions |
| `transactionService.getTransactionById(id)` | `/api/transactions/:id` | `GET` | Transaction forensic telemetry & evaluation result |
| `transactionService.createTransaction(data)` | `/api/transactions` | `POST` | Ingest new transaction with Zod validation |
| `detectionService.analyzeTransaction(id)` | `/api/detection/analyze/:id` | `POST` | Execute on-demand 5-signal statistical detection |
| `detectionService.analyzeBatch(payload)` | `/api/detection/analyze-batch` | `POST` | Batch evaluation across unanalyzed transactions |
| `detectionService.getMethodology()` | `/api/detection/methodology` | `GET` | Full statistical mathematical formulas specification |
| `detectionService.getSettings()` | `/api/detection/settings` | `GET` | Active detector weights & alert thresholds |
| `detectionService.updateSettings(payload)` | `/api/detection/settings` | `PATCH` | Calibrate weights & thresholds in PostgreSQL |
| `alertService.getAlerts(params)` | `/api/alerts` | `GET` | Paginated compliance alerts filtered by status/severity |
| `alertService.getAlertById(id)` | `/api/alerts/:id` | `GET` | Alert case details and immutable audit log timeline |
| `alertService.updateAlert(id, payload)` | `/api/alerts/:id` | `PATCH` | Update status, assigned analyst, notes, log audit |
| `analyticsService.getConfusionMatrix(t)` | `/api/reports/confusion-matrix`| `GET` | TP, FP, TN, FN matrix & academic evaluation metrics |
| `analyticsService.downloadCsvExport(type)` | `/api/reports/export` | `GET` | Sanitized CSV download preventing formula injection |

---

## 4. Production Environment Configuration

In production, the frontend dynamically points to the deployed backend URL via the build-time environment variable:

```env
# client/.env or Render Static Site Environment Setting
VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api
```

In `apiClient.js`:
```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

---

## 5. Production CORS Protocol

The backend restricts access strictly to approved origins configured in `CORS_ORIGIN`:

```javascript
// server/src/app.js
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};
```

On Render:
- Backend `CORS_ORIGIN`: `https://ftads-analyst-dashboard.onrender.com`
