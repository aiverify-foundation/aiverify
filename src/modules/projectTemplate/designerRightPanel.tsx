import React, { PropsWithChildren, useCallback, useRef, useState } from 'react';
import { ARUActionTypes, ProjectTemplateStore } from './projectTemplateContext';
import { Accordion, AccordionDetails } from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import ErrorIcon from '@mui/icons-material/Error';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Algorithm, InputBlock } from 'src/types/plugin.interface';
import { BaseMuiAccordionSummary } from 'src/components/baseMuiAccordionSummary';
import { GlobalVar, GlobalVars } from './globalVars';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import produce from 'immer';
import styles from './styles/rightpanel.module.css';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';

type RightPanelProps = {
  projectStore: ProjectTemplateStore;
}

type DisplayDependancyProps = {
  id: string;
  listNum?: number;
  dependency: InputBlock | Algorithm;
}

type MoreMenuProps<T> = {
  items: T[];
  onItemClick: (id: string) => void;
}

const AccordionId = {
  GLOBAL_VARS:'globalVars',
  TESTS_TORUN: 'testToRun',
  INPUT_BLOCKS:'inputBlocks'
}

function DependencyDetails({ id, dependency, listNum }: DisplayDependancyProps) {
  const [showDesc, setShowDesc] = useState(false);

  return (
    <div id={`algo-${id}`} className={styles.depedencyDetails}>
      <div className={styles.depedencyHeading} onClick={() => setShowDesc(prev => !prev)}>
        <span style={{ marginRight: '5px'}}>{listNum}.</span> <span className={styles.headingText}>{dependency.name}</span>
      </div>
      {showDesc ? <div className={styles.depedencyDesc}>{dependency.description}</div> : null}
    </div>
  )
}

