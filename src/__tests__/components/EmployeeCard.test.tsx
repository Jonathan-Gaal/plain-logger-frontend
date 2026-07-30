import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmployeeCard } from '../../components/EmployeeCard';
import type { ParseLogMatchedResponse } from '../../types';

const LOW_SELF_SERVICE: ParseLogMatchedResponse = {
  status: 'matched',
  errorCode: 'node.temperature',
  internalSystem: 'compute-node',
  severity: 'low',
  isSelfService: true,
  selfServiceSteps: 'No action needed — this is a routine ambient-temperature reading within the normal range.',
  specialistDiagnostic: 'Routine ambient temperature reading. Informational only — do not escalate.',
  employeeMessage: "Routine temperature reading from a node — everything's in the normal range.",
  escalateToDev: false,
  historyId: 'h-2',
};

const HIGH_NO_STEPS: ParseLogMatchedResponse = {
  ...LOW_SELF_SERVICE,
  errorCode: 'node.psu',
  severity: 'high',
  isSelfService: false,
  selfServiceSteps: null,
  employeeMessage: 'A node had a power-supply problem and has been pulled from service.',
  escalateToDev: true,
};

describe('EmployeeCard', () => {
  it('renders the Employee-Facing Message heading and message', () => {
    render(<EmployeeCard result={LOW_SELF_SERVICE} />);
    expect(screen.getByText('Employee-Facing Message')).toBeInTheDocument();
    expect(screen.getByText(/Routine temperature reading/)).toBeInTheDocument();
  });

  it('shows the "Steps to try" block when self-service with steps', () => {
    render(<EmployeeCard result={LOW_SELF_SERVICE} />);
    expect(screen.getByText('Steps to try')).toBeInTheDocument();
    expect(screen.getByText(/routine ambient-temperature reading/)).toBeInTheDocument();
  });

  it('omits the steps block when not self-service', () => {
    render(<EmployeeCard result={HIGH_NO_STEPS} />);
    expect(screen.queryByText('Steps to try')).not.toBeInTheDocument();
  });
});
