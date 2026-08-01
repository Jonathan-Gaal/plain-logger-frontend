import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { UnmappedQueuePanel } from '../../components/UnmappedQueuePanel';
import { mockServer } from '../setup';

describe('UnmappedQueuePanel', () => {
  it('lists each unmapped code with its hit count', async () => {
    render(<UnmappedQueuePanel />);

    const queue = await screen.findByTestId('unmapped-queue');
    expect(within(queue).getByText('node.temperatur')).toBeInTheDocument();
    expect(within(queue).getByText('14 hits')).toBeInTheDocument();
    expect(within(queue).getByText('zzzz.novel')).toBeInTheDocument();
  });

  it('preserves the backend ordering, worst gap first', async () => {
    render(<UnmappedQueuePanel />);

    await screen.findByTestId('unmapped-queue');
    const codes = screen
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.font-mono')?.textContent);
    expect(codes).toEqual(['node.temperatur', 'zzzz.novel']);
  });

  it('summarizes how many codes and failed lookups are outstanding', async () => {
    render(<UnmappedQueuePanel />);

    const summary = await screen.findByTestId('unmapped-summary');
    expect(summary).toHaveTextContent('2 codes with no template');
    expect(summary).toHaveTextContent('15 failed lookups');
  });

  it('shows the closest known code when there is one', async () => {
    render(<UnmappedQueuePanel />);

    await screen.findByTestId('unmapped-queue');
    expect(screen.getByText('Closest known code:')).toBeInTheDocument();
    expect(screen.getByText('node.temperature')).toBeInTheDocument();
    expect(screen.getByText('83% match')).toBeInTheDocument();
  });

  it('shows no lead for a code that resembles nothing', async () => {
    render(<UnmappedQueuePanel />);

    await screen.findByTestId('unmapped-queue');
    // Only the one row with a topSuggestion should render a lead.
    expect(screen.getAllByText('Closest known code:')).toHaveLength(1);
  });

  it('singularizes a one-hit row', async () => {
    render(<UnmappedQueuePanel />);

    const queue = await screen.findByTestId('unmapped-queue');
    expect(within(queue).getByText('1 hit')).toBeInTheDocument();
  });

  it('shows an explicit empty state when nothing is unmapped', async () => {
    mockServer.use(
      http.get('*/api/unmapped', () =>
        HttpResponse.json({ status: 'ok', unmapped: [] })
      )
    );

    render(<UnmappedQueuePanel />);

    await waitFor(() =>
      expect(screen.getByText('No unmapped codes.')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('unmapped-queue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unmapped-summary')).not.toBeInTheDocument();
  });

  it('surfaces a backend failure instead of rendering an empty queue', async () => {
    mockServer.use(
      http.get('*/api/unmapped', () =>
        HttpResponse.json(
          { status: 'error', message: 'Could not reach the database.' },
          { status: 500 }
        )
      )
    );

    render(<UnmappedQueuePanel />);

    await waitFor(() =>
      expect(screen.getByText('Could not reach the database.')).toBeInTheDocument()
    );
    expect(screen.queryByText('No unmapped codes.')).not.toBeInTheDocument();
  });
});
