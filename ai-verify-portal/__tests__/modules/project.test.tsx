import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockDomMatrix, silentConsoleLogs } from '__mocks__/mockGlobals';
import { useEffect, useState } from 'react';
import ProjectCreatePage from 'pages/project/create';
import { getPlugins } from 'server/pluginManager';
import { MockProviders } from '__mocks__/mockProviders';
import PluginManagerType from 'src/types/pluginManager.interface';
import { mockGqlData, mockGqlDataMinimal } from '__mocks__/mockGqlResponse';
import { fmtInterpretationMAEBundleResponse } from '__mocks__/mockPlugins';

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

describe('Project Flow', () => {
  beforeAll(() => {
    silentConsoleLogs();
    mockDomMatrix();
  });

  describe('Project Information Capture and Select Template screens', () => {
    it('should render Project Information Capture screen', async () => {
      const { container } = render(
        <MockProviders>
          <ProjectCreatePageWrapper />
        </MockProviders>
      );
      await screen.findByText(/^Create a new AI Testing Project$/i);
      expect(container).toMatchSnapshot('Project Information Capture Screen');
    });

    it('should NOT go to Select Report Template if Project Name is empty ', async () => {
      const user = userEvent.setup();
      render(
        <MockProviders>
          <ProjectCreatePageWrapper />
        </MockProviders>
      );
      await screen.findByText(/^Create a new AI Testing Project$/i);
      const nextBtn = await screen.findByText(/^Next$/i);
      await user.click(nextBtn.parentElement as HTMLDivElement);
      await waitFor(() => {
        expect(screen.queryByText(/^Select Report Template$/i)).toBeNull();
      });
    });

    it('should go to Select Report Template if Project Name is filled ', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <MockProviders>
          <ProjectCreatePageWrapper />
        </MockProviders>
      );
      await screen.findByText(/^Create a new AI Testing Project$/i);
      const projNameInput: HTMLInputElement =
        await screen.findByPlaceholderText(
          /^Enter name of this project e.g. Credit Scoring Model Tests$/i
        );
      const descInput: HTMLInputElement = await screen.findByPlaceholderText(
        /^Enter Project Description e.g. To test whether the classification model is fair towards all groups with respect to gender, robust against unexpected input and explainable.$/i
      );
      const reportTitleInput: HTMLInputElement =
        await screen.findByPlaceholderText(
          /^Enter the title to be used for the generated report$/i
        );
      const companyInput: HTMLInputElement = await screen.findByPlaceholderText(
        /^Enter the company name$/i
      );
      const useProjectNameCheckbox = container.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      await userEvent.type(projNameInput, 'Test Project');
      await userEvent.type(descInput, 'Test Description');
      await userEvent.type(reportTitleInput, 'Test Report Name');
      await userEvent.type(companyInput, 'Test Company Pte Ltd');
      await userEvent.click(useProjectNameCheckbox);
      const nextBtn = await screen.findByText(/^Next$/i);
      await user.click(nextBtn.parentElement as HTMLDivElement);
      await waitFor(() => {
        expect(reportTitleInput.value).toBe(projNameInput.value);
        expect(screen.queryByText(/^Select Report Template$/i)).not.toBeNull();
      });
      expect(container).toMatchSnapshot('Select Report Template Screen');
    });
  });

  describe('Report Designer Screen', () => {
    it('should render Report Designer screen', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <MockProviders apolloMocks={mockGqlData}>
          <ProjectCreatePageWrapper />
        </MockProviders>
      );
      await screen.findByText(/^Create a new AI Testing Project$/i);
      const projNameInput: HTMLInputElement =
        await screen.findByPlaceholderText(
          /^Enter name of this project e.g. Credit Scoring Model Tests$/i
        );
      const descInput: HTMLInputElement = await screen.findByPlaceholderText(
        /^Enter Project Description e.g. To test whether the classification model is fair towards all groups with respect to gender, robust against unexpected input and explainable.$/i
      );
      const reportTitleInput: HTMLInputElement =
        await screen.findByPlaceholderText(
          /^Enter the title to be used for the generated report$/i
        );
      const companyInput: HTMLInputElement = await screen.findByPlaceholderText(
        /^Enter the company name$/i
      );
      await userEvent.type(projNameInput, 'Test Project');
      await userEvent.type(descInput, 'Test Description');
      await userEvent.type(reportTitleInput, 'Test Report Name');
      await userEvent.type(companyInput, 'Test Company Pte Ltd');
      const nextBtn = await screen.findByText(/^Next$/i);
      await user.click(nextBtn.parentElement as HTMLDivElement);
      await screen.findByText(/^Select Report Template$/i);
      await screen.findByText(
        /^No Templates Found. Select 'Blank Canvas' and click 'Next'$/i
      );
      const blankCard = await screen.findByText(/^Blank Canvas$/i);
      await userEvent.click(blankCard);
      await waitFor(() => {
        expect(container.querySelector('.card__highlighted')).toBeDefined();
      });
      await userEvent.click(nextBtn);
      await screen.queryByText(/^Design Report$/i);
      await screen.findByText(/^Test Project$/i);
      expect(container.querySelector('.layoutContentArea')).toMatchSnapshot(
        'Report Designer Screen'
      ); // snapshot without header, because header has dynamic autosave time display
    });

    it('should filter widgets by text search', async () => {
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
      await screen.queryByText(/^AI Verify Stock Decorators$/i);
      await screen.queryByText(/^Fairness for Regression$/i);
      await screen.queryByText(/^Test Plugin$/i);
      const searchInput: HTMLInputElement = await screen.findByPlaceholderText(
        /^Search Report Widgets$/i
      );
      await user.type(searchInput, 'MAE');
      expect(
        await screen.queryByText(/^AI Verify Stock Decorators$/i)
      ).toBeNull();
      expect(await screen.queryByText(/^Test Plugin$/i)).toBeNull();
      await screen.findByText(/^Fairness for Regression$/i);
      await screen.findByText(/^Interpretation \(MAE\)$/i);
    });

    it('should place widget on canvas, highlight the widget and display widget name and delete button', async () => {
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

      await waitFor(() => {
        expect(container.querySelector('.widgetContainer')).not.toBeNull();
      });

      expect(gridLayoutArea.children.length).toBe(1);
      expect(container.querySelector('.widgetContainer'))
        .toMatchInlineSnapshot(`
          <div
            class="widgetContainer"
          >
            <div
              style="width: 100%;"
            >
              <p>
                <b>
                  Results
                </b>
              </p>
              <p>
                The difference between 
                <b>
                  <i>
                    gender:0,age:21
                  </i>
                </b>
                 (group with highest value) and 
                <b>
                  <i>
                    gender:0,age:18
                  </i>
                </b>
                 (group with lowest value) is 
                <b>
                  2607.2669363473
                </b>
                 for 
                <i>
                  Mean Absolute Error Parity
                </i>
                . In an ideal situation, the parity should be close to 
                0
                .
              </p>
            </div>
          </div>
        `);

      expect(container.querySelector('.menuContainer')).not.toBeNull();
      expect(
        (container.querySelector('.gridItem_title') as HTMLElement).textContent
      ).toBe('Fairness for Regression - Interpretation (MAE)');
      expect(container.querySelector('.gridItem_btnWrapper')).not.toBeNull();
      expect(container.querySelector('.canvas_item_highlight')).not.toBeNull();
      await user.click(
        await screen.findByPlaceholderText(/^Search Report Widgets$/i)
      );
      expect(container.querySelector('.menuContainer')).toBeNull();
      expect(container.querySelector('.gridItem_title')).toBeNull();
      expect(container.querySelector('.gridItem_btnWrapper')).toBeNull();
      expect(container.querySelector('.canvas_item_highlight')).toBeNull();
    }, 20000);
  });
});
