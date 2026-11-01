-- ============================================================================
-- FTADS (Financial Transaction Anomaly Detection System) Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(64) UNIQUE NOT NULL,
    customer_reference VARCHAR(64) NOT NULL,
    source_account_reference VARCHAR(64) NOT NULL,
    beneficiary_reference VARCHAR(64) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    transaction_type VARCHAR(32) NOT NULL,
    transaction_channel VARCHAR(32) NOT NULL,
    transaction_location VARCHAR(64),
    transaction_timestamp TIMESTAMPTZ NOT NULL,
    transaction_status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    synthetic_ground_truth_label VARCHAR(16) NOT NULL DEFAULT 'NORMAL' CHECK (synthetic_ground_truth_label IN ('NORMAL', 'SUSPICIOUS')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_cust_time 
    ON transactions(customer_reference, transaction_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_time 
    ON transactions(transaction_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_bene 
    ON transactions(beneficiary_reference);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
    ON transactions(transaction_status);

CREATE INDEX IF NOT EXISTS idx_transactions_channel 
    ON transactions(transaction_channel);

CREATE INDEX IF NOT EXISTS idx_transactions_amount 
    ON transactions(amount);

-- ----------------------------------------------------------------------------
-- 2. ANOMALY RESULTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anomaly_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    anomaly_score NUMERIC(5, 2) NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 100),
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    detection_status VARCHAR(32) NOT NULL DEFAULT 'ANALYZED',
    signal_results JSONB NOT NULL,
    explanation TEXT NOT NULL,
    algorithm_version VARCHAR(16) NOT NULL DEFAULT '1.0.0',
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_txn_id 
    ON anomaly_results(transaction_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_score 
    ON anomaly_results(anomaly_score DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_risk 
    ON anomaly_results(risk_level);

CREATE INDEX IF NOT EXISTS idx_anomaly_analyzed_at 
    ON anomaly_results(analyzed_at DESC);

-- ----------------------------------------------------------------------------
-- 3. ALERTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    anomaly_result_id UUID NOT NULL REFERENCES anomaly_results(id) ON DELETE CASCADE,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'FALSE_POSITIVE')),
    assigned_analyst VARCHAR(64),
    investigation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_alerts_txn_result UNIQUE (transaction_id, anomaly_result_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_status 
    ON alerts(status);

CREATE INDEX IF NOT EXISTS idx_alerts_severity 
    ON alerts(severity);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
    ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_assigned 
    ON alerts(assigned_analyst);

-- ----------------------------------------------------------------------------
-- 4. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    actor_reference VARCHAR(64) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_alert_id 
    ON audit_logs(alert_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. DETECTION SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detection_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
    weights JSONB NOT NULL,
    thresholds JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if not present
INSERT INTO detection_settings (id, weights, thresholds, description)
VALUES (
    'default',
    '{
        "amount": 0.35,
        "velocity": 0.25,
        "unusual_time": 0.15,
        "repeated_transaction": 0.15,
        "new_beneficiary": 0.10
    }'::jsonb,
    '{
        "alert_trigger_score": 60.0,
        "risk_levels": {
            "low": [0, 29.99],
            "medium": [30, 59.99],
            "high": [60, 79.99],
            "critical": [80, 100]
        },
        "amount": {
            "min_history_count": 3,
            "modified_z_threshold": 3.0,
            "fallback_relative_deviation_threshold": 2.5
        },
        "velocity": {
            "window_5m_count_threshold": 3,
            "window_1h_count_threshold": 8
        },
        "unusual_time": {
            "min_history_count": 5,
            "hour_probability_threshold": 0.05
        },
        "repeated_transaction": {
            "window_minutes": 30,
            "amount_tolerance_percent": 0.01
        },
        "new_beneficiary": {
            "min_history_count": 3,
            "novelty_signal_score": 45.0
        }
    }'::jsonb,
    'Default Statistical Detection Engine Configuration (v1.0.0)'
) ON CONFLICT (id) DO NOTHING;

