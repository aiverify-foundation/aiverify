import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UploaderContainer } from '../uploaderContainer';

jest.mock('../providers', () => ({
  UploadProviders: ({ children }: any) => <div data-testid="upload-providers">{children}</div>,
}));

jest.mock('../uploader', () => ({
  Uploader: ({ className }: any) => <div data-testid="uploader" className={className}>Uploader</div>,
}));

describe('UploaderContainer', () => {
  it('wraps Uploader in UploadProviders and passes className', () => {
    render(<UploaderContainer className="test-class" />);
    const providers = screen.getByTestId('upload-providers');
    const uploader = screen.getByTestId('uploader');
    expect(providers).toBeInTheDocument();
    expect(uploader).toBeInTheDocument();
    expect(uploader).toHaveClass('test-class');
    expect(providers).toContainElement(uploader);
  });
}); 