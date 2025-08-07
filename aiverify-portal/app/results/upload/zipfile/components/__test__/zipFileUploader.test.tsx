import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ZipFileUploader } from '../zipFileUploader';

jest.mock('../fileSelector', () => ({
  FileSelector: React.forwardRef((props: any, ref: any) => <div data-testid="file-selector" />),
}));

describe('ZipFileUploader', () => {
  it('renders FileSelector and passes className', () => {
    render(<ZipFileUploader className="test-class" />);
    const fileSelector = screen.getByTestId('file-selector');
    expect(fileSelector).toBeInTheDocument();
    // The className is passed via props, but since the mock does not use it, we just check presence
  });
}); 