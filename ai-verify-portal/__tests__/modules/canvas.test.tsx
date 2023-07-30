import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { silentConsoleLogs } from '__mocks__/mockGlobals';
import { mockProjectStoreForCanvasTest } from '__mocks__/mockProjectStore';
import CanvasComponent from 'src/modules/projectTemplate/canvas';

describe('Canvas Component', () => {
  beforeAll(() => {
    silentConsoleLogs();
  });

  describe('Initial Render', () => {
    it('should render Design Report screen with 1 plugin (2 widgets) on leftpanel', async () => {
      render(
        <CanvasComponent
          projectStore={mockProjectStoreForCanvasTest}
          isTemplate={false}
        />
      );
      await screen.findByText(/^Design Report$/i);
      await screen.findByText(
        /^Drag report widgets from the left panel onto the design canvas.$/i
      );
      await screen.findByText(/^Widget Properties$/i);
      await screen.findByText(/^Global Variables$/i);
      await screen.findByText(/^AI Verify Stock Decorators$/i);
      await screen.findByText(/^Divider$/i);
      await screen.findByText(/^Header 1$/i);
    });
  });

  describe('Report Widgets Panel', () => {
    it('should filter widgets by text search', async () => {
      render(
        <CanvasComponent
          projectStore={mockProjectStoreForCanvasTest}
          isTemplate={false}
        />
      );
      const searchWidgetInput = await screen.findByPlaceholderText(
        /^Search Report Widgets$/i
      );
      expect(screen.findByText(/^Divider$/i)).toBeDefined();
      expect(screen.findByText(/^Header 1$/i)).toBeDefined();
      await userEvent.type(searchWidgetInput, 'head');
      await waitFor(async () => {
        expect(await screen.queryByText(/^Divider$/i)).toBeNull();
        expect(await screen.queryByText(/^Header 1$/i)).not.toBeNull();
      });
    });
  });
});
