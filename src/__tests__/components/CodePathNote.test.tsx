import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodePathNote } from '../../components/CodePathNote';

describe('CodePathNote', () => {
  it('names the path the code was read from', () => {
    render(<CodePathNote codePath="meta.error.error_code" />);
    expect(screen.getByText('meta.error.error_code')).toBeInTheDocument();
  });

  it('calls out a nested path explicitly', () => {
    render(<CodePathNote codePath="meta.error.error_code" />);
    expect(
      screen.getByText(/nested inside the pasted payload/)
    ).toBeInTheDocument();
  });

  it('does not call a top-level path nested', () => {
    render(<CodePathNote codePath="error_code" />);
    expect(screen.getByText('error_code')).toBeInTheDocument();
    expect(screen.queryByText(/nested/)).not.toBeInTheDocument();
  });

  it('treats an array index as a nested path', () => {
    render(<CodePathNote codePath="errors[1].code" />);
    expect(
      screen.getByText(/nested inside the pasted payload/)
    ).toBeInTheDocument();
  });

  it('renders nothing when there is no path', () => {
    const { container } = render(<CodePathNote codePath={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
