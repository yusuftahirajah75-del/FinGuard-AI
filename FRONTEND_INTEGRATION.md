# FTADS Frontend Integration Guide

This document is the authoritative API contract and integration guide for connecting a React frontend to the **Financial Transaction Anomaly Detection System (FTADS)** backend.

---

## 1. Connection & Global Configuration

- **Default Base URL**: `http://localhost:5000/api`
- **Supported HTTP Methods**: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`
- **Headers**:
  - `Content-Type: application/json` (for all JSON request bodies)
  - `Accept: application/json` (or `text/csv` for export endpoints)
- **CORS Whitelist**: `http://localhost:3000`, `http://localhost:5173` (Vite), `http://localhost:8080`

---

## 2. Global Response Contracts

### Success Response Envelope
All JSON responses (except file downloads) follow this envelope:
```json
{
  "success": true,
  "message": "Human-readable status or summary message",
  "data": { ... },
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 20,
    "totalPages": 50
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "message": "Request validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "amount must be a positive number"
    }
  ]
}
```

### HTTP Status Code Conventions
- `200 OK`: Request succeeded.
- `201 Created`: Resource created successfully.
- `400 Bad Request`: Validation failure or malformed payload.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Duplicate reference or conflicting resource.
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Server exception.

---

## 3. Endpoints Catalog

### 3.1 System Health
`GET /api/health`

Checks database connectivity, server uptime, and algorithm version.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "FTADS service operational",
  "data": {
    "status": "UP",
    "timestamp": "2026-11-01T10:15:00.000Z",
    "uptimeSeconds": 1420,
    "environment": "development",
    "version": "1.0.0",
    "database": {
      "connected": true,
      "database": "ftads_dev",
      "serverTime": "2026-11-01T10:15:00.000Z"
    },
    "memoryUsage": {
      "rss": "85 MB",
      "heapUsed": "42 MB"
    }
  }
}
```

---

### 3.2 Dashboard Summary
`GET /api/dashboard/summary`

Provides top-level KPI cards, recent high-risk anomalies, and active alerts for the main dashboard view.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Dashboard metrics retrieved successfully",
  "data": {
    "transactions": {
      "total": 1000,
      "analyzed": 750,
      "unanalyzed": 250,
      "channelDistribution": [
        { "transaction_channel": "ONLINE", "count": "340", "total_volume": "125400.00" },
        { "transaction_channel": "MOBILE", "count": "280", "total_volume": "89300.00" }
      ]
    },
    "detection": {
      "averageAnomalyScore": 34.25,
      "highRiskCount": 94,
      "riskBreakdown": [
        { "risk_level": "CRITICAL", "count": "38", "avg_score": "88.40" },
        { "risk_level": "HIGH", "count": "56", "avg_score": "68.20" },
        { "risk_level": "MEDIUM", "count": "180", "avg_score": "44.10" },
        { "risk_level": "LOW", "count": "476", "avg_score": "12.30" }
      ]
    },
    "alerts": {
      "total": 94,
      "statusBreakdown": [
        { "status": "OPEN", "count": "58" },
        { "status": "UNDER_REVIEW", "count": "22" },
        { "status": "RESOLVED", "count": "10" },
        { "status": "FALSE_POSITIVE", "count": "4" }
      ],
      "severityBreakdown": [
        { "severity": "CRITICAL", "count": "38" },
        { "severity": "HIGH", "count": "56" }
      ]
    },
    "recentAnomalies": [ ... ],
    "activeOpenAlerts": [ ... ]
  }
}
```

---

### 3.3 Transactions API

#### A. List Transactions
`GET /api/transactions`

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 20, max: 100) | `25` |
| `search` | string | No | Search reference, customer, or beneficiary | `CUST-0012` |
| `channel` | enum | No | `ONLINE`, `MOBILE`, `ATM`, `POS`, `BRANCH` | `ONLINE` |
| `status` | enum | No | `COMPLETED`, `PENDING`, `FAILED`, `FLAGGED` | `COMPLETED` |
| `riskLevel` | enum | No | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `HIGH` |
| `minAmount` | number | No | Minimum transaction amount | `100` |
| `maxAmount` | number | No | Maximum transaction amount | `5000` |
| `startDate` | ISO8601 | No | Filter start date | `2026-10-01T00:00:00Z` |
| `endDate` | ISO8601 | No | Filter end date | `2026-10-31T23:59:59Z` |
| `sortBy` | string | No | `timestamp`, `amount`, `reference`, `score` | `score` |
| `sortOrder`| enum | No | `ASC`, `DESC` (default: `DESC`) | `DESC` |

#### B. Get Transaction by ID
`GET /api/transactions/:id`

#### C. Create Transaction
`POST /api/transactions`

**Request Body:**
```json
{
  "customer_reference": "CUST-0042",
  "source_account_reference": "ACC-0042-01",
  "beneficiary_reference": "BEN-9921",
  "amount": 1250.00,
  "currency": "USD",
  "transaction_type": "TRANSFER",
  "transaction_channel": "ONLINE",
  "transaction_location": "New York, US",
  "transaction_status": "COMPLETED"
}
```

---

### 3.4 Anomaly Detection Engine API

#### A. Analyze Single Transaction
`POST /api/detection/analyze/:id`

