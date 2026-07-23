import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '../../components/CopyButton';

describe('CopyButton', () => {
  it('should render with Copy text initially', () => {
    render(<CopyButton text="test content" />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('should render button with icon and text', () => {
    render(<CopyButton text="test content" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should be clickable', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="test content" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    await user.click(button);
  });
});
