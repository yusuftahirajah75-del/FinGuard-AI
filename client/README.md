# FTADS — Financial Security Analyst Frontend

[![React Version](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-6.0.7-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.17-38B2AC.svg)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/tests-21%2F21%20passing-success.svg)]()

> **The enterprise, explainable financial security analyst operations dashboard and case triage platform for FTADS (Financial Transaction Anomaly Detection System).**

---

## 1. Project Overview

The **FTADS Frontend Dashboard** is a responsive, accessible, and high-performance React application designed for financial compliance teams, fraud analysts, and academic researchers. It interfaces directly with the FTADS backend REST API to provide real-time transaction monitoring, interactive statistical anomaly investigations, alert triage workflows, audit trail reviews, and academic confusion matrix evaluation.

### Key Capabilities
- **Live Security Overview**: KPI cards, channel volume distribution, risk tier breakdowns, and active triage queues.
- **Transaction Explorer**: Multi-facet filtering (channel, risk tier, amount range, status, text search), sorting, pagination, and new transaction ingestion.
- **Deep Transaction Investigation**: Visual anomaly score gauge, natural language justifications, and explainable 5-signal breakdown (Amount MAD, Velocity bursts, Circadian hours, Replay transfers, New counterparties).
- **Compliance Case Management**: Status workflows (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `FALSE_POSITIVE`), analyst assignments, notes editor, and immutable audit logs.
- **Academic Performance Benchmarking**: Confusion matrix (TP, FP, TN, FN) vs synthetic ground-truth data with interactive threshold tuning.
- **Runtime Methodology & Settings**: Technical documentation of statistical formulas and dynamic detector weight tuning.

---

## 2. Technology Stack

- **Framework**: React 18 with Vite 6
- **Language**: JavaScript ES Modules
- **Styling**: Tailwind CSS 3.4 & PostCSS
- **Routing**: React Router 6
- **HTTP Client**: Axios with centralized request/response interceptors & error normalization
- **Data Visualizations**: Recharts 2 (Bar charts, Donut/Pie charts, Responsive containers)
- **Icons**: Lucide React
- **Form Management**: React Hook Form with Zod runtime validation resolvers
- **Testing**: Vitest & React Testing Library with JSDOM

---

## 3. Folder Structure

```
client/
├── public/
│   └── shield.svg                      # Brand shield favicon
├── src/
│   ├── assets/                         # Static visual assets
│   ├── components/
│   │   ├── common/
│   │   │   ├── ConfirmationDialog.jsx  # Double-confirmation modal
│   │   │   ├── EmptyState.jsx          # Accessible zero-data placeholder
│   │   │   ├── ErrorBanner.jsx         # Connection & API failure banner
│   │   │   ├── KpiCard.jsx             # Metric card with loading skeleton
│   │   │   ├── LoadingSkeleton.jsx     # Pulse loading skeletons
│   │   │   ├── Modal.jsx               # Accessible dialog with ESC dismissal
│   │   │   ├── RiskBadge.jsx           # Risk tier badge (LOW, MED, HIGH, CRIT)
│   │   │   └── StatusBadge.jsx         # Alert state badge
│   │   └── layout/
│   │       ├── Header.jsx              # App header with live health beacon
│   │       ├── MainLayout.jsx          # Shell with health poller & batch modal
│   │       └── Sidebar.jsx             # Slate navy navigation sidebar
│   ├── context/
│   │   └── ToastContext.jsx            # Global toast notifications
│   ├── pages/
│   │   ├── Alerts.jsx                  # Compliance case triage & audit logs
│   │   ├── Analytics.jsx               # Confusion matrix & academic metrics
│   │   ├── Dashboard.jsx               # Overview KPI cards & charts
│   │   ├── Investigation.jsx           # Anomaly score gauge & signal breakdown
│   │   ├── Methodology.jsx             # Statistical formulations & settings
│   │   └── Transactions.jsx            # Filterable explorer & transaction creator
│   ├── services/
│   │   └── api/
│   │       ├── alertService.js         # Alert retrieval & triage patch
│   │       ├── apiClient.js            # Axios client with interceptors
│   │       ├── analyticsService.js     # Confusion matrix & CSV exports
│   │       ├── dashboardService.js     # Summary KPIs & chart data
│   │       ├── detectionService.js     # Analyze single & batch transactions
│   │       ├── healthService.js        # Health check probe
│   │       └── transactionService.js   # Transactions CRUD & pagination
│   ├── styles/
│   │   └── index.css                   # Tailwind directives & scrollbar styles
│   ├── test/
│   │   ├── components.test.jsx         # Unit tests for common badges & cards
│   │   ├── dashboard.test.jsx          # Integration test for dashboard page
│   │   ├── formatters.test.js          # Unit tests for currency & date helpers
│   │   ├── investigation.test.jsx      # Test for investigation & analyze action
│   │   ├── navigation.test.jsx         # Test for sidebar & live health beacon
│   │   └── setup.js                    # Vitest environment & ResizeObserver mock
│   ├── utils/
│   │   ├── cn.js                       # Tailwind class merger
│   │   └── formatters.js               # Currency, relative time, risk helpers
│   ├── App.jsx                         # Application router assembly
│   └── main.jsx                        # Vite React DOM entry
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## 4. Installation & Environment Configuration

### Prerequisites
- Node.js LTS (v20+ or v24+)
- Running FTADS Backend (default: `http://localhost:5000/api`)

