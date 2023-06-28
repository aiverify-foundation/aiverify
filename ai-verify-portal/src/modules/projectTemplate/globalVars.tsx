import AddIcon from '@mui/icons-material/Add';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { GlobalVariable } from 'src/types/projectTemplate.interface';
import CloseIcon from '@mui/icons-material/Close';
import produce from 'immer';
import styles from './styles/rightpanel.module.css';
import clsx from 'clsx';

type GlobalVar = GlobalVariable;

type GlobalVarsProps = {
  variables: GlobalVar[];
  onAddClick: (variables: GlobalVar) => void;
  onRemoveClick: (variables: GlobalVar) => void;
};

type VariableRowProps = {
  globalVariable: GlobalVar;
  onRemoveBtnClick: (globalVar: GlobalVar) => void;
};

const newVar = { key: '', value: '' };

function VariableRow(props: VariableRowProps) {
  const { globalVariable, onRemoveBtnClick } = props;
  const [showRemoveBtn, setShowRemoveBtn] = useState(false);

  function handleVarMouseOver() {
    setShowRemoveBtn(true);
  }

  function handleVarMouseLeave() {
    setShowRemoveBtn(false);
  }

  function handleRemoveBtnClick() {
    if (typeof onRemoveBtnClick === 'function') {
      onRemoveBtnClick(globalVariable);
    }
  }

  return (
    <div
      id={`varkey-${globalVariable.key}`}
      className={styles.gVarsRow}
      onMouseOver={handleVarMouseOver}
      onMouseLeave={handleVarMouseLeave}>
      <div className={styles.gVarsCol}>{globalVariable.key}</div>
      <div className={styles.gVarsCol}>{globalVariable.value}</div>
      <div className={styles.gVarsDelCol} onClick={handleRemoveBtnClick}>
        {showRemoveBtn ? (
          <CloseIcon
            className={styles.gVarsRemoveBtn}
            fontSize="small"
            style={{ color: '#676767' }}
          />
        ) : null}
      </div>
    </div>
  );
}

const GlobalVars = forwardRef<HTMLInputElement, GlobalVarsProps>(
  function GlobalVars(props: GlobalVarsProps, keyInputRef) {
    const { variables, onAddClick, onRemoveClick } = props;
    const [newGlobalVar, setNewGlobalVar] = useState<GlobalVar>(newVar);
    const [disableAddBtn, setDisableAddBtn] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { key, value } = newGlobalVar;

    function handleAddClick() {
      if (typeof onAddClick === 'function') {
        onAddClick(newGlobalVar);
      }
      setNewGlobalVar(newVar);
    }

    function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
      setNewGlobalVar(
        produce((draft) => {
          draft.key = e.target.value;
        })
      );
    }

    function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
      setNewGlobalVar(
        produce((draft) => {
          draft.value = e.target.value;
        })
      );
    }

    function handleEnterKey(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter') {
        if (key && value) {
          if (variables.find((gvar) => gvar.key === key) !== undefined) {
            return;
          }
          if (typeof onAddClick === 'function') {
            onAddClick(newGlobalVar);
          }
          setNewGlobalVar(newVar);
        }
      }
    }

    useEffect(() => {
      if (variables.find((gvar) => gvar.key === key) !== undefined) {
        setDisableAddBtn(true);
        return;
      }

      if (key === '' || value === '') {
        setDisableAddBtn(true);
        return;
      }

      setDisableAddBtn(false);
    }, [key, value, variables]);

    useEffect(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo(
          0,
          scrollContainerRef.current.scrollHeight
        );
      }
    }, [variables]);

    return (
      <div className={styles.gVarsContainer}>
        <div className={clsx(styles.gVarsRow, styles.gVarsRow_padRight)}>
          <div className={styles.gVarsHeading}>Name</div>
          <div className={styles.gVarsHeading}>Value</div>
          <div className={styles.gVarsDelCol}></div>
        </div>
        <div className={styles.gVarsScrollContainer} ref={scrollContainerRef}>
          {variables.map((globalVar) => (
            <VariableRow
              key={globalVar.key}
              globalVariable={globalVar}
              onRemoveBtnClick={onRemoveClick}
            />
          ))}
        </div>
        <div className={clsx(styles.gVarsInputRow, styles.gVarsRow_padRight)}>
          <div className={styles.gVarsInputCol}>
            <input
              type="text"
              ref={keyInputRef}
              value={key}
              onKeyUp={handleEnterKey}
              onChange={handleKeyChange}
            />
          </div>
          <div className={styles.gVarsInputCol}>
            <input
              type="text"
              value={value}
              onKeyUp={handleEnterKey}
              onChange={handleValueChange}
            />
          </div>
          <button
            className={styles.gVarsAddBtn}
            disabled={disableAddBtn}
            onClick={handleAddClick}>
            <AddIcon fontSize="small" style={{ color: '#676767' }} />
          </button>
        </div>
      </div>
    );
  }
);

export { GlobalVars };
export type { GlobalVar };
