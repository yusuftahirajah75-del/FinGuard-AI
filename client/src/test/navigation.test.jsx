import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Header from '../components/layout/Header.jsx';

describe('Navigation & Layout Shell', () => {
  test('renders all primary navigation links in sidebar', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Investigation')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Detection Analytics')).toBeInTheDocument();
    expect(screen.getByText('Methodology & Settings')).toBeInTheDocument();
    expect(screen.getByText('Academic Research Engine')).toBeInTheDocument();
  });

  test('renders header with live status beacon when connected', () => {
    render(
      <Header
        onToggleSidebar={() => {}}
        systemStatus={{ connected: true, database: 'ftads_dev' }}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('Engine Live')).toBeInTheDocument();
    expect(screen.getByText(/Synthetic Dataset/i)).toBeInTheDocument();
  });

  test('renders header with offline indicator when disconnected', () => {
    render(
      <Header
        onToggleSidebar={() => {}}
        systemStatus={{ connected: false }}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});
