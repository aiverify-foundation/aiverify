import { render, screen } from '@testing-library/react';
import AssetsModule from 'src/modules/assets/index';
import { useRouter } from 'next/router';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('Assets', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  describe('Initial Render', () => {
    it('should render the back button', () => {
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      expect(screen.getByTestId('assets-back-button'));
    });

    it('should navigate to home page on button click', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
      });
      const router = useRouter();
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      const button = screen.getByTestId('assets-back-button');
      button.click();
      expect(router.push).toHaveBeenCalledWith('/home');
    });

    it('should render the asset folder buttons', () => {
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      expect(screen.getByTestId('add-new-dataset-button')).toHaveTextContent(
        'New Dataset'
      );
      expect(screen.getByTestId('add-new-model-button')).toHaveTextContent(
        'New AI Model'
      );
      expect(screen.getByTestId('open-dataset-list-button')).toHaveTextContent(
        'Datasets'
      );
      expect(screen.getByTestId('open-model-list-button')).toHaveTextContent(
        'AI Models'
      );
    });

    it('should navigate to dataset page on button click', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
      });
      const router = useRouter();
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      const button = screen.getByTestId('open-dataset-list-button');
      button.click();
      expect(router.push).toHaveBeenCalledWith('/assets/datasets');
    });

    it('should navigate to model page on button click', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
      });
      const router = useRouter();
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      const button = screen.getByTestId('open-model-list-button');
      button.click();
      expect(router.push).toHaveBeenCalledWith('/assets/models');
    });

    it('should navigate to new dataset page on button click', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
      });
      const router = useRouter();
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      const button = screen.getByTestId('add-new-dataset-button');
      button.click();
      expect(router.push).toHaveBeenCalledWith('/assets/newDataset');
    });

    it('should navigate to new model page on button click', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
      });
      const router = useRouter();
      render(
        <MockProviders>
          <AssetsModule />
        </MockProviders>
      );
      const button = screen.getByTestId('add-new-model-button');
      button.click();
      expect(router.push).toHaveBeenCalledWith('/assets/newModel');
    });
  });
});
