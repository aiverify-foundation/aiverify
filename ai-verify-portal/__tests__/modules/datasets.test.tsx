import { useRouter } from 'next/router';
import { render, screen } from '@testing-library/react';
import DatasetsModule from 'src/modules/assets/datasets';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('src/modules/assets/datasetList', () => () => 'DatasetListComponent');

describe('Datasets', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  it('should render the back button', () => {
    render(
      <MockProviders>
        <DatasetsModule />
      </MockProviders>
    );
    expect(screen.getByTestId('datasets-back-button'));
  });

  it('should navigate to assets page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <DatasetsModule />
      </MockProviders>
    );
    const button = screen.getByTestId('datasets-back-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets');
  });

  it('should render the add new model button', () => {
    render(
      <MockProviders>
        <DatasetsModule />
      </MockProviders>
    );
    expect(screen.getByTestId('add-new-datasets-button')).toHaveTextContent(
      'New Dataset +'
    );
  });

  it('should navigate to add new dataset page on button click', () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    const router = useRouter();
    render(
      <MockProviders>
        <DatasetsModule />
      </MockProviders>
    );
    const button = screen.getByTestId('add-new-datasets-button');
    button.click();
    expect(router.push).toHaveBeenCalledWith('/assets/newDataset');
  });
});
