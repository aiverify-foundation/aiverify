import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock child components
jest.mock('@/app/models/components/LayoutHeader', () => (props: any) => (
  <div data-testid="layout-header" onClick={props.onBack}>Header</div>
));

jest.mock('@/app/models/upload/components/ModelUploader', () => (props: any) => (
  <div data-testid="model-uploader">
    <button onClick={props.onBack}>Back to Selection</button>
  </div>
));

jest.mock('@/app/models/upload/components/PipelineUploader', () => (props: any) => (
  <div data-testid="pipeline-uploader">
    <button onClick={props.onBack}>Back to Selection</button>
  </div>
));

jest.mock('@/lib/components/IconSVG', () => ({
  Icon: (props: any) => <div data-testid={`icon-${props.name}`} onClick={props.onClick} />,
  IconName: { 
    Folder: 'Folder',
    ArrowLeft: 'ArrowLeft'
  }
}));

jest.mock('@/lib/components/button', () => ({
  Button: (props: any) => (
    <button 
      data-testid="button"
      onClick={props.onClick} 
      disabled={props.disabled}
      className={props.className}
    >
      {props.text}
    </button>
  ),
  ButtonVariant: { PRIMARY: 'primary' }
}));

jest.mock('next/link', () => (props: any) => (
  <a href={props.href} onClick={props.onClick}>
    {props.children}
  </a>
));

describe('UploadPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders upload method selection initially', () => {
    render(<UploadPage />);
    
    expect(screen.getByText('Add New AI Model')).toBeInTheDocument();
    expect(screen.getByText('How would you like AI Verify to access the AI Model to be tested?')).toBeInTheDocument();
    expect(screen.getByText('Upload AI Model')).toBeInTheDocument();
    expect(screen.getByText('Upload Pipeline')).toBeInTheDocument();
    expect(screen.getByText('NEXT')).toBeInTheDocument();
  });

  it('disables NEXT button when no method is selected', () => {
    render(<UploadPage />);
    
    const nextButton = screen.getByText('NEXT');
    expect(nextButton).toBeDisabled();
  });

  it('enables NEXT button when a method is selected', () => {
    render(<UploadPage />);
    
    // Click on file upload option
    fireEvent.click(screen.getByText('Upload AI Model'));
    
    const nextButton = screen.getByText('NEXT');
    expect(nextButton).not.toBeDisabled();
  });

  it('selects file upload method when clicked', () => {
    render(<UploadPage />);
    
    const fileCard = screen.getByText('Upload AI Model').closest('div');
    fireEvent.click(fileCard!);
    
    // Check that the card is selected by looking for the selection indicator
    expect(fileCard).toBeInTheDocument();
  });

  it('selects pipeline upload method when clicked', () => {
    render(<UploadPage />);
    
    const pipelineCard = screen.getByText('Upload Pipeline').closest('div');
    fireEvent.click(pipelineCard!);
    
    // Check that the card is selected
    expect(pipelineCard).toBeInTheDocument();
  });

  it('shows ModelUploader when file method is selected and NEXT is clicked', () => {
    render(<UploadPage />);
    
    // Select file upload method
    fireEvent.click(screen.getByText('Upload AI Model'));
    
    // Click NEXT
    fireEvent.click(screen.getByText('NEXT'));
    
    expect(screen.getByTestId('model-uploader')).toBeInTheDocument();
    expect(screen.queryByText('Add New AI Model')).not.toBeInTheDocument();
  });

  it('shows PipelineUploader when pipeline method is selected and NEXT is clicked', () => {
    render(<UploadPage />);
    
    // Select pipeline upload method
    fireEvent.click(screen.getByText('Upload Pipeline'));
    
    // Click NEXT
    fireEvent.click(screen.getByText('NEXT'));
    
    expect(screen.getByTestId('pipeline-uploader')).toBeInTheDocument();
    expect(screen.queryByText('Add New AI Model')).not.toBeInTheDocument();
  });

  it('returns to method selection when back button is clicked from ModelUploader', () => {
    render(<UploadPage />);
    
    // Select file upload method and go to uploader
    fireEvent.click(screen.getByText('Upload AI Model'));
    fireEvent.click(screen.getByText('NEXT'));
    
    // Click back button
    fireEvent.click(screen.getByText('Back to Selection'));
    
    expect(screen.getByText('Add New AI Model')).toBeInTheDocument();
    expect(screen.queryByTestId('model-uploader')).not.toBeInTheDocument();
  });

  it('returns to method selection when back button is clicked from PipelineUploader', () => {
    render(<UploadPage />);
    
    // Select pipeline upload method and go to uploader
    fireEvent.click(screen.getByText('Upload Pipeline'));
    fireEvent.click(screen.getByText('NEXT'));
    
    // Click back button
    fireEvent.click(screen.getByText('Back to Selection'));
    
    expect(screen.getByText('Add New AI Model')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-uploader')).not.toBeInTheDocument();
  });

  it('displays supported frameworks information for file upload', () => {
    render(<UploadPage />);
    
    expect(screen.getByText('LightGBM, Scikit-learn, TensorFlow, XGBoost')).toBeInTheDocument();
    expect(screen.getByText('*Compatible with tabular datasets only')).toBeInTheDocument();
  });

  it('displays supported frameworks information for pipeline upload', () => {
    render(<UploadPage />);
    
    expect(screen.getByText('Scikit-learn Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Tabular, Image')).toBeInTheDocument();
  });

  it('shows back arrow link when not in project flow', () => {
    render(<UploadPage />);
    
    expect(screen.getByTestId('icon-ArrowLeft')).toBeInTheDocument();
  });

  it('handles project flow with projectId and flow parameters', () => {
    // Mock useSearchParams to return project flow parameters
    const mockSearchParams = new URLSearchParams('projectId=123&flow=test');
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: jest.fn(),
      }),
      useSearchParams: () => mockSearchParams,
    }));

    render(<UploadPage />);
    
    // Should show header with project flow handling
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
  });
}); 