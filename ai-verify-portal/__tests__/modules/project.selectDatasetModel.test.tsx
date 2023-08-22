import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockDomMatrix, silentConsoleLogs } from '__mocks__/mockGlobals';
import { useEffect, useState } from 'react';
import ProjectCreatePage from 'pages/project/create';
import { getPlugins } from 'server/pluginManager';
import { MockProviders } from '__mocks__/mockProviders';
import PluginManagerType from 'src/types/pluginManager.interface';
import { mockGqlDataMinimal } from '__mocks__/mockGqlResponse';
import { fmtInterpretationMAEBundleResponse } from '__mocks__/mockPlugins';
// import { DataGridProps } from '@mui/x-data-grid';

// jest.mock('@mui/x-data-grid', () => {
//   const { DataGrid } = jest.requireActual('@mui/x-data-grid');
//   return {
//     ...jest.requireActual('@mui/x-data-grid'),
//     DataGrid: (props: DataGridProps) => {
//       return <DataGrid {...props} disableVirtualization />; //must disable table virtualization in jest
//     },
//   };
// });

const GRID_LAYOUT_CLASSNAME = '.react-grid-layout';
const GRID_ITEM_CLASSNAME = '.react-grid-item';

function ProjectCreatePageWrapper() {
  const [plugins, setPlugins] = useState<PluginManagerType>();
  async function fetchPlugins() {
    const result = await getPlugins();
    return result;
  }
  useEffect(() => {
    (async () => {
      const fetchedPlugins = await fetchPlugins();
      setPlugins(fetchedPlugins);
    })();
  }, []);

  return <ProjectCreatePage pluginManager={plugins as PluginManagerType} />;
}

describe('Project Flow - Select Dataset And Model', () => {
  beforeAll(() => {
    // silentConsoleLogs();
    mockDomMatrix();
  });

  describe('Datasets and Model Selection Screen', () => {
    it('should render Datasets / Model selection screen', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      fetchSpy.mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve(fmtInterpretationMAEBundleResponse),
          })
        ) as jest.Mock
      );
      const user = userEvent.setup();
      const { container } = render(
        <MockProviders apolloMocks={mockGqlDataMinimal}>
          <ProjectCreatePageWrapper />
        </MockProviders>
      );
      const projNameInput: HTMLInputElement =
        await screen.findByPlaceholderText(
          /^Enter name of this project e.g. Credit Scoring Model Tests$/i
        );
      await userEvent.type(projNameInput, 'Test Project');
      const nextBtn = await screen.findByText(/^Next$/i);
      await user.click(nextBtn.parentElement as HTMLDivElement);
      await screen.findByText(/^Select Report Template$/i);
      const blankCard = await screen.findByText(/^Blank Canvas$/i);
      await userEvent.click(blankCard);
      await waitFor(() => {
        expect(container.querySelector('.card__highlighted')).toBeDefined();
      });
      await userEvent.click(nextBtn);
      await screen.queryByText(/^Design Report$/i);
      await screen.findByText(/^Interpretation \(MAE\)$/i);
      const gridLayoutArea = container.querySelector(
        GRID_LAYOUT_CLASSNAME
      ) as HTMLDivElement;
      expect(gridLayoutArea.children.length).toBe(0);
      const maeInterWidget = container.querySelector(
        '[data-test-id="draggableWidget-aiverify.stock.fairness_metrics_toolbox_for_regression:mae_interpretation"]'
      );
      fireEvent.dragStart(maeInterWidget as Element, {
        dataTransfer: { setData: (_str: string) => undefined },
        clientX: 518,
        clientY: 326,
        screenX: -1402,
        screenY: 435,
        x: 374,
        y: 218,
      });

      fireEvent.dragOver(gridLayoutArea as Element, {
        clientX: 518,
        clientY: 326,
        screenX: -1402,
        screenY: 435,
        x: 374,
        y: 218,
      });

      await waitFor(() => {
        expect(container.querySelector(GRID_ITEM_CLASSNAME)).not.toBeNull();
      });

      fireEvent.drop(gridLayoutArea as Element, {
        clientX: 518,
        clientY: 326,
        screenX: -1402,
        screenY: 435,
        x: 374,
        y: 218,
      });

      //widget should be on canvas
      await waitFor(() => {
        expect(container.querySelector('.widgetContainer')).not.toBeNull();
      });

      await user.click(await screen.findByText(/^Next$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );
      expect(container.querySelector('.layoutContentArea')).toMatchSnapshot(
        'Datasets/Model-Selection-Screen'
      ); // snapshot without header, because header has dynamic autosave time display
    });

    it('should select test Dataset', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      fetchSpy.mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            json: () => Promise.resolve(fmtInterpretationMAEBundleResponse),
          })
        ) as jest.Mock
      );
      const user = userEvent.setup();
      const { container } = render(
        <MockProviders apolloMocks={mockGqlDataMinimal}>
          <ProjectCreatePageWrapper />
        </MockProviders>
      );
      const projNameInput: HTMLInputElement =
        await screen.findByPlaceholderText(
          /^Enter name of this project e.g. Credit Scoring Model Tests$/i
        );
      await userEvent.type(projNameInput, 'Test Project');
      const nextBtn = await screen.findByText(/^Next$/i);
      await user.click(nextBtn.parentElement as HTMLDivElement);
      await screen.findByText(/^Select Report Template$/i);
      const blankCard = await screen.findByText(/^Blank Canvas$/i);
      await userEvent.click(blankCard);
      await waitFor(() => {
        expect(container.querySelector('.card__highlighted')).toBeDefined();
      });
      await userEvent.click(nextBtn);
      await screen.queryByText(/^Design Report$/i);
      await screen.findByText(/^Interpretation \(MAE\)$/i);
      const gridLayoutArea = container.querySelector(
        GRID_LAYOUT_CLASSNAME
      ) as HTMLDivElement;
      expect(gridLayoutArea.children.length).toBe(0);
      const maeInterWidget = container.querySelector(
        '[data-test-id="draggableWidget-aiverify.stock.fairness_metrics_toolbox_for_regression:mae_interpretation"]'
      );
      fireEvent.dragStart(maeInterWidget as Element, {
        dataTransfer: { setData: (_str: string) => undefined },
        clientX: 518,
        clientY: 326,
        screenX: -1402,
        screenY: 435,
        x: 374,
        y: 218,
      });

      fireEvent.dragOver(gridLayoutArea as Element, {
        clientX: 518,
        clientY: 326,
        screenX: -1402,
        screenY: 435,
        x: 374,
        y: 218,
      });

      await waitFor(() => {
        expect(container.querySelector(GRID_ITEM_CLASSNAME)).not.toBeNull();
      });

      fireEvent.drop(gridLayoutArea as Element, {
        clientX: 518,
        clientY: 326,
        screenX: -1402,
        screenY: 435,
        x: 374,
        y: 218,
      });

      //widget should be on canvas
      await waitFor(() => {
        expect(container.querySelector('.widgetContainer')).not.toBeNull();
      });

      await user.click(await screen.findByText(/^Next$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );

      const chooseDatasetBtns = await screen.findAllByText(/^Choose Dataset$/i);
      await user.click(chooseDatasetBtns[0]);
      await screen.findByText(/^Choose the Dataset$/i);
      // await screen.findByText(/^pickle_pandas_tabular_compas_testing$/i);
      await waitFor(async () => {
        expect(container.querySelectorAll('div[role="row"]').length).toBe(3);
      });
      expect(container.querySelector('.layoutContentArea')).toMatchSnapshot(
        'Temp'
      ); // snapshot without header, because header has dynamic autosave time display
    });
  });
});
