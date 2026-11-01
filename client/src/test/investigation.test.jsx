import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Investigation from '../pages/Investigation.jsx';
import transactionService from '../services/api/transactionService.js';
import detectionService from '../services/api/detectionService.js';
import ToastProvider from '../context/ToastContext.jsx';

vi.mock('../services/api/transactionService.js', () => ({
  default: {
    getTransactionById: vi.fn(),
  },
}));

vi.mock('../services/api/detectionService.js', () => ({
  default: {
    getResultsByTransactionId: vi.fn(),
    analyzeTransaction: vi.fn(),
  },
}));

describe('Investigation Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders transaction telemetry and detection signals', async () => {
    const mockTx = {
      id: 'tx-uuid-1234',
      transaction_reference: 'TXN-INVESTIGATE-01',
      customer_reference: 'CUST-0042',
      source_account_reference: 'ACC-0042-01',
      beneficiary_reference: 'BEN-UNKNOWN-99',
      amount: 4950.0,
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_status: 'COMPLETED',
      transaction_timestamp: '2026-10-15T03:15:00Z',
      synthetic_ground_truth_label: 'SUSPICIOUS',
      anomaly_score: 82.5,
      risk_level: 'CRITICAL',
    };

    const mockDetection = {
      anomalyScore: 82.5,
      riskLevel: 'CRITICAL',
      explanation: 'High amount deviation combined with nocturnal operating hours.',
      signals: {
        amount: {
          rawScore: 90,
          status: 'ACTIVE',
          triggered: true,
          explanation: 'Amount deviates 5.2 MAD above customer median.',
          contribution: 31.5,
        },
        velocity: {
          rawScore: 0,
          status: 'ACTIVE',
          triggered: false,
          explanation: 'Velocity is within normal limits.',
          contribution: 0,
        },
        unusual_time: {
          rawScore: 75,
          status: 'ACTIVE',
          triggered: true,
          explanation: 'Transaction at 03:00 UTC is unusual for this customer.',
          contribution: 11.25,
        },
      },
    };

    transactionService.getTransactionById.mockResolvedValueOnce(mockTx);
    detectionService.getResultsByTransactionId.mockResolvedValueOnce(mockDetection);

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/investigation/tx-uuid-1234']}>
          <Routes>
            <Route path="/investigation/:id" element={<Investigation />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TXN-INVESTIGATE-01')).toBeInTheDocument();
    });

    expect(screen.getByText('$4,950.00')).toBeInTheDocument();
    expect(screen.getByText('82.5')).toBeInTheDocument();
    expect(screen.getByText('Amount Deviation')).toBeInTheDocument();
    expect(screen.getByText('Velocity Burst')).toBeInTheDocument();
    expect(screen.getByText('Circadian Time')).toBeInTheDocument();
    expect(screen.getByText(/High amount deviation combined with nocturnal operating hours/i)).toBeInTheDocument();
  });

  test('clicking Analyze Transaction triggers backend execution', async () => {
    const mockTx = {
      id: 'tx-uuid-9999',
      transaction_reference: 'TXN-NEW-01',
      customer_reference: 'CUST-0099',
      source_account_reference: 'ACC-0099-01',
      beneficiary_reference: 'BEN-LEGIT',
      amount: 120.0,
      currency: 'USD',
      transaction_type: 'PAYMENT',
      transaction_channel: 'MOBILE',
      transaction_status: 'COMPLETED',
      transaction_timestamp: '2026-10-15T14:00:00Z',
    };

    const mockAnalysisResult = {
      anomalyScore: 12.0,
      riskLevel: 'LOW',
      alertCreated: false,
      explanation: 'Normal transaction within standard customer habits.',
      signals: {},
    };

    transactionService.getTransactionById.mockResolvedValue(mockTx);
    detectionService.getResultsByTransactionId.mockRejectedValueOnce(new Error('Not analyzed'));
    detectionService.analyzeTransaction.mockResolvedValueOnce(mockAnalysisResult);

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/investigation/tx-uuid-9999']}>
          <Routes>
            <Route path="/investigation/:id" element={<Investigation />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TXN-NEW-01')).toBeInTheDocument();
    });

    const analyzeBtn = screen.getByRole('button', { name: /Analyze Transaction/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(detectionService.analyzeTransaction).toHaveBeenCalledWith('tx-uuid-9999');
    });
  });
});
