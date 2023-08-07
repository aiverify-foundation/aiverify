import styles from './styles/newModelApiConfig.module.css';
import clsx from 'clsx';
import { useFormikContext } from 'formik';
import { ModelApiFormModel, RequestMethod } from './types';

export enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
  OTHERS,
}

type TabButtonsGroupProps = {
  activeTab?: Tab;
  onTabClick: (tab: Tab) => void;
};

function TabButtonsGroup({ activeTab, onTabClick }: TabButtonsGroupProps) {
  const { values } = useFormikContext<ModelApiFormModel>();
  function handleTabClick(tab: Tab) {
    return () => onTabClick(tab);
  }
  return (
    <div className={styles.tabsBtnGroup}>
      {values.modelAPI.method &&
      values.modelAPI.method === RequestMethod.GET ? (
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
          activeTab === Tab.HEADERS ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.HEADERS)}>
        Additional Request Headers
      </div>
      <div
        className={clsx(
          styles.tabBtn,
          activeTab === Tab.RESPONSE ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.RESPONSE)}>
        Response Properties
      </div>
      <div
        className={clsx(
          styles.tabBtn,
          activeTab === Tab.AUTHENTICATION ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.AUTHENTICATION)}>
        Authentication Settings
      </div>
      <div
        className={clsx(
          styles.tabBtn,
          activeTab === Tab.OTHERS ? styles.tabBtn__selected : null
        )}
        onClick={handleTabClick(Tab.OTHERS)}>
        Connection Settings
      </div>
    </div>
  );
}

export { TabButtonsGroup };
