import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnmappedCard } from '../../components/UnmappedCard';

describe('UnmappedCard', () => {
  it('renders the "Code not recognized" heading', () => {
    render(<UnmappedCard errorCode="bglmaster.heartbeat_lost" />);
    expect(screen.getByText('Code not recognized')).toBeInTheDocument();
  });

  it('shows the extracted error code when present', () => {
    render(<UnmappedCard errorCode="bglmaster.heartbeat_lost" />);
    expect(screen.getByText('bglmaster.heartbeat_lost')).toBeInTheDocument();
  });

  it('falls back to "no code found" when errorCode is null', () => {
    render(<UnmappedCard errorCode={null} />);
    expect(screen.getByText('no code found')).toBeInTheDocument();
  });
});
