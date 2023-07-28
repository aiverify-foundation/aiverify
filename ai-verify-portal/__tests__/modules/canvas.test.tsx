import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { silentConsoleLogs } from '__mocks__/mockGlobals';
import { mockProjectStoreForCanvasTest } from '__mocks__/mockProjectStore';
import CanvasComponent from 'src/modules/projectTemplate/canvas';

jest.mock('ai-verify-shared-library/lib', jest.mock);

describe('Canvas Component', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  describe('Initial Render', () => {
    it('should render canvas', async () => {
      const { container } = render(
        <CanvasComponent
          projectStore={mockProjectStoreForCanvasTest}
          isTemplate={false}
        />
      );
      await screen.findByText(/^Design Report$/i);
    });
  });
});
