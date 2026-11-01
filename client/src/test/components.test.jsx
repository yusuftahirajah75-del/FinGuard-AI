import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RiskBadge from '../components/common/RiskBadge.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import KpiCard from '../components/common/KpiCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { ShieldAlert } from 'lucide-react';

describe('Common UI Components', () => {
  describe('RiskBadge', () => {
    test('renders CRITICAL risk level badge correctly', () => {
      render(<RiskBadge level="CRITICAL" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('CRITICAL');
      expect(badge).toHaveClass('bg-rose-50');
    });

    test('renders LOW risk level badge correctly', () => {
      render(<RiskBadge level="LOW" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('LOW');
      expect(badge).toHaveClass('bg-emerald-50');
    });
  });

  describe('StatusBadge', () => {
    test('renders alert status correctly', () => {
      render(<StatusBadge status="UNDER_REVIEW" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Under Review');
    });
  });

  describe('KpiCard', () => {
    test('renders title, value, and subtitle', () => {
      render(
        <KpiCard
          title="Open Alerts"
          value="42"
          subtitle="Requires analyst attention"
          icon={ShieldAlert}
          variant="critical"
        />
      );
      expect(screen.getByText('Open Alerts')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Requires analyst attention')).toBeInTheDocument();
    });

    test('renders loading skeleton when loading prop is true', () => {
      const { container } = render(<KpiCard title="Loading Test" loading={true} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    test('renders empty message and handles action click', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="No records"
          message="No matching transactions"
          actionLabel="Clear Filter"
          onAction={onAction}
        />
      );
      expect(screen.getByText('No records')).toBeInTheDocument();
      expect(screen.getByText('No matching transactions')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Clear Filter' });
      fireEvent.click(button);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorBanner', () => {
    test('renders error title and message with retry button', () => {
      const onRetry = vi.fn();
      render(
        <ErrorBanner
          title="Connection Failure"
          message="Could not reach database"
          onRetry={onRetry}
          isNetworkError={true}
        />
      );
      expect(screen.getByText('Connection Failure')).toBeInTheDocument();
      expect(screen.getByText('Could not reach database')).toBeInTheDocument();
      expect(screen.getByText(/Troubleshooting checklist/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry Connection/i });
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});

