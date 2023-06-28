import { useRouter } from 'next/router';
import { render, screen } from '@testing-library/react';
import NewModelModule from 'src/modules/assets/newModel';
import { act } from 'react-dom/test-utils';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('New Model', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  it('should render the back button', () => {
    render(
      <MockProviders>
        <NewModelModule />
      </MockProviders>
    );
    expect(screen.getByTestId('newmodel-back-button'));
  });

  it('should navigate to models page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <NewModelModule />
      </MockProviders>
    );
    const button = screen.getByTestId('newmodel-back-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/models');
  });

  it('should render the upload/ api option buttons', () => {
    render(
      <MockProviders>
        <NewModelModule />
      </MockProviders>
    );
    expect(screen.getByTestId('new-model-option')).toHaveTextContent(
      'Upload AI Model'
    );
    expect(screen.getByTestId('new-pipeline-option')).toHaveTextContent(
      'Upload Pipeline'
    );
  });

  it('should enable next button on upload model option selection and navigate to new model upload page on click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <NewModelModule />
      </MockProviders>
    );
    expect(screen.getByTestId('newmodel-next-button')).toHaveTextContent(
      'Next >'
    );
    expect(screen.getByTestId('newmodel-next-button')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    const option = screen.getByTestId('new-model-option');
    act(() => {
      option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(screen.getByTestId('newmodel-next-button')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
    const button = screen.getByTestId('newmodel-next-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/newModelUpload');
  });

  it('should enable next button on pipeline model option selection and navigate to new model upload page on click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <NewModelModule />
      </MockProviders>
    );
    expect(screen.getByTestId('newmodel-next-button')).toHaveTextContent(
      'Next >'
    );
    expect(screen.getByTestId('newmodel-next-button')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    const option = screen.getByTestId('new-pipeline-option');
    act(() => {
      option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(screen.getByTestId('newmodel-next-button')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
    const button = screen.getByTestId('newmodel-next-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/newPipelineUpload');
  });
});