Runs all 5 statistical detectors against strictly prior customer history and computes the weighted composite anomaly score.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction analyzed successfully",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "transactionReference": "TXN-0000142",
    "anomalyScore": 76.5,
    "riskLevel": "HIGH",
    "detectionStatus": "ANALYZED",
    "signals": {
      "amount": {
        "rawScore": 88.5,
        "nominalWeight": 0.35,
        "effectiveWeight": 0.35,
        "contribution": 30.98,
        "status": "ACTIVE",
        "triggered": true,
        "explanation": "Transaction amount $4,800.00 is an anomaly, deviating 4.62 MAD standard deviations above customer historical median ($65.00, MAD: $20.00 across 34 past transactions).",
        "metrics": {
          "currentAmount": 4800,
          "historicalMedian": 65,
          "historicalMAD": 20,
          "modifiedZScore": 4.62,
          "historicalCount": 34
        }
      },
      "velocity": {
        "rawScore": 0,
        "nominalWeight": 0.25,
        "effectiveWeight": 0.25,
        "contribution": 0,
        "status": "ACTIVE",
        "triggered": false,
        "explanation": "Transaction velocity is normal (0 in past 5m, 1 in past 1h)."
      },
      "unusual_time": {
        "rawScore": 75.0,
        "nominalWeight": 0.15,
        "effectiveWeight": 0.15,
        "contribution": 11.25,
        "status": "ACTIVE",
        "triggered": true,
        "explanation": "Transaction initiated at 03:00 UTC. Customer has 0 historical records in this hour."
      },
      "repeated_transaction": {
        "rawScore": 0,
        "nominalWeight": 0.15,
        "effectiveWeight": 0.15,
        "contribution": 0,
        "status": "ACTIVE",
        "triggered": false,
        "explanation": "No repeated or duplicate transfers detected."
      },
      "new_beneficiary": {
        "rawScore": 45.0,
        "nominalWeight": 0.10,
        "effectiveWeight": 0.10,
        "contribution": 4.5,
        "status": "ACTIVE",
        "triggered": true,
        "explanation": "Beneficiary 'BEN-9921' is newly introduced. Not inherently fraudulent alone, but elevates composite risk."
      }
    },
    "explanation": "Suspicious financial transaction flagged with anomaly score of 76.5/100 (Risk Level: HIGH). Key deviations detected: Extreme amount deviation; Nocturnal off-peak hours; Novel counterparty.",
    "alertCreated": true,
    "alert": {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "severity": "HIGH",
      "status": "OPEN"
    },
    "algorithmVersion": "1.0.0",
    "durationMs": 14.2,
    "analyzedAt": "2026-11-01T10:15:30.120Z"
  }
}
```

#### B. Batch Analyze Transactions
`POST /api/detection/analyze-batch`

**Request Body:**
```json
{
  "limit": 100,
  "onlyUnanalyzed": true
}
```

#### C. Get Detection Methodology
`GET /api/detection/methodology`

Returns academic formulas, detector algorithms, and mathematical justifications.

#### D. Get / Update Engine Settings
- `GET /api/detection/settings`
- `PATCH /api/detection/settings`

**Update Body:**
```json
{
  "weights": {
    "amount": 0.35,
    "velocity": 0.25,
    "unusual_time": 0.15,
    "repeated_transaction": 0.15,
    "new_beneficiary": 0.10
  },
  "thresholds": {
    "alert_trigger_score": 60.0
  }
}
```

---

### 3.5 Alerts & Case Management API

#### A. List Alerts
`GET /api/alerts`
- Filters: `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `FALSE_POSITIVE`), `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `assignedAnalyst`.

#### B. Get Alert Details & Audit Trail
`GET /api/alerts/:id`

Returns alert fields, related transaction details, detection explanation, and chronologically ordered audit logs.

#### C. Triage / Update Alert
`PATCH /api/alerts/:id`

**Request Body:**
```json
{
  "status": "UNDER_REVIEW",
  "assigned_analyst": "Alex Vance",
  "investigation_notes": "Contacted cardholder to verify 03:00 AM wire transfer.",
  "actor_reference": "analyst-avance"
}
```

---

### 3.6 Reports & Academic Analytics API

#### A. Confusion Matrix & Metrics
`GET /api/reports/confusion-matrix?threshold=60`

Evaluates system precision, recall, specificity, F1-score, and accuracy against synthetic ground-truth labels.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Academic Anomaly Detection Evaluation & Confusion Matrix",
  "data": {
    "evaluationMetadata": {
      "totalEvaluated": 750,
      "decisionThreshold": 60
    },
    "confusionMatrix": {
      "truePositives": 92,
      "falsePositives": 11,
      "trueNegatives": 641,
      "falseNegatives": 6
    },
    "metrics": {
      "accuracy": 0.9773,
      "precision": 0.8932,
      "recall": 0.9388,
      "f1Score": 0.9154,
      "accuracyPercent": "97.73%",
      "precisionPercent": "89.32%",
      "recallPercent": "93.88%",
      "f1ScorePercent": "91.54%"
    }
  }
}
```

#### B. Export CSV
`GET /api/reports/export?type=transactions&limit=1000`
`GET /api/reports/export?type=alerts&limit=1000`

Direct browser download stream (`Content-Type: text/csv`). Implements automated formula injection protection.

