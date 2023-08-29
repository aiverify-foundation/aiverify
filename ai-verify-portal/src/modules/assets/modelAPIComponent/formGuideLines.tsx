import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import styles from './styles/newModelApiConfig.module.css';
import React, { useEffect, useState } from 'react';

enum GuidelineType {
  POST,
  GET,
  BASIC_AUTH,
  AUTH_TOKEN,
  HEADERS,
}

type FormGuidelinesProps = {
  handleCloseIconClick?: () => void;
  guidelineTypes?: GuidelineType[];
  onSelect: (types: GuidelineType[]) => (_e: React.MouseEvent) => void;
};

function FormGuidelines(props: FormGuidelinesProps) {
  const { handleCloseIconClick, onSelect } = props;

  return (
    <div
      style={{
        width: '100%',
        margin: 'auto',
        marginTop: '20px',
      }}>
      <StandardAlert
        alertType={AlertType.NONE}
        headingText="Guidelines"
        disableCloseIcon={false}
        onCloseIconClick={handleCloseIconClick}>
        <div style={{ fontSize: 15 }}>
          <ul className={styles.formGuideList}>
            <li
              onClick={onSelect([
                GuidelineType.POST,
                GuidelineType.BASIC_AUTH,
              ])}>
              POST request and requires Username/Password authentication
            </li>
            <li
              onClick={onSelect([GuidelineType.GET, GuidelineType.BASIC_AUTH])}>
              GET request and requires Username/Password authentication
            </li>
            <li
              onClick={onSelect([
                GuidelineType.POST,
                GuidelineType.AUTH_TOKEN,
              ])}>
              POST request and requires Authentication Token
            </li>
            <li
              onClick={onSelect([GuidelineType.GET, GuidelineType.AUTH_TOKEN])}>
              GET request and requires Authentication Token
            </li>
          </ul>
        </div>
      </StandardAlert>
    </div>
  );
}

export { FormGuidelines, GuidelineType };
