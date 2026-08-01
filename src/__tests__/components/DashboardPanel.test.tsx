import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { DashboardPanel } from '../../components/DashboardPanel';
import { mockServer, mockStats } from '../setup';

describe('DashboardPanel', () => {
  it('renders each headline rate as a percentage', async () => {
    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    expect(within(screen.getByTestId('stat-match-rate')).getByText('40%')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-coverage')).getByText('50%')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('stat-self-service')).getByText('25%')
    ).toBeInTheDocument();
  });

  it('counts open and in-progress tickets together as the open figure', async () => {
    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    const card = screen.getByTestId('stat-open-tickets');
    // 3 open + 2 in progress.
    expect(within(card).getByText('5')).toBeInTheDocument();
    expect(within(card).getByText(/3 resolved of 8 total/)).toBeInTheDocument();
  });

  it('spells out the coverage gap in absolute terms, not just a rate', async () => {
    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    expect(
      within(screen.getByTestId('stat-coverage')).getByText(
        /6 of 12 codes seen have no template/
      )
    ).toBeInTheDocument();
  });

  it('breaks parses down by outcome', async () => {
    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Unmapped')).toBeInTheDocument();
    expect(screen.getByText('Invalid payload')).toBeInTheDocument();
  });

  it('lists every severity, including ones with no tickets', async () => {
    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    for (const label of ['Low', 'Medium', 'High', 'Critical']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('lists the most parsed codes with their counts', async () => {
    render(<DashboardPanel />);

    const list = await screen.findByTestId('top-codes');
    expect(within(list).getByText('node.psu')).toBeInTheDocument();
    expect(within(list).getByText('9 parses')).toBeInTheDocument();
    expect(within(list).getByText('1 parse')).toBeInTheDocument();
  });

  it('flags a top code that has no template', async () => {
    render(<DashboardPanel />);

    const list = await screen.findByTestId('top-codes');
    const row = within(list).getByText('mystery.code').closest('li')!;
    expect(within(row).getByText('no template')).toBeInTheDocument();

    // A code that does have one must not be flagged.
    const mapped = within(list).getByText('node.psu').closest('li')!;
    expect(within(mapped).queryByText('no template')).not.toBeInTheDocument();
  });

  it('shows empty-state copy rather than bars when nothing is parsed', async () => {
    mockServer.use(
      http.get('*/api/stats', () =>
        HttpResponse.json({
          status: 'ok',
          stats: {
            ...mockStats,
            parses: { total: 0, matched: 0, unmapped: 0, invalid: 0, matchRate: 0 },
            topCodes: [],
          },
        })
      )
    );

    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    expect(screen.getAllByText('Nothing parsed yet.').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('top-codes')).not.toBeInTheDocument();
  });

  it('renders 0% rather than NaN% for an empty install', async () => {
    mockServer.use(
      http.get('*/api/stats', () =>
        HttpResponse.json({
          status: 'ok',
          stats: {
            parses: { total: 0, matched: 0, unmapped: 0, invalid: 0, matchRate: 0 },
            coverage: {
              templateCount: 0,
              distinctCodesSeen: 0,
              codesWithTemplate: 0,
              codesMissingTemplate: 0,
              coverageRate: 0,
            },
            routing: {
              selfServiceTemplates: 0,
              escalationTemplates: 0,
              selfServiceRate: 0,
            },
            tickets: {
              total: 0,
              open: 0,
              inProgress: 0,
              resolved: 0,
              bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
            },
            topCodes: [],
          },
        })
      )
    );

    render(<DashboardPanel />);

    await screen.findByTestId('dashboard');
    expect(screen.getAllByText('0%')).toHaveLength(3);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('surfaces a backend failure instead of a dashboard of zeroes', async () => {
    mockServer.use(
      http.get('*/api/stats', () =>
        HttpResponse.json(
          { status: 'error', message: 'Could not reach the database.' },
          { status: 500 }
        )
      )
    );

    render(<DashboardPanel />);

    await waitFor(() =>
      expect(screen.getByText('Could not reach the database.')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});
