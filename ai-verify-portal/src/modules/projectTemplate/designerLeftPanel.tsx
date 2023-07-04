import React, { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  InputAdornment,
  TextField,
} from '@mui/material';
import { ProjectTemplateStore } from '../project/projectContext';
import WidgetsIcon from '@mui/icons-material/Widgets';
import SearchIcon from '@mui/icons-material/Search';
import { BaseMuiAccordionSummary } from 'src/components/baseMuiAccordionSummary';
import AIFPlugin, {
  ReportWidget,
  ReportWidgetStatus,
} from 'src/types/plugin.interface';
import styles from './styles/leftpanel.module.css';
import Fuse from 'fuse.js';
import { serializeSearchResult } from './utils/serializeFuseSearchResult';
import { DraggableWidget, WidgetDetails } from './draggableWidget';

const fuseSearchOptions = {
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  keys: ['name', 'reportWidgets.name'],
};

type LeftPanelProps = {
  projectStore: ProjectTemplateStore;
  onWidgetDragStart: (widget: ReportWidget) => void;
  onWidgetDragEnd: () => void;
  onWidgetDrag: React.DragEventHandler<HTMLDivElement>;
};

function DesignerLeftPanel(props: LeftPanelProps) {
  const { projectStore, onWidgetDragStart, onWidgetDragEnd, onWidgetDrag } =
    props;
  const [pluginsWithWidgets, setPluginsWithWidgets] = useState<AIFPlugin[]>([]);
  const widgetsFuseRef = useRef<Fuse<AIFPlugin>>();

  function dragStartHandler(widget: ReportWidget) {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', '');
      onWidgetDragStart(widget);
    };
  }

  function dragEndHandler() {
    onWidgetDragEnd();
  }

  function dragHandler(e: React.DragEvent<HTMLDivElement>) {
    onWidgetDrag(e);
  }

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!widgetsFuseRef.current) return;
    if (e.target.value.trim() === '') {
      setPluginsWithWidgets(
        projectStore.pluginManager.plugins.filter(
          (plugin) => plugin.reportWidgets && plugin.reportWidgets.length > 0
        )
      );
      return;
    }
    const fuseSearchResult = widgetsFuseRef.current.search(
      `'${e.target.value}`
    );
    setPluginsWithWidgets(serializeSearchResult(fuseSearchResult));
  }

  useEffect(() => {
    setPluginsWithWidgets(
      projectStore.pluginManager.plugins.filter(
        (plugin) => plugin.reportWidgets && plugin.reportWidgets.length > 0
      )
    );
  }, [projectStore.pluginManager.plugins]);

  useEffect(() => {
    widgetsFuseRef.current = new Fuse(
      projectStore.pluginManager.plugins.filter(
        (plugin) => plugin.reportWidgets && plugin.reportWidgets.length > 0
      ),
      fuseSearchOptions
    );
  }, []);

  return (
    <div id="leftPanel" className={styles.leftpanel}>
      <div className={styles.stickyLeftPanel}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.panelSection}>
            <div>
              <div style={{ lineHeight: '1.4', fontSize: '18px' }}>Project</div>
              <div className={styles.panelText} style={{ lineHeight: 1.2 }}>
                {projectStore.projectInfo.name}
              </div>
            </div>
          </div>
          <div className={styles.sectionDivider}></div>

          <div className={styles.panelSectionHeading}>
            <WidgetsIcon
              fontSize="small"
              sx={{ color: '#c42983', marginTop: '4px', marginRight: '10px' }}
            />
            <div className={styles.panelSectionHeadingText}>Report Widgets</div>
          </div>

          <div className={styles.panelSection}>
            <TextField
              id="search-widget-library"
              fullWidth
              size="small"
              color="secondary"
              placeholder="Search Report Widgets"
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '4px',
                outline: 'none',
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                style: { height: '30px' },
              }}
              onChange={handleSearchInputChange}
            />
          </div>

          <div className={styles.widgetScrollContainer}>
            <div className={styles.widgetsContainer}>
              {pluginsWithWidgets.map((plugin) => (
                <div key={plugin.gid} className="pluginAccordion">
                  <Accordion disableGutters>
                    <BaseMuiAccordionSummary>
                      <div className={styles.pluginHeading}>{plugin.name}</div>
                    </BaseMuiAccordionSummary>
                    <AccordionDetails>
                      {plugin.reportWidgets &&
                        plugin.reportWidgets.map((widget) => {
                          const isWidgetDisabled =
                            projectStore.isReadonly ||
                            widget.status !== ReportWidgetStatus.OK;
                          return (
                            <DraggableWidget
                              key={widget.gid}
                              widget={widget}
                              disabled={isWidgetDisabled}
                              onDrag={dragHandler}
                              onDragStart={dragStartHandler}
                              onDragEnd={dragEndHandler}>
                              <WidgetDetails widget={widget} />
                            </DraggableWidget>
                          );
                        })}
                    </AccordionDetails>
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DesignerLeftPanel };
