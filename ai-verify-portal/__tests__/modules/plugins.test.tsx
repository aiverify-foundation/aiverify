import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PluginsModule from 'src/modules/plugins/index';
import * as APIs from 'src/modules/plugins/api/plugins';
import * as algoAPIs from 'src/modules/plugins/api/algorithms';
import {
  algoPackageDependencyStatusResponse,
  emptyListResponse,
  installPluginResponse,
  pluginsListResponse,
} from '__mocks__/plugins';
import { MockProviders } from '__mocks__/mockProviders';
import { silentConsoleLogs } from '__mocks__/mockGlobals';

jest.mock('src/modules/plugins/api/plugins', () => ({
  __esModule: true,
  ...jest.requireActual('src/modules/plugins/api/plugins'),
}));
jest.mock('src/modules/plugins/api/algorithms', () => ({
  __esModule: true,
  ...jest.requireActual('src/modules/plugins/api/algorithms'),
}));

describe('Plugins Manager', () => {
  const fetchAllPluginsSpy = jest.spyOn(APIs, 'fetchAllPlugins');
  const uploadPluginSpy = jest.spyOn(APIs, 'uploadPlugin');
  const deletePluginSpy = jest.spyOn(APIs, 'deletePlugin');
  const getPythonPackageDependencyStatusSpy = jest.spyOn(
    algoAPIs,
    'getPythonPackageDependencyStatus'
  );

  beforeAll(() => {
    silentConsoleLogs();
  });

  afterEach(() => {
    fetchAllPluginsSpy.mockReset();
    uploadPluginSpy.mockReset();
    deletePluginSpy.mockReset();
    getPythonPackageDependencyStatusSpy.mockReset();
  });

  describe('Initial Render', () => {
    it('should fetch all plugins on render and sort by Installed Date (asc)', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByText(/^Partial Dependence Plot$/i);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      const pluginsListElements = Array.from(pluginsListNodes);
      const pluginNamesAndInstalledDate: [string, string][] =
        pluginsListElements.map((el) => {
          const header = el.querySelector('h3') as Element;
          const dateDiv = el.querySelector(
            '.listItem_installedDate'
          ) as Element;
          return [header.textContent as string, dateDiv.textContent as string];
        });
      expect(fetchAllPluginsSpy).toBeCalledTimes(1);
      expect(pluginsListElements.length).toEqual(6);
      expect(pluginNamesAndInstalledDate[0][0]).toEqual(
        'Partial Dependence Plot'
      );
      expect(pluginNamesAndInstalledDate[1][0]).toEqual(
        'AI Verify Stock Decorators'
      );
      expect(pluginNamesAndInstalledDate[2][0]).toEqual(
        'Widgets for Fairness Metrics Toolbox'
      );
      expect(pluginNamesAndInstalledDate[3][0]).toEqual(
        'AI Verify Process Checklist'
      );
      expect(pluginNamesAndInstalledDate[4][0]).toEqual(
        'fairness metrics toolbox for classification'
      );
      expect(pluginNamesAndInstalledDate[5][0]).toEqual(
        'Widgets for SHAP toolbox'
      );
      await waitFor(() => {
        expect(container.querySelector('.listItem__selected')).toBeTruthy();
      });
      const selectedPlugin = container
        .querySelector('.listItem__selected')
        ?.querySelector('h3') as Element;
      expect(selectedPlugin.textContent).toBe('Partial Dependence Plot');
    });

    it('should display details of first plugin on plugins list', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByTestId('pluginDetailsPanel');
      const pluginDetailsHeader = container.querySelector(
        '#detailsHead > h2'
      ) as HTMLHeadingElement;
      expect(pluginDetailsHeader.textContent).toEqual(
        'Partial Dependence Plot'
      );
    });

    it('should display "no plugins found" when list is empty', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByText(/No plugins found/i);
      expect(screen.queryByText('No plugins found')).toBeTruthy();
    });
  });

  describe('Quick Filters, Sort and Search', () => {
    it('should render quick filters, search and sort elements', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      expect(screen.getByText('Plugin Manager')).toBeTruthy();
      await screen.findByText(/Sort by/i);
      expect(screen.queryByText('Sort by')).toBeTruthy();
      expect(screen.queryByText('Filter By')).toBeTruthy();
      expect(screen.queryByPlaceholderText('Search plugins')).toBeTruthy();
      expect(screen.queryByText('Install Plugin')).toBeTruthy();
    });

    it('should show sort by menu when menu clicked', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByText(/Sort by/i);
      const sortMenu = container.querySelector('#pluginsSortMenu') as Element;
      expect(sortMenu).toBeTruthy();
      expect(screen.queryByText('Installed Date (asc)')).toBeTruthy();
      expect(screen.queryByText('Installed Date (desc)')).toBeNull();
      expect(screen.queryByText('Plugin Name (asc)')).toBeNull();
      expect(screen.queryByText('Plugin Name (desc)')).toBeNull();
      await userEvent.click(sortMenu);
      expect(screen.queryByText('Installed Date (desc)')).toBeTruthy();
      expect(screen.queryByText('Plugin Name (asc)')).toBeTruthy();
      expect(screen.queryByText('Plugin Name (desc)')).toBeTruthy();
    });

    it('should sort by Installed Date (desc) ', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByText(/^Partial Dependence Plot$/i);
      const sortMenu = container.querySelector('#pluginsSortMenu') as Element;
      await userEvent.click(sortMenu);
      const sortOption = screen.queryByText('Installed Date (desc)') as Element;
      await userEvent.click(sortOption);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      const pluginsListElements = Array.from(pluginsListNodes);
      const pluginNamesAndInstalledDate: [string, string][] =
        pluginsListElements.map((el) => {
          const header = el.querySelector('h3') as Element;
          const dateDiv = el.querySelector(
            '.listItem_installedDate'
          ) as Element;
          return [header.textContent as string, dateDiv.textContent as string];
        });
      expect(pluginNamesAndInstalledDate[0][0]).toEqual(
        'Widgets for SHAP toolbox'
      );
      expect(pluginNamesAndInstalledDate[1][0]).toEqual(
        'fairness metrics toolbox for classification'
      );
      expect(pluginNamesAndInstalledDate[2][0]).toEqual(
        'AI Verify Process Checklist'
      );
      expect(pluginNamesAndInstalledDate[3][0]).toEqual(
        'Widgets for Fairness Metrics Toolbox'
      );
      expect(pluginNamesAndInstalledDate[4][0]).toEqual(
        'AI Verify Stock Decorators'
      );
      expect(pluginNamesAndInstalledDate[5][0]).toEqual(
        'Partial Dependence Plot'
      );
    });

    it('should sort by Plugin Name (asc) ', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByText(/^Partial Dependence Plot$/i);
      const sortMenu = container.querySelector('#pluginsSortMenu') as Element;
      await userEvent.click(sortMenu);
      const sortOption = screen.queryByText('Plugin Name (asc)') as Element;
      await userEvent.click(sortOption);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      const pluginsListElements = Array.from(pluginsListNodes);
      const pluginNamesAndInstalledDate: [string, string][] =
        pluginsListElements.map((el) => {
          const header = el.querySelector('h3') as Element;
          const dateDiv = el.querySelector(
            '.listItem_installedDate'
          ) as Element;
          return [header.textContent as string, dateDiv.textContent as string];
        });
      expect(pluginNamesAndInstalledDate[0][0]).toEqual(
        'AI Verify Process Checklist'
      );
      expect(pluginNamesAndInstalledDate[1][0]).toEqual(
        'AI Verify Stock Decorators'
      );
      expect(pluginNamesAndInstalledDate[2][0]).toEqual(
        'fairness metrics toolbox for classification'
      );
      expect(pluginNamesAndInstalledDate[3][0]).toEqual(
        'Partial Dependence Plot'
      );
      expect(pluginNamesAndInstalledDate[4][0]).toEqual(
        'Widgets for Fairness Metrics Toolbox'
      );
      expect(pluginNamesAndInstalledDate[5][0]).toEqual(
        'Widgets for SHAP toolbox'
      );
    });

    it('should sort by Plugin Name (desc) ', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await screen.findByText(/^Partial Dependence Plot$/i);
      const sortMenu = container.querySelector('#pluginsSortMenu') as Element;
      await userEvent.click(sortMenu);
      const sortOption = screen.queryByText('Plugin Name (desc)') as Element;
      await userEvent.click(sortOption);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      const pluginsListElements = Array.from(pluginsListNodes);
      const pluginNamesAndInstalledDate: [string, string][] =
        pluginsListElements.map((el) => {
          const header = el.querySelector('h3') as Element;
          const dateDiv = el.querySelector(
            '.listItem_installedDate'
          ) as Element;
          return [header.textContent as string, dateDiv.textContent as string];
        });
      expect(pluginNamesAndInstalledDate[0][0]).toEqual(
        'Widgets for SHAP toolbox'
      );
      expect(pluginNamesAndInstalledDate[1][0]).toEqual(
        'Widgets for Fairness Metrics Toolbox'
      );
      expect(pluginNamesAndInstalledDate[2][0]).toEqual(
        'Partial Dependence Plot'
      );
      expect(pluginNamesAndInstalledDate[3][0]).toEqual(
        'fairness metrics toolbox for classification'
      );
      expect(pluginNamesAndInstalledDate[4][0]).toEqual(
        'AI Verify Stock Decorators'
      );
      expect(pluginNamesAndInstalledDate[5][0]).toEqual(
        'AI Verify Process Checklist'
      );
    });

    it('should filter plugins by text search - match in plugin name', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const searchInput = screen.queryByPlaceholderText(
        'Search plugins'
      ) as HTMLInputElement;
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      expect(
        await screen.findAllByText(/^AI Verify Process Checklist$/i)
      ).toHaveLength(1);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(pluginsListNodes.length).toEqual(6);
      await userEvent.type(searchInput, 'veri');
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^AI Verify Process Checklist$/i)
        ).toHaveLength(2);
      });
      expect(
        screen.queryAllByText(/^AI Verify Stock Decorators$/i)
      ).toHaveLength(1);
      expect(screen.queryByText(/^Partial Dependence Plot$/i)).toBeNull();
      const filteredPluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(filteredPluginsListNodes).toHaveLength(2);
      await userEvent.click(
        screen.queryByTestId('clearSearchInputIcon') as Element
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      expect(
        await screen.findAllByText(/^AI Verify Process Checklist$/i)
      ).toHaveLength(1);
      const clearSearchPluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(clearSearchPluginsListNodes.length).toEqual(6);
    });

    it('should filter plugins by text search - match in widget name', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const searchInput = screen.queryByPlaceholderText(
        'Search plugins'
      ) as HTMLInputElement;
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      expect(
        await screen.findAllByText(/^Widgets For Fairness Metrics Toolbox$/i)
      ).toHaveLength(1);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(pluginsListNodes.length).toEqual(6);
      await userEvent.type(searchInput, 'false');
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Widgets For Fairness Metrics Toolbox$/i)
        ).toHaveLength(2);
      });
      const filteredPluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(filteredPluginsListNodes).toHaveLength(1);
    });

    it('should filter plugins by text search - match in plugin description', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const searchInput = screen.queryByPlaceholderText(
        'Search plugins'
      ) as HTMLInputElement;
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      expect(
        await screen.findAllByText(/^Widgets For Fairness Metrics Toolbox$/i)
      ).toHaveLength(1);
      const pluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(pluginsListNodes.length).toEqual(6);
      await userEvent.type(searchInput, '(FMT)');
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Widgets For Fairness Metrics Toolbox$/i)
        ).toHaveLength(2);
      });
      expect(
        await screen.findAllByText(
          /^Fairness Metrics Toolbox For Classification$/i
        )
      ).toHaveLength(1);
      const filteredPluginsListNodes =
        container.querySelectorAll<Element>('.pluginList-card');
      expect(filteredPluginsListNodes).toHaveLength(2);
    });

    //TODO - assert filter
  });

  describe('Install Plugin', () => {
    it('should show install plugin confirmation modal dialog when file is selected', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const fileName = 'mockplugin.zip';
      const pluginFileInput = await screen.findByTestId<HTMLInputElement>(
        'pluginFileInput'
      );
      const mockFile = new File(['---'], fileName, { type: 'application/zip' });
      await userEvent.upload(pluginFileInput, mockFile);
      expect(pluginFileInput.files as FileList).toHaveLength(1);
      expect((pluginFileInput.files as FileList)[0]).toBe(mockFile);
      await screen.findByText(fileName);
      expect(screen.queryByText('Install')).toBeTruthy();
      expect(screen.queryByText('Cancel')).toBeTruthy();
      expect(screen.queryByText(/\([0-9.]* kb\)/i)).toBeTruthy();
    });

    it('should install plugin when "Install" button is clicked and show success message', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      uploadPluginSpy.mockResolvedValueOnce(installPluginResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const fileName = 'mockplugin.zip';
      const pluginFileInput = await screen.findByTestId<HTMLInputElement>(
        'pluginFileInput'
      );
      const mockFile = new File(['---'], fileName, { type: 'application/zip' });
      await userEvent.upload(pluginFileInput, mockFile);
      const installBtn = await screen.findByText('Install');
      await userEvent.click(installBtn);
      expect(uploadPluginSpy).toHaveBeenCalledWith(mockFile);
      expect(uploadPluginSpy).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText(/Plugin was successfully installed/i)
      ).toBeTruthy();
      const okBtn = await screen.findByText(/ok/i);
      await userEvent.click(okBtn);
      expect(
        screen.queryByText(/Plugin was successfully installed/i)
      ).toBeNull();
      await waitFor(() => expect(fetchAllPluginsSpy).toHaveBeenCalledTimes(2));
    });

    it('should display error modal dialog if selected file mimetype is not "zip" type', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      uploadPluginSpy.mockResolvedValueOnce(installPluginResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const fileName = 'mockplugin.zip';
      const pluginFileInput = await screen.findByTestId<HTMLInputElement>(
        'pluginFileInput'
      );
      const mockFile = new File(['---'], fileName, { type: 'image/png' });
      await userEvent.upload(pluginFileInput, mockFile, { applyAccept: false });
      expect(pluginFileInput.files as FileList).toHaveLength(1);
      expect(screen.queryByText(/Unable to install plugin/i)).toBeTruthy();
      expect(uploadPluginSpy).not.toHaveBeenCalled();
    });

    it('should display error modal dialog if selected file filename extension is not ".zip"', async () => {
      fetchAllPluginsSpy.mockResolvedValue(emptyListResponse);
      uploadPluginSpy.mockResolvedValueOnce(installPluginResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const fileName = 'mock.png';
      const pluginFileInput = await screen.findByTestId<HTMLInputElement>(
        'pluginFileInput'
      );
      const mockFile = new File(['---'], fileName, { type: 'application/zip' });
      await userEvent.upload(pluginFileInput, mockFile, { applyAccept: false });
      expect(pluginFileInput.files as FileList).toHaveLength(1);
      expect(screen.queryByText(/Unable to install plugin/i)).toBeTruthy();
      expect(uploadPluginSpy).not.toHaveBeenCalled();
    });
  });

  describe('Plugins List Card and Plugin Details', () => {
    it('should display correct information on list card', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      const aivPChecklistCardHeading = (await screen.findByText(
        /AI Verify Process Checklist/i
      )) as Element;
      const aivPChecklistCard =
        aivPChecklistCardHeading.parentElement as Element;
      expect(aivPChecklistCard).toMatchInlineSnapshot(`
        <div
          class="pluginList-card listItem"
        >
          <h3
            class="value_name"
          >
            AI Verify Process Checklist
          </h3>
          <div
            class="content"
          >
            <div
              style="min-width: 240px;"
            >
              <div
                class="row"
              >
                <div
                  class="valueDisplay"
                >
                  <div
                    class="label"
                  >
                    Version:
                  </div>
                  <div
                    class="value"
                  >
                    0.1.0
                  </div>
                </div>
              </div>
              <div
                class="row"
              >
                <div
                  class="valueDisplay"
                >
                  <div
                    class="label"
                  >
                    Installed on:
                  </div>
                  <div
                    class="value listItem_installedDate"
                  >
                    27/03/2023, 16:02:58
                  </div>
                </div>
              </div>
              <div
                class="row"
              >
                <div
                  class="valueDisplay"
                >
                  <div
                    class="label"
                  >
                    Author:
                  </div>
                  <div
                    class="value"
                  >
                    Leong Peck Yoke
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div
                class="componentCounts"
              >
                <div>
                  widgets: 
                  <span
                    class="count"
                  >
                    2
                  </span>
                </div>
                <div>
                  input blocks:
                   
                  <span
                    class="count"
                  >
                    2
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    it('should highlight selected plugin and display the plugin details when clicked', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      const listCardHeading = (await screen.findByText(
        /AI Verify Process Checklist/i
      )) as Element;
      const listCard = listCardHeading.parentElement as Element;
      expect(listCard.classList.contains('listItem__selected')).toBe(false);
      await userEvent.click(listCard);
      expect(listCard.classList.contains('listItem__selected')).toBe(true);
    });

    it('should display tabs and number of components', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      const listCardHeading = (await screen.findByText(
        /AI Verify Process Checklist/i
      )) as Element;
      const listCard = listCardHeading.parentElement as Element;
      await userEvent.click(listCard);
      const headings = (await screen.findAllByText(
        /^AI Verify Process Checklist$/
      )) as Element[];
      expect(headings).toHaveLength(2);
      const tabBtns = container.querySelectorAll<HTMLElement>('.tabBtn');
      expect(tabBtns).toHaveLength(2);
      expect(tabBtns[0].textContent).toBe('Widgets2');
      expect(tabBtns[1].textContent).toBe('Input Blocks2');
    });

    it('should display plugin details under tabs', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const { container } = render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      const listCardHeading = (await screen.findByText(
        /AI Verify Process Checklist/i
      )) as Element;
      const listCard = listCardHeading.parentElement as Element;
      await userEvent.click(listCard);
      (await screen.findAllByText(
        /^AI Verify Process Checklist$/
      )) as Element[];
      const tabBtns = container.querySelectorAll<HTMLElement>('.tabBtn');
      expect(
        screen.queryByText(/^Explainability Process Checklist Answers$/i)
      ).toBeTruthy();
      expect(
        screen.queryByText(/^Fairness Process Checklist Answers$/i)
      ).toBeTruthy();
      expect(
        screen.queryByText(/^Explainability Process Checklist 0.1.0$/i)
      ).toBeNull();
      expect(
        screen.queryByText(/^Fairness Process Checklist 0.1.0$/i)
      ).toBeNull();
      const wDetailsHeading = screen.queryByText(
        /^Explainability Process Checklist Answers$/i
      ) as Element;
      const widgetDetailsCard = wDetailsHeading.parentElement;
      expect(widgetDetailsCard).toMatchInlineSnapshot(`
        <div
          style="position: relative;"
        >
          <h2
            class="detailsHeading"
          >
            Explainability Process Checklist Answers
          </h2>
          <div
            style="position: absolute; right: 20px; top: 15px;"
          >
            <div
              class="MuiChip-root MuiChip-outlined MuiChip-sizeMedium MuiChip-colorSuccess MuiChip-outlinedSuccess css-gjv9n6-MuiChip-root"
            >
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiChip-icon MuiChip-iconMedium MuiChip-iconColorSuccess css-i4bv87-MuiSvgIcon-root"
                data-testid="CheckCircleIcon"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              <span
                class="MuiChip-label MuiChip-labelMedium css-6od3lo-MuiChip-label"
              >
                Dependencies OK
              </span>
            </div>
          </div>
        </div>
        `);

      await userEvent.click(tabBtns[1]);
      expect(
        screen.queryByText(/^Explainability Process Checklist Answers$/i)
      ).toBeNull();
      expect(
        screen.queryByText(/^Fairness Process Checklist Answers$/i)
      ).toBeNull();
      expect(
        screen.queryByText(/^Explainability Process Checklist 0.1.0$/i)
      ).toBeTruthy();
      expect(
        screen.queryByText(/^Fairness Process Checklist 0.1.0$/i)
      ).toBeTruthy();
      const ibDetailsHeading = screen.queryByText(
        /^Explainability Process Checklist 0.1.0$/i
      ) as Element;
      const iblockDetailsCard = ibDetailsHeading.parentElement;
      expect(iblockDetailsCard).toMatchInlineSnapshot(`
        <div
          class="pluginDetails-card componentCard"
        >
          <h2
            class="detailsHeading"
          >
            Explainability Process Checklist
             
            0.1.0
          </h2>
          <p
            class="componentDesc"
          >
            Process checklist for Explainability principle
          </p>
          <div
            class="valueDisplay"
          >
            <div
              class="label"
            >
              GID:
            </div>
            <div
              class="value"
              style="color: rgb(153, 30, 102);"
            >
              aiverify.stock.process-checklist:explainability-process-checklist
            </div>
          </div>
          <div
            class="valueDisplay"
          >
            <div
              class="label"
            >
              CID:
            </div>
            <div
              class="value"
            >
              explainability-process-checklist
            </div>
          </div>
          <div
            class="valueDisplay"
          >
            <div
              class="label"
            >
              Version:
            </div>
            <div
              class="value"
            >
              0.1.0
            </div>
          </div>
          <div
            class="valueDisplay"
          >
            <div
              class="label"
            >
              Installed on:
            </div>
            <div
              class="value"
            >
              27/03/2023, 16:02:58
            </div>
          </div>
          <div
            class="valueDisplay"
          >
            <div
              class="label"
            >
              Author:
            </div>
            <div
              class="value"
            >
              Leong Peck Yoke
            </div>
          </div>
        </div>
        `);
    });

    it('should display plugin algo environment dependencies statuses', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      getPythonPackageDependencyStatusSpy.mockResolvedValue(
        algoPackageDependencyStatusResponse
      );
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
        expect(await screen.findByText(/^Required Packages$/i)).toBeTruthy();
      });
      expect(getPythonPackageDependencyStatusSpy).toHaveBeenCalledWith([
        { requirement: 'numpy==1.24.1' },
        { requirement: 'scipy==1.10.0' },
      ]);
      const requiredPackageHeading = screen.queryByText(
        /^Required Packages$/i
      ) as Element;
      const statusContainer = requiredPackageHeading.parentElement as Element;
      expect(statusContainer).toMatchInlineSnapshot(`
        <div
          class="algoRequirements"
        >
          <h4>
            Required Packages
          </h4>
          <div
            style="margin: 10px;"
          >
            <div
              class="valueDisplay"
            >
              <div
                class="statusIcon"
              >
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                  data-testid="TaskAltIcon"
                  focusable="false"
                  style="color: rgb(82, 190, 82); font-size: 16px;"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22 5.18 10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zm-2.21 5.04c.13.57.21 1.17.21 1.78 0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8c1.58 0 3.04.46 4.28 1.25l1.44-1.44C16.1 2.67 14.13 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39l-1.61 1.61z"
                  />
                </svg>
              </div>
              <div
                class="label"
              >
                numpy
                 
                ==
                1.24.1
              </div>
            </div>
            <div
              class="valueDisplay"
            >
              <div
                class="statusIcon"
              >
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                  data-testid="ErrorOutlineIcon"
                  focusable="false"
                  style="color: rgb(247, 57, 57); font-size: 16px;"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
                  />
                </svg>
              </div>
              <div
                class="label"
              >
                scipy
                 
                ==
                1.10.0
              </div>
            </div>
          </div>
        </div>
        `);
    });
  });

  describe('Delete Plugin', () => {
    it('should show delete plugin confirmation modal dialog delete button is clicked', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      const delBtn = screen.queryByText(/^Delete$/i) as Element;
      await userEvent.click(delBtn);
      await screen.findByText(
        /^Are you sure you want to delete this plugin\?$/i
      );
      expect(await screen.findAllByText(/^Delete$/i)).toHaveLength(2);
    });

    it('should delete plugin and show success message', async () => {
      fetchAllPluginsSpy.mockResolvedValue(pluginsListResponse);
      const GID = 'aiverify.stock.algorithms.partial_dependence_plot';
      deletePluginSpy.mockResolvedValueOnce({ status: 200, data: GID });
      render(
        <MockProviders>
          <PluginsModule />
        </MockProviders>
      );
      await waitFor(async () => {
        expect(
          await screen.findAllByText(/^Partial Dependence Plot$/i)
        ).toHaveLength(3);
      });
      const delBtn = screen.queryByText(/^Delete$/i) as Element;
      await userEvent.click(delBtn);
      const deleteBtns = await screen.findAllByText(/^Delete$/i);
      await userEvent.click(deleteBtns[1]);
      await screen.findByText(/^Plugin was successfully removed$/i);
      expect(deletePluginSpy).toHaveBeenCalledWith(GID);
      expect(
        screen.queryByText(/^Plugin was successfully removed$/i)
      ).toBeTruthy();
      await waitFor(() => expect(fetchAllPluginsSpy).toHaveBeenCalledTimes(2));
    });
  });
});
