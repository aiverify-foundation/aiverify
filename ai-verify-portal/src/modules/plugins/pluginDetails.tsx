import { useEffect, useRef, useState } from 'react';
import AIFPlugin from 'src/types/plugin.interface';
import DisplayAlgorithms from './displayAlgorithms';
import DisplayInputBlocks from './displayInputBlocks';
import DisplayReportWidgets from './displayReportWidgets';
import DisplayTemplates from './displayTemplates';
import styles from './styles/plugins.module.css';
import clsx from 'clsx';
import { DependencyStatus } from './dependencyStatus';
import {
  DependencyRequirement,
  DependencyStatusResult,
  getPythonPackageDependencyStatus,
} from './api/algorithms';
import { extractRequirementString } from './utils/deserializeAlgoRequirement';

type PluginDetailsProps = {
  plugin: AIFPlugin;
  onDeleteBtnClick: () => void;
};

type AlgoDependency = [string, string, string];

enum PluginComponent {
  WIDGET,
  TEMPLATE,
  ALGO,
  IBLOCK,
}

const headSectionID = 'detailsHead';

function PluginsDetails(props: PluginDetailsProps) {
  const { plugin, onDeleteBtnClick } = props;
  const [algoRequirementsResult, setAlgoRequirementsResult] =
    useState<DependencyStatusResult[]>();
  const [activeTab, setActiveTab] = useState<PluginComponent>();
  const tabsGroupRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scollContainerRef = useRef<HTMLDivElement>(null);
  const { templates, reportWidgets, algorithms, inputBlocks } = plugin;
  const enableDeletebtn = !plugin.isStock;
  const templateCount = templates ? templates.length : 0;
  const widgetCount = reportWidgets ? reportWidgets.length : 0;
  const algoCount = algorithms ? algorithms.length : 0;
  const iBlockCount = inputBlocks ? inputBlocks.length : 0;

  function handleTabClick(pluginComp: PluginComponent) {
    return () => setActiveTab(pluginComp);
  }

  useEffect(() => {
    if (tabsGroupRef.current) {
      const firstTab =
        tabsGroupRef.current.querySelector<HTMLDivElement>('div:first-of-type');
      if (firstTab) firstTab.click();
    }
    if (!algorithms || !algorithms.length) {
      setAlgoRequirementsResult(undefined);
      return;
    }
    async function fetchAlgoDependenciesStatuses() {
      const algoRequirementStrings: DependencyRequirement[] = [];
      if (algorithms) {
        algorithms.forEach((algo) => {
          if (algo.requirements.length) {
            algo.requirements.forEach((req) =>
              algoRequirementStrings.push({
                requirement: extractRequirementString(req),
              })
            );
          }
        });
        const result = await getPythonPackageDependencyStatus(
          algoRequirementStrings
        );
        if ('data' in result) setAlgoRequirementsResult(result.data);
      }
    }
    fetchAlgoDependenciesStatuses();
  }, [plugin]);

  useEffect(() => {
    // manual calculation for adaptive heights because plugin description content is not fixed length;
    // hence the height of div containing it is not fixed.
    if (panelRef.current) {
      const headEl = panelRef.current.querySelector<HTMLDivElement>(
        `#${headSectionID}`
      );
      if (headEl) {
        if (scollContainerRef.current) {
          scollContainerRef.current.style.height = `calc(100vh - ${headEl.offsetHeight}px - 55px - 200px)`;
          // 200px - manual modifier, 55px topbar height
        }
      }
    }
  }, [plugin]);

  function AlgoDependencies() {
    return algoRequirementsResult && algoRequirementsResult.length ? (
      <div className={styles.algoRequirements}>
        <h4>Required Packages</h4>
        <div style={{ margin: '10px' }}>
          {algoRequirementsResult.map((depResult) => (
            <DependencyStatus
              key={depResult.requirement}
              requirement={depResult.requirement}
              isValid={depResult.result}
            />
          ))}
        </div>
      </div>
    ) : null;
  }

  return (
    <div
      data-testid="pluginDetailsPanel"
      className={styles.pluginDetailsPanel}
      ref={panelRef}>
      <div id={headSectionID} className={styles.detailsHead}>
        <h2 className={styles.pluginNameHeading}>{plugin.name}</h2>
        <p className={styles.value_gid}>{plugin.description}</p>
        <div>
          {enableDeletebtn ? (
            <button
              className="aivBase-button aivBase-button--outlined aivBase-button--small"
              onClick={onDeleteBtnClick}>
              Delete
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.detailsMain}>
        <div className={styles.tabs}>
          <div ref={tabsGroupRef} className={styles.tabsBtnGroup}>
            {templateCount > 0 ? (
              <div
                className={clsx(
                  styles.tabBtn,
                  activeTab === PluginComponent.TEMPLATE
                    ? styles.tabBtn__selected
                    : null
                )}
                onClick={handleTabClick(PluginComponent.TEMPLATE)}>
                Templates<div className={styles.counter}>{templateCount}</div>
              </div>
            ) : null}
            {widgetCount > 0 ? (
              <div
                className={clsx(
                  styles.tabBtn,
                  activeTab === PluginComponent.WIDGET
                    ? styles.tabBtn__selected
                    : null
                )}
                onClick={handleTabClick(PluginComponent.WIDGET)}>
                Widgets<div className={styles.counter}>{widgetCount}</div>
              </div>
            ) : null}
            {algoCount > 0 ? (
              <div
                className={clsx(
                  styles.tabBtn,
                  activeTab === PluginComponent.ALGO
                    ? styles.tabBtn__selected
                    : null
                )}
                onClick={handleTabClick(PluginComponent.ALGO)}>
                Algorithms<div className={styles.counter}>{algoCount}</div>
              </div>
            ) : null}
            {iBlockCount > 0 ? (
              <div
                className={clsx(
                  styles.tabBtn,
                  activeTab === PluginComponent.IBLOCK
                    ? styles.tabBtn__selected
                    : null
                )}
                onClick={handleTabClick(PluginComponent.IBLOCK)}>
                Input Blocks<div className={styles.counter}>{iBlockCount}</div>
              </div>
            ) : null}
          </div>
          <div className={styles.tabsDivider} />
          <div className={styles.tabContent}>
            <div
              ref={scollContainerRef}
              className={clsx(styles.scrollContainer)}>
              {activeTab === PluginComponent.TEMPLATE ? (
                <DisplayTemplates plugin={plugin} />
              ) : null}
              {activeTab === PluginComponent.WIDGET ? (
                <DisplayReportWidgets plugin={plugin} />
              ) : null}
              {activeTab === PluginComponent.ALGO ? (
                <DisplayAlgorithms plugin={plugin}>
                  <AlgoDependencies />
                </DisplayAlgorithms>
              ) : null}
              {activeTab === PluginComponent.IBLOCK ? (
                <DisplayInputBlocks plugin={plugin} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PluginsDetails };
export type { AlgoDependency };
