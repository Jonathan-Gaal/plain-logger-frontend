import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeverityBadge } from '../../components/SeverityBadge';

describe('SeverityBadge', () => {
  it('should render low severity', () => {
    render(<SeverityBadge severity="low" />);
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('should render medium severity', () => {
    render(<SeverityBadge severity="medium" />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('should render high severity', () => {
    render(<SeverityBadge severity="high" />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('should render critical severity', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('critical')).toBeInTheDocument();
  });
});
