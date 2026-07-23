import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketsPanel } from '../../components/TicketsPanel';

describe('TicketsPanel', () => {
  it('shows all tickets by default', async () => {
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());
    expect(screen.getByText('PL-002')).toBeInTheDocument();
    expect(screen.getByText('PL-003')).toBeInTheDocument();
  });

  it('Unmapped filter shows only tickets without a matched template', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Unmapped' }));

    await waitFor(() => {
      expect(screen.getByText('PL-001')).toBeInTheDocument();
      expect(screen.getByText('PL-003')).toBeInTheDocument();
    });
    expect(screen.queryByText('PL-002')).not.toBeInTheDocument();
  });

  it('Mapped filter shows only tickets with a matched template', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Mapped' }));

    await waitFor(() => expect(screen.getByText('PL-002')).toBeInTheDocument());
    expect(screen.queryByText('PL-001')).not.toBeInTheDocument();
    expect(screen.queryByText('PL-003')).not.toBeInTheDocument();
  });

  it('removes a ticket from the Unmapped view once it gets mapped', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Unmapped' }));
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());

    await user.click(screen.getByText('PL-001'));
    await waitFor(() => expect(screen.getByText('Add error code to database')).toBeInTheDocument());
    await user.click(screen.getByText('Add error code to database'));

    await user.type(screen.getByPlaceholderText('Internal system (e.g. auth-service)'), 'test-system');
    await user.type(screen.getByPlaceholderText('Specialist diagnostic'), 'diagnostic text');
    await user.type(screen.getByPlaceholderText('Employee message'), 'employee message text');

    await user.click(screen.getByText('Create template & parse'));

    // Confirm the modal itself now reflects the link (its own "matched" card,
    // not the create-template form) before closing it to check the list.
    await waitFor(() =>
      expect(screen.getByText('Specialist Diagnostic — test-system')).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('PL-001')).not.toBeInTheDocument());
  });
});
