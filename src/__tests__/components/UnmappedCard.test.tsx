import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { UnmappedCard } from '../../components/UnmappedCard';
import type { Suggestion } from '../../types';

const SUGGESTIONS: Suggestion[] = [
  {
    errorCode: 'node.temperature',
    internalSystem: 'node-agent',
    severity: 'low',
    confidence: 0.83,
  },
  {
    errorCode: 'node.psu',
    internalSystem: 'node-agent',
    severity: 'high',
    confidence: 0.41,
  },
];

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

  describe('near-miss suggestions', () => {
    it('lists each suggested code with its system and severity', () => {
      render(<UnmappedCard errorCode="node.temperatur" suggestions={SUGGESTIONS} />);

      const list = screen.getByTestId('suggestion-list');
      expect(within(list).getByText('node.temperature')).toBeInTheDocument();
      expect(within(list).getByText('node.psu')).toBeInTheDocument();
      expect(within(list).getAllByText('node-agent')).toHaveLength(2);
      expect(within(list).getByText('low')).toBeInTheDocument();
      expect(within(list).getByText('high')).toBeInTheDocument();
    });

    it('shows confidence as a rounded percentage', () => {
      render(<UnmappedCard errorCode="node.temperatur" suggestions={SUGGESTIONS} />);
      expect(screen.getByText('83% match')).toBeInTheDocument();
      expect(screen.getByText('41% match')).toBeInTheDocument();
    });

    it('preserves backend ordering rather than re-sorting', () => {
      render(<UnmappedCard errorCode="node.temperatur" suggestions={SUGGESTIONS} />);
      const codes = screen
        .getAllByRole('listitem')
        .map((li) => li.querySelector('.font-mono')?.textContent);
      expect(codes).toEqual(['node.temperature', 'node.psu']);
    });

    it('frames suggestions as leads to confirm, not as a match', () => {
      render(<UnmappedCard errorCode="node.temperatur" suggestions={SUGGESTIONS} />);
      // The card must still read as unmapped — a near-miss is not a match.
      expect(screen.getByText('Code not recognized')).toBeInTheDocument();
      expect(screen.getByText(/Confirm the payload really describes/)).toBeInTheDocument();
    });

    it('renders no suggestion section when there are none', () => {
      render(<UnmappedCard errorCode="totally.novel" suggestions={[]} />);
      expect(screen.queryByTestId('suggestion-list')).not.toBeInTheDocument();
      expect(screen.queryByText('Did you mean?')).not.toBeInTheDocument();
    });

    it('renders no suggestion section when the prop is omitted', () => {
      render(<UnmappedCard errorCode="totally.novel" />);
      expect(screen.queryByTestId('suggestion-list')).not.toBeInTheDocument();
    });
  });
});
