import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import styles from './styles/collapsibleList.module.css';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import clsx from 'clsx';

type AccordionProps = {
  headerContent?: React.ReactNode;
  style?: React.CSSProperties;
  defaultExpanded?: boolean;
};

function CollapsibleList(props: PropsWithChildren<AccordionProps>) {
  const { headerContent, style, defaultExpanded = false, children } = props;
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  function handleHeaderClick() {
    setExpanded((prev) => !prev);
  }

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div
      ref={rootRef}
      className={clsx(styles.root, expanded ? styles.list__expanded : null)}
      style={style}>
      <div className={styles.header} onClick={handleHeaderClick}>
        <ArrowDropDownIcon className={styles.arrowIcon} />
        <div className={styles.headerContent}>{headerContent}</div>
      </div>
      <div className={styles.list}>{children}</div>
    </div>
  );
}

function Header(props: PropsWithChildren) {
  const { children } = props;
  return <div className={styles.headerChild}>{children}</div>;
}

function Item(props: PropsWithChildren) {
  const { children } = props;
  return <div className={styles.item}>{children}</div>;
}

CollapsibleList.Header = Header;
CollapsibleList.Item = Item;

export { CollapsibleList };
