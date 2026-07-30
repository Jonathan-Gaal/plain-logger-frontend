import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EscalateBadge } from '../../components/EscalateBadge';

describe('EscalateBadge', () => {
  it('shows "Escalate to dev" when escalateToDev is true', () => {
    render(<EscalateBadge escalateToDev={true} />);
    expect(screen.getByText('Escalate to dev')).toBeInTheDocument();
  });

  it('shows "Do not escalate" when escalateToDev is false', () => {
    render(<EscalateBadge escalateToDev={false} />);
    expect(screen.getByText('Do not escalate')).toBeInTheDocument();
  });
});
