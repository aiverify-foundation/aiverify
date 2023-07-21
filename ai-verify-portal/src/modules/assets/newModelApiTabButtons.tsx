import { SetStateAction } from 'react';
import styles from './styles/newModelApiConfig.module.css';
import clsx from 'clsx';
import { useFormikContext } from 'formik';
import { ModelAPIGraphQLModel, RequestMethod } from './types';

export enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
}

type TabButtonsGroupProps = {
  activeTab?: Tab;
  onTabClick: (tab: Tab) => void;
};

function TabButtonsGroup({ activeTab, onTabClick }: TabButtonsGroupProps) {
  const { values } = useFormikContext<ModelAPIGraphQLModel>();
  function handleTabClick(tab: Tab) {
    return () => onTabClick(tab);
  }
  return (
    <div className={styles.tabsBtnGroup}>
      {values.method && values.method === RequestMethod.GET ? (
        <div
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.URL_PARAMS ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.URL_PARAMS)}>
          URL Parameters
        </div>
      ) : (
        <div
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.REQUEST_BODY ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.REQUEST_BODY)}>
          Request Body
        </div>
      )}
      <div
        className={clsx(
          styles.tabBtn,
          activeTab === Tab.RESPONSE ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.RESPONSE)}>
        Response
      </div>
      <div
        className={clsx(
          styles.tabBtn,
          activeTab === Tab.HEADERS ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.HEADERS)}>
        Additional Headers
      </div>
      <div
        className={clsx(
          styles.tabBtn,
          activeTab === Tab.AUTHENTICATION ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.AUTHENTICATION)}>
        Authentication
      </div>
    </div>
  );
}

export { TabButtonsGroup };