### Installation
```powershell
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### Environment Variables (`.env`)
```env
# Backend REST API Endpoint
VITE_API_BASE_URL=http://localhost:5000/api

# Application Identity
VITE_APP_TITLE=FTADS Financial Security Analyst
VITE_APP_VERSION=1.0.0
```

---

## 5. Running the Application

### Development Server
```powershell
npm run dev
```
Starts the Vite development server with Hot Module Replacement (HMR) at:
**`http://localhost:5173`**

### Production Build
```powershell
npm run build
```
Compiles and tree-shakes optimized assets into the `dist/` directory.

### Preview Production Build
```powershell
npm run preview
```
Serves the generated `dist/` build locally for verification.

---

## 6. Automated Testing

The frontend is tested using Vitest and React Testing Library:

```powershell
# Run all frontend tests once
npm test

# Run tests in interactive watch mode
npm run test:watch
```

### Test Coverage Highlights
- **Formatters**: Currency formatting, UTC timestamps, relative times, and risk color mappings.
- **Components**: Badges (`RiskBadge`, `StatusBadge`), KPI cards, error banners, and empty states.
- **Layout & Navigation**: Sidebar links, live health beacon, and mobile responsiveness.
- **Dashboard**: Live API data ingestion, metric calculations, and error recovery.
- **Investigation**: Telemetry breakdown, 5-signal cards, and live "Analyze Transaction" execution.

---

## 7. Backend API Dependencies

The frontend expects the backend API at `VITE_API_BASE_URL` with standard response envelopes:

| Endpoint | Method | Used In Page | Expected Function |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Shell Header | Periodic health beacon (UP / DOWN) |
| `/dashboard/summary` | `GET` | Dashboard | Overview KPI cards & chart distributions |
| `/transactions` | `GET` | Transactions | Paginated search, filters, and sorting |
| `/transactions/:id` | `GET` | Investigation | Transaction telemetry details |
| `/transactions` | `POST` | Transactions | Ingest new transaction via modal |
| `/detection/analyze/:id` | `POST` | Investigation | Execute 5-signal statistical engine |
| `/detection/analyze-batch`| `POST` | Global Shell | Batch evaluate transactions |
| `/detection/results/:id` | `GET` | Investigation | Retrieve cached detection analysis |
| `/alerts` | `GET` | Alerts | Paginated case queue by status/severity |
| `/alerts/:id` | `GET` | Alerts | Case details & immutable audit logs |
| `/alerts/:id` | `PATCH` | Alerts | Update case status, notes, analyst |
| `/reports/confusion-matrix`| `GET` | Analytics | Academic validation metrics & matrix |
| `/reports/export` | `GET` | Transactions / Analytics | Download sanitized CSV |
| `/detection/settings` | `GET`, `PATCH` | Methodology | Read & tune detector weights |

---

## 8. Known Limitations & Academic Boundary

1. **Academic Dataset Isolation**: Ground truth labels (`NORMAL` vs `SUSPICIOUS`) are generated exclusively for validation benchmarks and never influence the frontend scoring view.
2. **Deterministic Rules Engine**: Anomaly scores are calculated strictly on the backend using non-parametric statistics (Median & MAD). The frontend never generates or calculates risk scores locally.
