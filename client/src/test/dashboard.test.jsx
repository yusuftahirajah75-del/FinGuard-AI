import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard.jsx';
import dashboardService from '../services/api/dashboardService.js';

// Mock dashboardService
vi.mock('../services/api/dashboardService.js', () => ({
  default: {
    getDashboardSummary: vi.fn(),
  },
}));

describe('Dashboard Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders KPI cards and recent anomalies from live API data', async () => {
    const mockData = {
      transactions: {
        total: 1000,
        analyzed: 750,
        unanalyzed: 250,
        channelDistribution: [{ transaction_channel: 'ONLINE', count: '500', total_volume: '45000' }],
      },
      detection: {
        averageAnomalyScore: 42.5,
        highRiskCount: 65,
        riskBreakdown: [
          { risk_level: 'CRITICAL', count: '25', avg_score: '88.5' },
          { risk_level: 'HIGH', count: '40', avg_score: '67.2' },
          { risk_level: 'MEDIUM', count: '150', avg_score: '45.1' },
          { risk_level: 'LOW', count: '535', avg_score: '11.8' },
        ],
      },
      alerts: {
        total: 65,
        statusBreakdown: [{ status: 'OPEN', count: '45' }],
      },
      recentAnomalies: [
        {
          id: 'ano-1',
          transaction_id: 'tx-1',
          transaction_reference: 'TXN-FLAGGED-01',
          amount: 8500.0,
          risk_level: 'CRITICAL',
          anomaly_score: 92.5,
        },
      ],
      activeOpenAlerts: [
        {
          id: 'al-1',
          transaction_reference: 'TXN-ALERT-CASE-01',
          severity: 'CRITICAL',
          status: 'OPEN',
        },
      ],
    };

    dashboardService.getDashboardSummary.mockResolvedValueOnce(mockData);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Initial loading skeleton state
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Security Intelligence Overview')).toBeInTheDocument();
    });

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('TXN-FLAGGED-01')).toBeInTheDocument();
    expect(screen.getByText('TXN-ALERT-CASE-01')).toBeInTheDocument();
    expect(screen.getByText('$8,500.00')).toBeInTheDocument();
  });

  test('renders error banner when API fails', async () => {
    dashboardService.getDashboardSummary.mockRejectedValueOnce(
      new Error('Failed to connect to FTADS backend')
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Dashboard Data')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to connect to FTADS backend')).toBeInTheDocument();
  });
});
