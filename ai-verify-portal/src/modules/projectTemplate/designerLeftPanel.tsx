import React, {
  forwardRef,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Accordion,
  AccordionDetails,
  InputAdornment,
  Link,
  TextField,
} from '@mui/material';
import { ProjectTemplateStore } from '../project/projectContext';
import WidgetsIcon from '@mui/icons-material/Widgets';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { BaseMuiAccordionSummary } from 'src/components/baseMuiAccordionSummary';
import AIFPlugin, {
  ReportWidget,
  ReportWidgetStatus,
} from 'src/types/plugin.interface';
import styles from './styles/leftpanel.module.css';
import clsx from 'clsx';
import Fuse from 'fuse.js';
import { serializeSearchResult } from './utils/serializeFuseSearchResult';
import { changeWheelSpeed } from 'src/lib/utils';

const fuseSearchOptions = {
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  keys: ['name', 'reportWidgets.name'],
};

type LeftPanelProps = {
  projectStore: ProjectTemplateStore;
  onWidgetDragStart: (widget: ReportWidget) => void;
};

type WidgetDetailsProps = {
  widget: ReportWidget;
};

type WidgetGroupProps = {
  widget: ReportWidget;
  disabled?: boolean;
  onDragStart: (
    widget: ReportWidget
  ) => React.DragEventHandler<HTMLDivElement> | undefined;
};

const WidgetDetails = forwardRef<HTMLDivElement, WidgetDetailsProps>(
  function WidgetDetails(props: WidgetDetailsProps, scrollContainerRef) {
    const { widget } = props;
    const hasDependencies = widget.dependencies && widget.dependencies.length;
    const hasTags = widget.tags && widget.tags.length;

    return (
      <div
        ref={scrollContainerRef}
        className={styles.widgetDetailsScrollContainer}>
        <div
          className={styles.widgetDetailsRow}
          style={{ flexDirection: 'column' }}>
          <div className={styles.widgetDetailLabel}>Description:</div>
          <div className={styles.widgetDetailText}>{widget.description}</div>
        </div>
        <div className={styles.widgetDetailsRow}>
          <div className={styles.widgetDetailLabel}>Version:</div>
          <div className={styles.widgetDetailText}>{widget.version}</div>
        </div>
        {hasTags ? (
          <div className={styles.widgetDetailsRow}>
            <div className={styles.widgetDetailLabel}>Tags: </div>
            <div className={styles.widgetDetailText}>
              {widget.tags.join(', ')}
            </div>
          </div>
        ) : null}
        {hasDependencies ? (
          <div
            className={styles.widgetDetailsRow}
            style={{ flexDirection: 'column' }}>
            <div className={styles.widgetDetailLabel}>Dependencies:</div>
            <ul>
              {widget.dependencies.map((dep) => (
                <li key={`${widget.gid}-${dep.gid}`}>
                  {dep.valid ? (
                    <Link href="#" color="inherit">
                      {dep.gid}
                    </Link>
                  ) : (
                    <div style={{ color: 'red' }}>{dep.gid}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
);

function DraggableWidget(props: PropsWithChildren<WidgetGroupProps>) {
  const { widget, disabled = false, onDragStart } = props;

  const divRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let removeWheelHandler: () => void;
    const el = divRef.current;
    const handleTransitionStart = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        removeWheelHandler = changeWheelSpeed(scrollContainerRef.current, 0.08);
      }
    };
    el.addEventListener('transitionstart', handleTransitionStart);
    return () => {
      el.removeEventListener('transitionstart', handleTransitionStart, false);
      if (removeWheelHandler) removeWheelHandler();
    };
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    return changeWheelSpeed(scrollContainerRef.current, 0.08);
  }, []);

  return (
    <div
      key={widget.gid}
      ref={divRef}
      className={clsx(
        styles.draggableWidget,
        disabled ? styles.draggableWidget_disabled : null
      )}
      draggable={!disabled}
      unselectable="on"
      onDragStart={!disabled ? onDragStart(widget) : undefined} // this is a hack for firefox
    >
      <div className={styles.widgetHeadingWrapper}>
        <div style={{ display: 'flex' }}>
          <WidgetsIcon className={styles.draggableWidgetIcon} />
          <div className={styles.widgetHeading}>{widget.name}</div>
        </div>
        {!disabled ? (
          <div
            className={styles.draggableHandleIconWrapper}
            style={{ display: 'flex' }}>
            <DragIndicatorIcon className={styles.draggableHandleIcon} />
          </div>
        ) : null}
      </div>
      <div className={styles.widgetDetailsDivider}></div>
      <WidgetDetails widget={widget} ref={scrollContainerRef} />
    </div>
  );
}

function DesignerLeftPanel(props: LeftPanelProps) {
  const { projectStore, onWidgetDragStart } = props;
  const [pluginsWithWidgets, setPluginsWithWidgets] = useState<AIFPlugin[]>([]);
  const widgetsFuseRef = useRef<Fuse<AIFPlugin>>();

  function dragStartHandler(widget: ReportWidget) {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', '');
      onWidgetDragStart(widget);
    };
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
                              onDragStart={dragStartHandler}>
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
