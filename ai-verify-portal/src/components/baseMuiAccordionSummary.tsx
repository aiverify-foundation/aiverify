import React from 'react';
import { styled } from '@mui/material/styles';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styles from './styles/muiaccordion.module.css';

/*
  .MuiAccordionSummary-content cannot be css selected and styled using normal css.
  So we use a styled component to achieve it.
  Leverage this component to bake-in flex container.
*/
type BaseMuiAccordionSummaryProps = AccordionSummaryProps & {
  expandiconstyles?: React.CSSProperties;
};

const BaseMuiAccordionSummary = styled(
  (props: BaseMuiAccordionSummaryProps) => {
    const { expandiconstyles, children } = props;
    return (
      <MuiAccordionSummary
        expandIcon={
          <ExpandMoreIcon
            className={styles.expandIcon}
            style={expandiconstyles}
          />
        }
        {...props}>
        <div className={styles.headingContainer}>{children}</div>
      </MuiAccordionSummary>
    );
  }
)(() => ({
  '& .MuiAccordionSummary-content': {
    margin: '5px',
    marginLeft: '10px',
  },
}));

export { BaseMuiAccordionSummary };
