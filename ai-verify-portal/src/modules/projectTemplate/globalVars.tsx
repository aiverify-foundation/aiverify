import AddIcon from '@mui/icons-material/Add';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { GlobalVariable } from 'src/types/projectTemplate.interface';
import CloseIcon from '@mui/icons-material/Close';
import produce from 'immer';
import styles from './styles/rightpanel.module.css';
import clsx from 'clsx';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

type GlobalVar = GlobalVariable;

type GlobalVarsProps = {
  variables: GlobalVar[];
  onEditSave: (index: number, gVar: GlobalVar) => void;
  onAddClick: (variables: GlobalVar) => void;
  onRemoveClick: (variables: GlobalVar) => void;
};

type VariableRowProps = {
  index: number;
  globalVariable: GlobalVar;
  editable?: boolean;
  onEditClick: (idx: number) => void;
  onEditConfirm: () => void;
  setEditGlobalVar: React.Dispatch<React.SetStateAction<GlobalVariable>>;
  onRemoveBtnClick: (globalVar: GlobalVar) => void;
  editedKey?: string;
  editedValue?: string;
  editModeGlobalVar?: GlobalVariable;
  disableAddBtn?: boolean;
  onChange?: (globalVar: GlobalVar, index: number) => void;
};

const newVar = { key: '', value: '' };

function VariableRow(props: VariableRowProps) {
  const {
    index,
    globalVariable,
    onRemoveBtnClick,
    onEditClick,
    onEditConfirm,
    editable = true,
    setEditGlobalVar,
    editModeGlobalVar,
    disableAddBtn = false,
    onChange,
  } = props;
  const [showRemoveBtn, setShowRemoveBtn] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const isProjectInfoVars =
    globalVariable.key == 'name' ||
    globalVariable.key == 'description' ||
    globalVariable.key == 'reportTitle' ||
    globalVariable.key == 'company';

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

  function handleVarClick() {
    if (!editable) return;
    if (isProjectInfoVars) return;
    setIsEditMode(true);
    setEditGlobalVar({ ...globalVariable });
    if (onEditClick) onEditClick(index);
  }

  function handleEnterKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && editModeGlobalVar) {
      setIsEditMode(false);
      if (onEditConfirm) onEditConfirm();
    }
  }

  function handeEditConfirm() {
    setIsEditMode(false);
    if (onEditConfirm) onEditConfirm();
  }

  function handleEditKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditGlobalVar(
      produce((draft) => {
        draft.key = e.target.value;
      })
    );
  }

  function handleEditValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditGlobalVar(
      produce((draft) => {
        draft.value = e.target.value;
      })
    );
  }

  useEffect(() => {
    if (onChange && editModeGlobalVar != undefined)
      onChange(editModeGlobalVar, index);
  }, [editModeGlobalVar]);

  return !isEditMode ? (
    <div
      id={`varkey-${globalVariable.key}`}
      className={styles.gVarsRow}
      onMouseOver={handleVarMouseOver}
      onMouseLeave={handleVarMouseLeave}
      onClick={handleVarClick}>
      <div className={styles.gVarsCol}>{globalVariable.key}</div>
      <div className={styles.gVarsCol}>
        {globalVariable.value.length > 21 ? (
          <Tooltip
            content={globalVariable.value}
            backgroundColor="#676767"
            fontColor="#FFFFFF"
            position={TooltipPosition.top}>
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                paddingLeft: 5,
              }}>
              {globalVariable.value}
            </div>
          </Tooltip>
        ) : (
          <div>{globalVariable.value}</div>
        )}
      </div>
      <div className={styles.gVarsDelCol} onClick={handleRemoveBtnClick}>
        {showRemoveBtn && !isProjectInfoVars ? (
          <CloseIcon
            className={styles.gVarsRemoveBtn}
            fontSize="small"
            style={{ color: '#676767' }}
          />
        ) : null}
      </div>
    </div>
  ) : (
    <div className={clsx(styles.gVarsInputRow)}>
      <div className={styles.gVarsInputCol}>
        <input
          type="text"
          value={editModeGlobalVar && editModeGlobalVar.key}
          onChange={handleEditKeyChange}
          onKeyUp={handleEnterKey}
        />
      </div>
      <div className={styles.gVarsInputCol}>
        <input
          type="text"
          value={editModeGlobalVar && editModeGlobalVar.value}
          onChange={handleEditValueChange}
          onKeyUp={handleEnterKey}
        />
      </div>
      <button
        className={styles.gVarsAddBtn}
        onClick={handeEditConfirm}
        disabled={disableAddBtn}>
        <AddIcon fontSize="small" style={{ color: '#676767' }} />
      </button>
    </div>
  );
}

const GlobalVars = forwardRef<HTMLInputElement, GlobalVarsProps>(
  function GlobalVars(props: GlobalVarsProps, keyInputRef) {
    const { variables, onAddClick, onRemoveClick, onEditSave } = props;
    const [newGlobalVar, setNewGlobalVar] = useState<GlobalVar>(newVar);
    const [disableAddBtn, setDisableAddBtn] = useState(true);
    const [disableEditingAddBtn, setDisableEditingAddBtn] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [editGlobalVar, setEditGlobalVar] = useState<GlobalVar>(newVar);
    const [editIndex, setEditIndex] = useState<number>();
    const { key, value } = newGlobalVar;

    function handleAddClick() {
      if (typeof onAddClick === 'function') {
        onAddClick(newGlobalVar);
      }
      setNewGlobalVar(newVar);
    }

    function handleOnDeleteClick(gvar: GlobalVariable) {
      if (onRemoveClick) onRemoveClick(gvar);
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

    function handeOnGlobalVarEdit(editedIndex: number) {
      setIsEditing(true);
      setEditIndex(editedIndex);
    }

    function handleOnGlobalVarEditConfirm() {
      setIsEditing(false);
      if (editIndex != undefined) {
        onEditSave(editIndex, editGlobalVar);
      }
    }

    function handleOnGlobalVarEditChange(
      editingVar: GlobalVariable,
      idx: number
    ) {
      if (!isEditing) return;
      if (
        variables.find(
          (gvar, i) => gvar.key === editingVar.key && i !== idx
        ) !== undefined
      ) {
        setDisableEditingAddBtn(true);
        return;
      }

      if (editingVar.key === '' || editingVar.value === '') {
        setDisableEditingAddBtn(true);
        return;
      }

      setDisableEditingAddBtn(false);
    }

    useEffect(() => {
      if (isEditing) return;
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
      setIsEditing(false);
    }, [variables]);

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
          {variables.map((globalVar, idx) => (
            <VariableRow
              index={idx}
              editable={!isEditing}
              key={globalVar.key}
              globalVariable={globalVar}
              onRemoveBtnClick={handleOnDeleteClick}
              onEditClick={handeOnGlobalVarEdit}
              onEditConfirm={handleOnGlobalVarEditConfirm}
              onChange={handleOnGlobalVarEditChange}
              setEditGlobalVar={setEditGlobalVar}
              editModeGlobalVar={editGlobalVar}
              disableAddBtn={disableEditingAddBtn}
            />
          ))}
        </div>
        <div className={clsx(styles.gVarsInputRow, styles.gVarsRow_padRight)}>
          <div className={styles.gVarsInputCol}>
            <input
              disabled={isEditing}
              type="text"
              ref={keyInputRef}
              value={key}
              onKeyUp={handleEnterKey}
              onChange={handleKeyChange}
            />
          </div>
          <div className={styles.gVarsInputCol}>
            <input
              disabled={isEditing}
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
