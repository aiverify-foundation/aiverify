import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockDomMatrix, silentConsoleLogs } from '__mocks__/mockGlobals';
import { useEffect, useState } from 'react';
import ProjectCreatePage from 'pages/project/create';
import { getPlugins } from 'server/pluginManager';
import { MockProviders } from '__mocks__/mockProviders';
import PluginManagerType from 'src/types/pluginManager.interface';
import {
  MOCK_DATE_WIDGET_1,
  mockGqlDataMinimal,
} from '__mocks__/mockGqlResponse';
import { fmtInterpretationMAEBundleResponse } from '__mocks__/mockPlugins';
import { DataGridProps } from '@mui/x-data-grid';

jest.mock('@mui/x-data-grid', () => {
  const { DataGrid } = jest.requireActual('@mui/x-data-grid');
  return {
    ...jest.requireActual('@mui/x-data-grid'),
    DataGrid: (props: DataGridProps) => {
      return <DataGrid {...props} autoPageSize={false} />; //autoPageSize={false} to overcome rows not rendered in jsdom
    },
  };
});

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

  return (
    <div>
      <div id="aivModal" />
      <ProjectCreatePage pluginManager={plugins as PluginManagerType} />
    </div>
  );
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

      // stub date.now to return mock date, which is used as a 'key' value when widget added to canvas
      const dateNowStub = jest.fn(() => MOCK_DATE_WIDGET_1);
      const actualDateNowFn = Date.now.bind(global.Date);
      global.Date.now = dateNowStub;

      fireEvent.dragStart(maeInterWidget as Element, {
        dataTransfer: { setData: (_str: string) => undefined },
        clientX: 100,
        clientY: 200,
        screenX: -1500,
        screenY: 200,
        x: 100,
        y: 200,
      });

      fireEvent.dragOver(gridLayoutArea as Element, {
        clientX: 100,
        clientY: 200,
        screenX: 600,
        screenY: 200,
        x: 200,
        y: 200,
      });

      await waitFor(() => {
        expect(container.querySelector(GRID_ITEM_CLASSNAME)).not.toBeNull();
      });

      fireEvent.drop(gridLayoutArea as Element, {
        clientX: 100,
        clientY: 200,
        screenX: 600,
        screenY: 200,
        x: 300,
        y: 500,
      });

      //widget should be on canvas
      await waitFor(() => {
        expect(container.querySelector('.widgetContainer')).not.toBeNull();
      });

      //reset date stub
      global.Date.now = actualDateNowFn;

      const saveBtn = container.querySelector(
        'svg[data-testid="SaveIcon"]'
      ) as HTMLElement;
      await user.click(saveBtn);
      await screen.findByText(/^Project saved$/i);

      await user.click(await screen.findByText(/^Next$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );
      expect(container.querySelector('.layoutContentArea')).toMatchSnapshot(
        'Datasets/Model-Selection-Screen'
      ); // snapshot without header, because header has dynamic autosave time display
    });

    it('should select datasets, ground truth, test arguments and generate report', async () => {
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

      // stub date down to return mock date, which is used as a 'key' value when widget added to canvas
      const dateNowStub = jest.fn(() => MOCK_DATE_WIDGET_1);
      const actualDateNowFn = Date.now.bind(global.Date);
      global.Date.now = dateNowStub;

      fireEvent.dragStart(maeInterWidget as Element, {
        dataTransfer: { setData: (_str: string) => undefined },
        clientX: 100,
        clientY: 200,
        screenX: -1500,
        screenY: 200,
        x: 100,
        y: 200,
      });

      fireEvent.dragOver(gridLayoutArea as Element, {
        clientX: 100,
        clientY: 200,
        screenX: 600,
        screenY: 200,
        x: 200,
        y: 200,
      });

      await waitFor(() => {
        expect(container.querySelector(GRID_ITEM_CLASSNAME)).not.toBeNull();
      });

      fireEvent.drop(gridLayoutArea as Element, {
        clientX: 100,
        clientY: 200,
        screenX: 600,
        screenY: 200,
        x: 300,
        y: 500,
      });

      //widget should be on canvas
      await waitFor(() => {
        expect(container.querySelector('.widgetContainer')).not.toBeNull();
      });

      global.Date.now = actualDateNowFn;

      await user.click(await screen.findByText(/^Next$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );
      const chooseDatasetBtns1 = await screen.findAllByText(
        /^Choose Dataset$/i
      );
      expect(chooseDatasetBtns1.length).toBe(2);

      // Select Dataset (file picker)
      await user.click(chooseDatasetBtns1[0]);
      await screen.findByText(/^Choose the Dataset$/i);
      const datasetFile = await screen.findByText(
        /^pickle_pandas_tabular_compas_testing\.sav$/i
      );
      await waitFor(async () => {
        expect(
          container.querySelectorAll('div[aria-rowcount="3"]').length
        ).toBe(1);
      });
      expect(container.querySelectorAll('div[role="row"]').length).toBe(3);
      expect(container.querySelector('.layoutContentArea')).toMatchSnapshot(
        'Datasets/Model-Selection-Filepicker'
      ); // snapshot without header, because header has dynamic autosave time display

      await user.click(datasetFile);
      await user.click(await screen.findByText(/^Use Dataset$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );
      await screen.findByText(/^pickle_pandas_tabular_compas_testing\.sav$/i);
      const chooseDatasetBtns2 = await screen.findAllByText('Choose Dataset');
      expect(chooseDatasetBtns2.length).toBe(1);

      // Select Ground Truth Dataset (file picker)
      await user.click(chooseDatasetBtns2[0]);
      await screen.findByText(/^Choose Ground Truth Dataset$/i);
      await waitFor(async () => {
        expect(
          container.querySelectorAll('div[aria-rowcount="3"]').length
        ).toBe(1);
      });
      expect(container.querySelectorAll('div[role="row"]').length).toBe(3);
      const groundTruthFile = await screen.findByText(
        /^pickle_pandas_tabular_compas_testing\.sav$/i
      );
      await user.click(groundTruthFile);
      await user.click(await screen.findByText(/^Use Dataset$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );

      // Select Ground Truth column
      await screen.findByText(/^Select Ground Truth:$/i);
      const groundTruthSelectInput = container.querySelector(
        '.inputCard #groundTruthSelect'
      ) as HTMLElement;
      await user.click(groundTruthSelectInput);
      await screen.findByText(/^Please Select$/i);
      await screen.findByText(/^age_cat_cat$/i);
      await screen.findByText(/^sex_code$/i);
      await screen.findByText(/^race_code$/i);
      await screen.findByText(/^priors_count$/i);
      await screen.findByText(/^c_charge_degree_cat$/i);
      const selected = await screen.findByText(/^two_year_recid$/i);
      await user.click(selected);
      await waitFor(async () => {
        expect(await screen.queryByText(/^Please Select$/i)).toBeNull();
      });
      expect(await screen.queryByText(/^two_year_recid$/i)).not.toBeNull();

      // Select Model
      await user.click(await screen.findByText(/^Choose Model$/i));
      await screen.findByText(/^Choose the Model$/i);
      const modelFile = await screen.findByText(
        /^pickle_scikit_bc_compas.sav$/i
      );
      await user.click(modelFile);
      await user.click(await screen.findByText(/^Use Model$/i));
      await screen.findByText(
        /^Select the Datasets and AI Model to be tested$/i
      );
      await screen.findByText(/^pickle_scikit_bc_compas.sav$/i);

      // Enter Test Arguments
      const algoTestArgsCard = container.querySelector(
        'div[id="algocard-aiverify.stock.fairness_metrics_toolbox_for_regression:fairness_metrics_toolbox_for_regression"]'
      ) as HTMLElement;
      expect(algoTestArgsCard).not.toBeNull();
      await screen.findByText(/^Invalid Arguments$/i);
      const openBtn = algoTestArgsCard.querySelector(
        '.aivBase-button'
      ) as HTMLButtonElement;
      expect(openBtn).not.toBeNull();
      await user.click(openBtn);
      await screen.findByText(/^Sensitive Feature Names$/i);
      const sensitiveFeatureInput0 = container.querySelector(
        'input[name="root_sensitive_feature_0"]'
      ) as HTMLElement;
      await user.type(sensitiveFeatureInput0, 'race_code');
      await user.click(await screen.findByText(/^OK$/i));
      expect(await screen.queryByText(/^Sensitive Feature Names$/i)).toBeNull();
      expect(await screen.queryByText(/^Invalid Arguments$/i)).toBeNull();

      // click save
      const saveBtn = container.querySelector(
        'svg[data-testid="SaveIcon"]'
      ) as HTMLElement;
      await user.click(saveBtn);
      await screen.findByText(/^Project saved$/i);

      // Popup generate report confirmation
      await user.click(await screen.findByText(/^Next$/i));
      await screen.findByText(/^Confirm Generate Report$/i);
      expect(container.querySelector('#aivModal')).toHaveTextContent(
        'Fairness Metrics Toolbox for Regression'
      );
      await user.click(await screen.findByText(/^CANCEL$/i));
      expect(await screen.queryByText(/^Confirm Generate Report$/i)).toBeNull();
      await user.click(await screen.findByText(/^Next$/i));
      await screen.findByText(/^Confirm Generate Report$/i);
      await user.click(await screen.findByText(/^PROCEED$/i));
    });
  });
});
