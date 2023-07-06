import React, { ChangeEvent, useState, useRef, useEffect } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import Fuse from 'fuse.js';
import AIFPlugin from 'src/types/plugin.interface';
import { PluginsDetails } from './pluginDetails';
import { MinimalHeader } from '../home/header';
import styles from './styles/plugins.module.css';
import { OutlinedInput } from '@mui/material';
import { serializeSearchResult } from './utils/serializeFuseSearchResult';
import { PageLevelErrorAlert } from '../../components/pageLeverlErrorAlert';
import { PluginListItem } from './pluginListItem';
import ClearIcon from '@mui/icons-material/Clear';
import PowerIcon from '@mui/icons-material/Power';
import { deletePlugin, fetchAllPlugins, uploadPlugin } from './api/plugins';
import { QuickFilter, QuickFilters } from './quickFilters';
import { SortMenu, SortOption } from './sortMenu';
import ConfirmationDialog from 'src/components/confirmationDialog';
import { HttpStatusCode } from 'axios';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import { AlertBoxSize } from 'src/components/alertBox';
import { validateNewPluginFile } from './utils/validateNewPluginFile';

const fuseSearchOptions = {
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  keys: [
    'name',
    'description',
    'algorithms.name',
    'algorithms.description',
    'reportWidgets.name',
    'inputBlocks.name',
    'inputBlocks.description',
  ],
};

