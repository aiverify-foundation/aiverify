import { useRouter } from 'next/router';
import { render, screen } from '@testing-library/react';
import ModelsModule from 'src/modules/assets/models';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('src/modules/assets/modelList', () => () => 'ModelListComponent');

describe('Models', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  it('should render the back button', () => {
    render(
      <MockProviders>
        <ModelsModule />
      </MockProviders>
    );
    expect(screen.getByTestId('models-back-button'));
  });

  it('should navigate to assets page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <ModelsModule />
      </MockProviders>
    );
    const button = screen.getByTestId('models-back-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets');
  });

  it('should render the add new model button', () => {
    render(
      <MockProviders>
        <ModelsModule />
      </MockProviders>
    );
    expect(screen.getByTestId('add-new-models-button')).toHaveTextContent(
      'New Model +'
    );
  });

  it('should navigate to add new model page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <ModelsModule />
      </MockProviders>
    );
    const button = screen.getByTestId('add-new-models-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/newModel');
  });
});
