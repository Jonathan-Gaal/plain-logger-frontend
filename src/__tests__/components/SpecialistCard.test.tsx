import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpecialistCard } from '../../components/SpecialistCard';
import type { ParseLogMatchedResponse } from '../../types';

const HIGH: ParseLogMatchedResponse = {
  status: 'matched',
  errorCode: 'node.psu',
  internalSystem: 'compute-node',
  severity: 'high',
  isSelfService: false,
  selfServiceSteps: null,
  specialistDiagnostic: 'Power-supply-unit failure reported on a compute node. Drain the node and flag for PSU replacement.',
  employeeMessage: 'A node had a power-supply problem and has been pulled from service.',
  escalateToDev: true,
  historyId: 'h-1',
};

describe('SpecialistCard', () => {
  it('renders the Specialist Diagnostic heading and internal system', () => {
    render(<SpecialistCard result={HIGH} />);
    expect(screen.getByText('Specialist Diagnostic')).toBeInTheDocument();
    expect(screen.getByText('compute-node')).toBeInTheDocument();
  });

  it('renders the diagnostic text and severity/escalate badges', () => {
    render(<SpecialistCard result={HIGH} />);
    expect(screen.getByText(/Power-supply-unit failure/)).toBeInTheDocument();
    expect(screen.getByText('Escalate to dev')).toBeInTheDocument();
  });
});