export default function PluginsModule() {
  const [plugins, setPlugins] = useState<AIFPlugin[]>([]);
  const [initialPluginsLoaded, setInitialPluginsLoaded] = useState<
    AIFPlugin[] | undefined
  >();
  const [loadingError, setLoadingError] = useState<Error | undefined>();
  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>(
    SortOption.InstallDateAsc
  );
  const [selectedPlugin, setSelectedPlugin] = useState<AIFPlugin>();
  const [activeQuickFilters, setActiveQuickFilters] = useState<QuickFilter[]>(
    []
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showInstallConfirmation, setShowInstallConfirmation] = useState(false);
  const [newPluginFile, setNewPluginFile] = useState<File>();
  const [showDeleteResult, setShowDeleteResult] = useState<{
    success: boolean;
    name?: string;
  }>();
  const [showInstallResult, setShowInstallResult] = useState<{
    success: boolean;
    errorMsg?: string;
  }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>();
  const pluginsListRef = useRef<HTMLDivElement>(null);
  const widgetsFuseRef = useRef<Fuse<AIFPlugin>>();

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!widgetsFuseRef.current) return;
    if (e.target.value.trim() === '' && initialPluginsLoaded) {
      setPlugins([...initialPluginsLoaded]);
      return;
    }
    const fuseSearchResult = widgetsFuseRef.current.search(
      `'${e.target.value}`
    );
    setPlugins(serializeSearchResult(fuseSearchResult));
  }

  function handleQuickFilterClick(filter: QuickFilter) {
    return () => {
      setActiveQuickFilters((prev) => {
        const idx = prev.findIndex((item) => item === filter);
        const updatedFilters = [...prev];
        if (idx > -1) {
          updatedFilters.splice(idx, 1);
        } else {
          updatedFilters.push(filter);
        }
        return updatedFilters;
      });
    };
  }

  function handleClearSearchBtnClick() {
    if (searchInputRef.current && searchInputRef.current.value.length) {
      searchInputRef.current.value = '';
      if (initialPluginsLoaded) setPlugins([...initialPluginsLoaded]);
    }
  }

  function handlePluginDeleteClick() {
    setShowDeleteConfirmation(true);
  }

  async function handleDeleteConfirmationPrimaryBtnClick(
    confirmDelete: boolean
  ) {
    if (confirmDelete) {
      if (selectedPlugin) {
        const result = await deletePlugin(selectedPlugin.gid);
        if ('status' in result) {
          setShowDeleteResult({
            success: result.status === HttpStatusCode.Ok,
            name: selectedPlugin.name,
          });
          await fetchInitialPlugins();
        }
      }
    } else {
      setShowDeleteConfirmation(false);
      setShowDeleteResult(undefined);
    }
  }

  async function handlePluginFileSelected(
    event: ChangeEvent<HTMLInputElement>
  ) {
    event.preventDefault();
    if (!event.target.files || !event.target.files.length) return;
    const file = event.target.files[0];
    const validateResult = validateNewPluginFile(file);
    setNewPluginFile(file);
    if (validateResult.isValid) {
      setShowInstallResult(undefined);
    } else {
      setShowInstallResult({ success: false, errorMsg: validateResult.msg });
    }
    setShowInstallConfirmation(true);
  }

  async function handleInstallConfirmationPrimaryBtnClick(
    confirmInstall: boolean
  ) {
    if (confirmInstall) {
      if (newPluginFile) {
        const result = await uploadPlugin(newPluginFile);
        if ('status' in result) {
          if (
            result.status === HttpStatusCode.Ok &&
            result.data.gid != undefined
          ) {
            setShowInstallResult({ success: true });
            const updatedPluginsList = await fetchInitialPlugins();
            const installedPlugin = updatedPluginsList.find(
              (plugin) => plugin.gid === result.data.gid
            );
            setSelectedPlugin(installedPlugin);
          }
        } else {
          console.error(result);
          setShowInstallResult({ success: false, errorMsg: result.message });
        }
      }
    } else {
      setShowInstallConfirmation(false);
      setShowInstallResult(undefined);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleItemClick(plugin: AIFPlugin) {
    return () => setSelectedPlugin(plugin);
  }

  function handleSortMenuSelected(sortOption: SortOption) {
    setSelectedSortOption(sortOption);
  }

  async function fetchInitialPlugins() {
    const response = await fetchAllPlugins();
    if ('data' in response) {
      const { plugins } = response.data;
      widgetsFuseRef.current = new Fuse(plugins, fuseSearchOptions);
      setPlugins(plugins);
      setInitialPluginsLoaded(plugins);
      setLoadingError(undefined);
      return plugins;
    } else {
      console.error(response);
      setLoadingError(response);
      setSelectedPlugin(undefined);
      return [];
    }
  }

  useEffect(() => {
    if (!initialPluginsLoaded) return;
    if (activeQuickFilters.length === 0) {
      setPlugins([...initialPluginsLoaded]);
      setSelectedPlugin(undefined);
      return;
    }
    const filtered = initialPluginsLoaded.filter((plugin) => {
      for (const qFilter of activeQuickFilters) {
        switch (qFilter) {
          case QuickFilter.PreInstalled:
            if (plugin.isStock) return true;
            break;
          case QuickFilter.Widgets:
            if (plugin.reportWidgets && plugin.reportWidgets.length)
              return true;
            break;
          case QuickFilter.Algorithms:
            if (plugin.algorithms && plugin.algorithms.length) return true;
            break;
          case QuickFilter.InputBlocks:
            if (plugin.inputBlocks && plugin.inputBlocks.length) return true;
            break;
          case QuickFilter.Templates:
            if (plugin.templates && plugin.templates.length) return true;
            break;
          default:
            return false;
        }
      }
    });
    setPlugins(filtered);
  }, [activeQuickFilters]);

  useEffect(() => {
    if (!plugins || !initialPluginsLoaded) return;
    const sortedPlugins = [...plugins];
    switch (selectedSortOption) {
      case SortOption.InstallDateDesc:
        sortedPlugins.sort((a, b) => (a.installedAt > b.installedAt ? -1 : 1));
        break;
      case SortOption.InstallDateAsc:
        sortedPlugins.sort((a, b) => (a.installedAt < b.installedAt ? -1 : 1));
        break;
      case SortOption.PluginNameDesc:
        sortedPlugins.sort((a, b) =>
          a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1
        );
        break;
      case SortOption.PluginNameAsc:
        sortedPlugins.sort((a, b) =>
          a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
        );
        break;
    }
    setPlugins(sortedPlugins);
  }, [selectedSortOption, initialPluginsLoaded]);

  useEffect(() => {
    if (showInstallResult) return;
    if (plugins.length === 0) setSelectedPlugin(undefined);
    if (pluginsListRef.current && plugins.length) {
      const firstItemEl =
        pluginsListRef.current.querySelector<HTMLDivElement>(
          'div:first-of-type'
        );
      if (firstItemEl) firstItemEl.click();
    }
  }, [plugins]);

  useEffect(() => {
    fetchInitialPlugins();
  }, []);

  return (
    <div>
      <MinimalHeader />
      <div className="layoutContentArea">
        <div className="mainContainer">
          <div className={styles.container__limits}>
            <div className={styles.pluginsPanelsLayout}>
              <div id="pluginsLeftPane" className={styles.pluginsLeftPane}>
                <div style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex' }}>
                    <PowerIcon
                      style={{
                        fontSize: '30px',
                        marginTop: '2px',
                        marginRight: '4px',
                      }}
                    />
                    <div>
                      <h3 className="screenHeading">Plugin Manager</h3>
                      <p className="headingDescription">
                        Manage plugins and their templates, widgets, and
                        algorithms
                      </p>
                    </div>
                  </div>
                </div>
                <div className={styles.pluginsList}>
                  {loadingError ? (
                    <PageLevelErrorAlert
                      error={loadingError}
                      headingText="Error loading plugins"
                      content="There was an issue while trying to load plugins"
                    />
                  ) : (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          position: 'relative',
                          justifyContent: 'space-between',
                          marginRight: '18px',
                        }}>
                        <QuickFilters
                          activeQuickFilters={activeQuickFilters}
                          handleQuickFilterClick={handleQuickFilterClick}
                        />
                        <SortMenu
                          selected={selectedSortOption}
                          onClick={handleSortMenuSelected}
                        />
                      </div>
                      <div className={styles.searchFieldRow}>
                        <OutlinedInput
                          inputRef={searchInputRef}
                          id="search"
                          type="text"
                          placeholder="Search plugins"
                          style={{
                            height: '36px',
                            width: '100%',
                            background: '#FFFFFF',
                          }}
                          onChange={handleSearchInputChange}
                          startAdornment={
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          }
                        />
                        <div
                          data-testid="clearSearchInputIcon"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '25px',
                            cursor: 'pointer',
                          }}
                          onClick={handleClearSearchBtnClick}>
                          <ClearIcon style={{ fontSize: '20px' }} />
                        </div>
                      </div>
                      <div
                        id="pluginsList"
                        ref={pluginsListRef}
                        className={styles.scrollContainer}>
                        {plugins.length === 0 ? (
                          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            No plugins found
                          </div>
                        ) : (
                          plugins.map((plugin) => (
                            <PluginListItem
                              selected={
                                selectedPlugin &&
                                selectedPlugin.gid === plugin.gid
                              }
                              key={`plugin-${plugin.gid}`}
                              plugin={plugin}
                              onClick={handleItemClick(plugin)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div id="pluginsRightPane" className={styles.pluginsRightPane}>
                {!loadingError ? (
                  <div className={styles.actionBtnGroup}>
                    {/* TODO - refactor file input to not use MUI button */}
                    <Button
                      variant="contained"
                      component="label"
                      style={{ marginRight: '5px' }}>
                      Install Plugin
                      <input
                        hidden
                        data-testid="pluginFileInput"
                        accept="application/zip"
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePluginFileSelected}
                      />
                    </Button>
                    {/* <Button variant="contained" component="label">
                      Update Dependencies Status
                    </Button> */}
                  </div>
                ) : null}
                {selectedPlugin ? (
                  <PluginsDetails
                    plugin={selectedPlugin}
                    onDeleteBtnClick={handlePluginDeleteClick}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      {newPluginFile && showInstallConfirmation ? (
        <ConfirmationDialog
          size={AlertBoxSize.AUTO}
          title="Install Plugin"
          primaryBtnText="Install"
          showOKBtn={showInstallResult != undefined}
          onClose={handleInstallConfirmationPrimaryBtnClick}>
          {showInstallResult ? (
            <StandardAlert
              disableCloseIcon
              style={{ border: 'none', padding: 'none', minHeight: 'none' }}
              alertType={
                showInstallResult.success ? AlertType.SUCCESS : AlertType.ERROR
              }
              headingText={
                showInstallResult.success
                  ? 'Plugin was successfully installed'
                  : 'Unable to install plugin'
              }>
              <div style={{ fontSize: '14px' }}>
                <div>{newPluginFile.name}</div>
                {!showInstallResult.success ? (
                  <div style={{ color: '#f73939' }}>
                    {showInstallResult.errorMsg}
                  </div>
                ) : null}
              </div>
            </StandardAlert>
          ) : (
            <h4 style={{ wordBreak: 'break-word' }}>
              {newPluginFile.name}{' '}
              <span style={{ fontWeight: 'normal' }}>
                ({newPluginFile.size / 1000} kb)
              </span>
            </h4>
          )}
        </ConfirmationDialog>
      ) : null}
      {selectedPlugin && showDeleteConfirmation ? (
        <ConfirmationDialog
          size={AlertBoxSize.XTRASMALL}
          title="Delete Plugin"
          primaryBtnText="Delete"
          message={
            showDeleteResult
              ? undefined
              : 'Are you sure you want to delete this plugin?'
          }
          showOKBtn={showDeleteResult != undefined}
          onClose={handleDeleteConfirmationPrimaryBtnClick}>
          {showDeleteResult ? (
            <StandardAlert
              disableCloseIcon
              style={{ border: 'none', padding: 'none', minHeight: 'none' }}
              alertType={
                showDeleteResult.success ? AlertType.SUCCESS : AlertType.ERROR
              }
              headingText={
                showDeleteResult.success
                  ? 'Plugin was successfully removed'
                  : 'Unable to remove plugin'
              }>
              <div>{showDeleteResult.name}</div>
            </StandardAlert>
          ) : (
            <h4>{selectedPlugin.name}</h4>
          )}
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}
