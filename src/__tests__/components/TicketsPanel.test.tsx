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

    await user.type(screen.getByPlaceholderText('Internal system (e.g. interconnect)'), 'test-system');
    // Category has no default — a real category must be chosen explicitly.
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'node');
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

  it('offers the catalog categories, not the retired fictional ones', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());

    await user.click(screen.getByText('PL-001'));
    await waitFor(() => expect(screen.getByText('Add error code to database')).toBeInTheDocument());
    await user.click(screen.getByText('Add error code to database'));

    const category = screen.getByRole('combobox', { name: 'Category' });
    const values = Array.from(category.querySelectorAll('option')).map((o) => o.value);

    // Real categories, taken from error_templates in the seeded catalog.
    expect(values).toEqual(
      expect.arrayContaining(['command', 'hardware', 'thermal', 'network', 'filesystem', 'node'])
    );
    // Leftovers from the original fictional seed set — none of these exist
    // in the catalog, so offering them silently mislabelled every template.
    expect(values).not.toContain('auth');
    expect(values).not.toContain('timeout');
    expect(values).not.toContain('queue');
    expect(values).not.toContain('db');
    expect(values).not.toContain('config');

    // No pre-selected value, so a category can't be submitted by accident.
    expect((category as HTMLSelectElement).value).toBe('');
  });

  it('blocks template creation until a category is chosen', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-001')).toBeInTheDocument());

    await user.click(screen.getByText('PL-001'));
    await waitFor(() => expect(screen.getByText('Add error code to database')).toBeInTheDocument());
    await user.click(screen.getByText('Add error code to database'));

    // Everything filled except the category.
    await user.type(screen.getByPlaceholderText('Internal system (e.g. interconnect)'), 'test-system');
    await user.type(screen.getByPlaceholderText('Specialist diagnostic'), 'diagnostic text');
    await user.type(screen.getByPlaceholderText('Employee message'), 'employee message text');
    await user.click(screen.getByText('Create template & parse'));

    await waitFor(() =>
      expect(
        screen.getByText('All fields except self-service steps are required.')
      ).toBeInTheDocument()
    );
    // Still on the form, not switched over to a matched card.
    expect(screen.getByText('Create template & parse')).toBeInTheDocument();
  });

  it('hides the edit affordances on a ticket that is not resolved', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-002')).toBeInTheDocument());

    // PL-002 is mapped but still open, so the messages are read-only.
    await user.click(screen.getByText('PL-002'));
    await waitFor(() =>
      expect(screen.getByText('Specialist Diagnostic — test-system')).toBeInTheDocument()
    );

    expect(
      screen.queryByRole('button', { name: 'Edit specialist diagnostic' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit employee message' })
    ).not.toBeInTheDocument();
  });

  it('edits and saves the specialist diagnostic on a resolved ticket', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-004')).toBeInTheDocument());

    await user.click(screen.getByText('PL-004'));
    await waitFor(() => expect(screen.getByText('Original diagnostic')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Edit specialist diagnostic' }));

    // The textarea should open pre-filled with the current text.
    const textarea = screen.getByDisplayValue('Original diagnostic');
    await user.clear(textarea);
    await user.type(textarea, 'Revised after resolution');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText('Revised after resolution')).toBeInTheDocument()
    );
    expect(screen.queryByText('Original diagnostic')).not.toBeInTheDocument();
  });

  it('edits and saves the employee message on a resolved ticket', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-004')).toBeInTheDocument());

    await user.click(screen.getByText('PL-004'));
    await waitFor(() => expect(screen.getByText('Original employee message')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Edit employee message' }));

    const textarea = screen.getByDisplayValue('Original employee message');
    await user.clear(textarea);
    await user.type(textarea, 'Clearer wording for the employee');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText('Clearer wording for the employee')).toBeInTheDocument()
    );
  });

  it('discards an in-progress edit when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TicketsPanel />);
    await waitFor(() => expect(screen.getByText('PL-004')).toBeInTheDocument());

    await user.click(screen.getByText('PL-004'));
    await waitFor(() => expect(screen.getByText('Original diagnostic')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Edit specialist diagnostic' }));
    const textarea = screen.getByDisplayValue('Original diagnostic');
    await user.clear(textarea);
    await user.type(textarea, 'This should never be saved');

    // The edit panel's own Cancel, not the modal footer's.
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    await user.click(cancelButtons[0]);

    await waitFor(() => expect(screen.getByText('Original diagnostic')).toBeInTheDocument());
    expect(screen.queryByText('This should never be saved')).not.toBeInTheDocument();
  });
});
