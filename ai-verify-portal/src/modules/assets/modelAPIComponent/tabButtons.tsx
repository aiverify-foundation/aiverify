import styles from './styles/newModelApiConfig.module.css';
import clsx from 'clsx';
import { useFormikContext } from 'formik';
import { ModelApiFormModel, RequestMethod } from './types';
import { usePresetHelper } from './providers/presetHelperProvider';
import { useEffect } from 'react';

export enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
  OTHERS,
}

type TabButtonsGroupProps = {
  visibleTabs: Tab[];
  activeTab?: Tab;
  onTabClick: (tab: Tab) => void;
};

function TabButtonsGroup(props: TabButtonsGroupProps) {
  const { visibleTabs, activeTab, onTabClick } = props;
  const { values } = useFormikContext<ModelApiFormModel>();
  const { highlightedTab } = usePresetHelper();

  function isTabVisible(tab: Tab) {
    return visibleTabs.indexOf(tab) > -1;
  }

  function handleTabClick(tab: Tab) {
    return () => onTabClick(tab);
  }

  useEffect(() => {
    if (highlightedTab != undefined)
      document.getElementById(`tab${highlightedTab}`)?.click();
  }, [highlightedTab]);
  return (
    <div className={styles.tabsBtnGroup}>
      {values.modelAPI.method && values.modelAPI.method === RequestMethod.GET
        ? isTabVisible(Tab.URL_PARAMS) && (
            <div
              id={`tab${Tab.URL_PARAMS}`}
              className={clsx(
                styles.tabBtn,
                activeTab === Tab.URL_PARAMS ? styles.tabBtn__selected : null
              )}
              onClick={handleTabClick(Tab.URL_PARAMS)}>
              URL Parameters
            </div>
          )
        : isTabVisible(Tab.REQUEST_BODY) && (
            <div
              id={`tab${Tab.REQUEST_BODY}`}
              className={clsx(
                styles.tabBtn,
                activeTab === Tab.REQUEST_BODY ? styles.tabBtn__selected : null
              )}
              onClick={handleTabClick(Tab.REQUEST_BODY)}>
              Request Body
            </div>
          )}
      {isTabVisible(Tab.HEADERS) && (
        <div
          id={`tab${Tab.HEADERS}`}
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.HEADERS ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.HEADERS)}>
          Additional Request Headers
        </div>
      )}
      {isTabVisible(Tab.RESPONSE) && (
        <div
          id={`tab${Tab.RESPONSE}`}
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.RESPONSE ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.RESPONSE)}>
          Response Properties
        </div>
      )}
      {isTabVisible(Tab.AUTHENTICATION) && (
        <div
          id={`tab${Tab.AUTHENTICATION}`}
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.AUTHENTICATION ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.AUTHENTICATION)}>
          Authentication Settings
        </div>
      )}
      {isTabVisible(Tab.OTHERS) && (
        <div
          id={`tab${Tab.OTHERS}`}
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.OTHERS ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.OTHERS)}>
          Connection Settings
        </div>
      )}
    </div>
  );
}

export { TabButtonsGroup };