function MoreMenu(props: MoreMenuProps<Algorithm | InputBlock>) {
  const { items, onItemClick } = props;
  const menuTimer = useRef<NodeJS.Timeout>();
  const [showMenu, setShowMenu] = useState(false);

  function delayHideMenu() {
    menuTimer.current = setTimeout(() => {
      setShowMenu(false);
    }, 300);
  }

  function cancelMenuTimer() {
    if (menuTimer.current) {
      clearTimeout(menuTimer.current);
    }
  }

  function handleIconMouseEnter() {
    cancelMenuTimer();
    setShowMenu(true);
  }

  function handleIconMouseLeave() {
    delayHideMenu();
  }

  function handleMenuMouseEnter() {
    cancelMenuTimer();
  }

  function handleMenuMouseLeave() {
    delayHideMenu();
  }

  function handleMenuItemClick(id: string) {
    return () => {
      onItemClick(id);
      setShowMenu(false);
    }
  }

  return <div style={{
    display: 'flex',
    position: 'relative',
    width: '100%',
    zIndex: 102,
    justifyContent: 'flex-start'
  }}>
    <MoreHorizIcon
      style={{ cursor: 'pointer', marginLeft: '5px', marginTop: '2px', color: '#702F8A'}}
      onMouseEnter={handleIconMouseEnter}
      onMouseLeave={handleIconMouseLeave}
    />
    {showMenu ? 
      <ListMenu
        containerStyles={{
          position: 'absolute',
          top: '25px',
          left: '10px',
          zIndex: 1000,
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}>
        {items.map(item => 
          <ListMenuItem
            key={item.gid}
            id={item.gid}
            displayText={item.name}
            onClick={handleMenuItemClick(item.gid)}
            style={{ fontSize: '14px'}} />
          )}
      </ListMenu> : null
    }
  </div>
}

function DesignerRightPanel(props: PropsWithChildren<RightPanelProps>) {
  const {
    projectStore,
    children
  } = props;
  const [globalVariables, setGlobalVariables] = useState<GlobalVar[]>(() => projectStore.globalVars);
  const globalVarsKeyInputRef = useRef<HTMLInputElement>(null);
  const algorithms = projectStore.dependencies.algorithms.slice();
  const inputBlocks = projectStore.dependencies.inputBlocks.slice();

  algorithms.sort((a, b) => a.name < b.name ? -1 : 1);
  inputBlocks.sort((a, b) => a.name < b.name ? -1 : 1);

  function handleAddGlobalVarClick(newGlobalVar: GlobalVar) {
    setGlobalVariables(
      produce(draft => { draft.push(newGlobalVar) })
    );

    if (globalVarsKeyInputRef.current)
      globalVarsKeyInputRef.current.focus();

    projectStore.dispatchGlobalVars({ type: ARUActionTypes.ADD, payload: newGlobalVar })
  }

  function handleRemoveGlobalVarClick(selectedGlobalVar: GlobalVar) {
    setGlobalVariables(
      produce(draft => {
        const idx = draft.findIndex(gVar => gVar.key === selectedGlobalVar.key);
        draft.splice(idx, 1);
      })
    )
    const index = globalVariables.findIndex(gvar => gvar.key === selectedGlobalVar.key);
    projectStore.dispatchGlobalVars({ type: ARUActionTypes.REMOVE, index })
  }

  function handleAlgoMenuItemClick(algoId: string) {
    document.getElementById(`algo-${algoId}`)?.scrollIntoView({ behavior: 'smooth'});
  }

  function handleIBlockMenuItemClick(iblockId: string) {
    document.getElementById(`algo-${iblockId}`)?.scrollIntoView({ behavior: 'smooth'});
  }

  const handleOnGlobalVarsExpandedChange = useCallback((e: React.SyntheticEvent, expanded: boolean) => {
    setTimeout(() => {
      if (expanded && globalVarsKeyInputRef.current)
        globalVarsKeyInputRef.current.focus();
      });
  }, []);

  return (
    <div id="rightPanel" className={styles.rightPanel}>
      <div className={styles.stickyPanelContainer}>
        {children}
        <div className={styles.stickyRightAccordionContainer}>
          <div className="propertiesAccordion">

            <Accordion id={AccordionId.GLOBAL_VARS} disableGutters
              onChange={handleOnGlobalVarsExpandedChange}>
              <BaseMuiAccordionSummary expandiconstyles={{ color: '#702F8A' }}>
                <SettingsIcon fontSize='small' color='primary'/>
                <div className={styles.accordionHeading}>Global Variables</div>
              </BaseMuiAccordionSummary>
              <AccordionDetails>
                <GlobalVars
                  variables={globalVariables}
                  onAddClick={handleAddGlobalVarClick}
                  onRemoveClick={handleRemoveGlobalVarClick}
                  ref={globalVarsKeyInputRef}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion
              id={AccordionId.TESTS_TORUN}
              disableGutters
              disabled={algorithms.length === 0}
              defaultExpanded={algorithms.length > 0}>
              <BaseMuiAccordionSummary expandiconstyles={{ color: '#702F8A' }}>
                <DirectionsRunIcon fontSize='small' color='primary' />
                <div className={styles.accordionHeadingWrapper}>
                  <div className={styles.accordionHeading}>Tests to Run</div>
                  <div className={styles.indicatorsGroup}>
                    { algorithms.length > 5 ?
                      <ErrorOutlineIcon className={styles.indicatorWarningIcon} /> : null
                    }
                    <div className={styles.testsCountChip}>{algorithms.length}</div>
                  </div>
                </div>
              </BaseMuiAccordionSummary>
              <AccordionDetails>
              {/* {algorithms.length > 1 ?
                <MoreMenu items={algorithms} onItemClick={handleAlgoMenuItemClick}/> : null
              } */}
              {algorithms.length > 5 ? 
                <div style={{ padding: '5px', position: 'relative', zIndex: 101}}>
                  <StandardAlert
                    alertType={AlertType.WARNING}
                    disableCloseIcon
                    headingText='More than 5 tests'
                    style={{ padding: '10px 30px 10px 20px', minHeight: 'auto'}}
                    headingStyle={{ fontSize: '15px'}}
                    iconStyle={{ fontSize: '29px'}}>
                    <div style={{ fontSize: '14px'}}>Report generation might take a long time.</div>
                  </StandardAlert>
                </div>  : null 
              }
                {algorithms && (
                  <div className={styles.depedencyDetailsScrollContainer}>
                    {algorithms.map((algo, idx) =>
                      <DependencyDetails dependency={algo} key={`ibdep-${algo.gid}`} id={algo.gid} listNum={idx + 1}/>)}
                  </div>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              id={AccordionId.INPUT_BLOCKS}
              disableGutters
              disabled={inputBlocks.length === 0}
              defaultExpanded={inputBlocks.length > 0}>
              <BaseMuiAccordionSummary expandiconstyles={{ color: '#702F8A' }}>
                <DynamicFormIcon fontSize='small' color='primary' />
                <div className={styles.accordionHeadingWrapper}>
                  <div className={styles.accordionHeading}>Input Blocks</div>
                  <div className={styles.testsCountChip}>{inputBlocks.length}</div>
                </div>
              </BaseMuiAccordionSummary>
              <AccordionDetails>
                {/* {inputBlocks.length > 1 ?
                  <MoreMenu items={inputBlocks} onItemClick={handleIBlockMenuItemClick}/> : null
                } */}
                {inputBlocks && (
                  <div className={styles.depedencyDetailsScrollContainer}>
                    {inputBlocks.map((ib, idx) =>
                      <DependencyDetails dependency={ib} key={`ibdep-${ib.gid}`} id={ib.gid} listNum={idx + 1}/>)}
                  </div>
                )}
              </AccordionDetails>
            </Accordion>

            {projectStore.dependencies.missing.length > 0 && (
              <Accordion disableGutters>
                <BaseMuiAccordionSummary expandiconstyles={{ color: '#702F8A' }}>
                  <ErrorIcon fontSize='small' color="error" />
                  <div className={styles.accordionHeading}>Missing Dependencies</div>
                </BaseMuiAccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'background.default' }}>
                  {projectStore.dependencies.missing && (
                    <div>
                      {projectStore.dependencies.missing.map(item => (
                        <div key={`missing-${item.gid}`}>{item.gid}</div>
                      ))}
                    </div>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { DesignerRightPanel };