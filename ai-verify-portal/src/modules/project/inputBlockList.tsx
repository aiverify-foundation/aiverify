import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import {
  InputDataContext,
  InputDataContextType,
} from 'ai-verify-shared-library/lib';
import { ProjectStore, MapActionTypes } from './projectContext';
import { InputBlock } from 'src/types/plugin.interface';
import InputWidget from './inputWidget';
import {
  WidgetStatus,
  InputBlockState,
  InputBlockStateMap,
} from './inputBlockTypes';
import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import styles from './styles/inputs.module.css';
import clsx from 'clsx';
import { InputBoxWidths } from 'src/types/plugin.interface';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';

type InputBlockListProps = {
  projectStore: ProjectStore;
  inputBlockStates: InputBlockStateMap;
  setInputBlockStates: React.Dispatch<React.SetStateAction<InputBlockStateMap>>;
  userInputList: (InputBlock | InputBlock[] | string)[];
};

type IblockCardProps = {
  iBlock: InputBlock;
  getSummaryFn: (gid: string) => string;
  getValidateFn: (gid: string) => boolean;
  openClickHandler: (iblock: InputBlock) => () => void;
};

function calculateCSSWidth(
  muiWidth: InputBoxWidths | undefined
): string | undefined {
  if (!muiWidth) return;
  switch (muiWidth) {
    case InputBoxWidths.xs:
      return '300px';
    case InputBoxWidths.sm:
      return '500px';
    case InputBoxWidths.md:
      return '700px';
    case InputBoxWidths.lg:
      return '1200px';
    case InputBoxWidths.xl:
      return '1400px';
  }
}

function IblockCard(props: IblockCardProps) {
  const { iBlock, getSummaryFn, getValidateFn, openClickHandler } = props;

  return (
    <div
      id={`ibcard-${iBlock.gid}`}
      className={clsx(
        styles.inputCard,
        iBlock.group ? styles.inputCard__indent : null
      )}>
      <div className={styles.inputDescription} style={{ width: '350px' }}>
        <h4>{iBlock.name}</h4>
        <div className={styles.inputSummary}>{getSummaryFn(iBlock.gid)}</div>
      </div>
      <div className={styles.divider} />
      <div className={styles.inputMain}>
        <p>{iBlock.description}</p>
        <div className={styles.buttonRow}>
          <button
            className="aivBase-button aivBase-button--primary aivBase-button--small"
            onClick={openClickHandler(iBlock)}>
            Open
          </button>
          {!getValidateFn(iBlock.gid) ? (
            <div className={styles.errorMsg}>Invalid Inputs</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function InputBlockList(props: InputBlockListProps) {
  const { projectStore, userInputList, inputBlockStates, setInputBlockStates } =
    props;
  const [currentState, setCurrentState] = useState<InputBlockState | null>(
    null
  );
  const [inputBlockContext, setInputBlockContext] =
    useState<InputDataContextType>({
      data: {},
      meta: {},
    });

  useEffect(() => {
    if (!currentState) return;
    const state = currentState;
    const gid = state.inputBlock.gid;
    if (!state.mdxBundle) {
      // load widget if not cached yet
      const createDynamic = async () => {
        const apiPath = `/api/bundler/${gid}`;
        fetch(apiPath)
          .then(async (res) => {
            if (res.status === 200) {
              const data = await res.json();
              console.log('&&&&&&&&&=/api/bundler');
              console.log(data.code);
              state.status = WidgetStatus.loaded;
              state.mdxBundle = {
                code: data.code,
                frontmatter: data.frontmatter,
              };
              state.open = true;
            } else {
              state.status = WidgetStatus.invalid;
              state.open = true;
            }
            setInputBlockStates((prevState) => ({
              ...prevState,
              [gid]: state,
            }));
          })
          .catch((error) => {
            console.log('error', error);
          })
          .finally(() => {
            document.body.style.cursor = 'default';
          });
      };
      document.body.style.cursor = 'wait';
      createDynamic();
    } else {
      state.open = true;
      setInputBlockStates((prevState) => ({
        ...prevState,
        [gid]: state,
      }));
    }
  }, [currentState]);

  const getSummary = (gid: string): string => {
    if (inputBlockStates[gid])
      return inputBlockStates[gid].summaryFn(projectStore.inputBlockData[gid]);
    else return '';
  };

  const getValidate = (gid: string): boolean => {
    if (inputBlockStates[gid])
      return inputBlockStates[gid].validateFn(projectStore.inputBlockData[gid]);
    else return true;
  };

  const showInputBlock = (gid: string): void => {
    console.log('+++++showInputBlock');
    console.log(currentState);
    const state = inputBlockStates[gid];
    if (currentState && currentState.inputBlock.gid === gid) {
      state.open = true;
      setInputBlockStates((prevState) => ({
        ...prevState,
        [gid]: state,
      }));
    } else {
      const data = projectStore.inputBlockData[gid] || {};
      setInputBlockContext({
        data,
        meta: {},
        onChangeData: (key: string, value: any) =>
          _onChangeData(gid, key, value),
      });
      console.log('+++++setCurrentState');
      setCurrentState(state);
    }
  };

  const closeInputBlock = (): void => {
    if (!currentState)
      // should not happen
      return;
    const state = currentState;
    const gid = state.inputBlock.gid;
    state.open = false;
    setInputBlockStates((prevState) => ({
      ...prevState,
      [gid]: state,
    }));
  };

  const _onChangeData = (gid: string, key: string, value: any) => {
    const data = projectStore.inputBlockData[gid] || {};
    data[key] = value;
    projectStore.dispatchInputBlockData({
      type: MapActionTypes.SET,
      key: gid,
      payload: data,
    });
  };

  function handleOpenBtnClick(iblock: InputBlock) {
    return () => showInputBlock(iblock.gid);
  }

  console.log('--------------------------------------------------------------');
  console.log(currentState);

  return (
    <div className={styles.inputSection}>
      <div className={styles.sectionHeading}>
        <h3 className="screenHeading">Complete Input Blocks</h3>
        <p className="headingDescription">
          Open each input block to provide the information required
        </p>
      </div>
      <Box>
        {userInputList.map((input) => {
          if (typeof input === 'string') {
            return (
              <div className={styles.groupTitle} key={`summarygroup-${input}`}>
                {input}
              </div>
            );
          } else if (Array.isArray(input)) {
            const iblocks = input as InputBlock[];
            return (
              <div
                className={styles.iBlockGroup}
                key={`group-${input[0].group}`}>
                <div className={styles.iBgroupLine} />
                {iblocks.map((ib) => (
                  <IblockCard
                    key={`summary-${ib.gid}`}
                    iBlock={ib}
                    getSummaryFn={getSummary}
                    getValidateFn={getValidate}
                    openClickHandler={handleOpenBtnClick}
                  />
                ))}
              </div>
            );
          } else {
            const iblock = input as InputBlock;
            return (
              <IblockCard
                key={`summary-${iblock.gid}`}
                iBlock={iblock}
                getSummaryFn={getSummary}
                getValidateFn={getValidate}
                openClickHandler={handleOpenBtnClick}
              />
            );
          }
        })}
      </Box>
      <InputDataContext.Provider value={inputBlockContext}>
        {currentState && currentState.open ? (
          <AlertBox
            enableModalOverlay
            renderInPortal
            size={AlertBoxSize.MEDIUM}
            containerStyles={{
              width: currentState.inputBlock.fullScreen
                ? '98vw'
                : calculateCSSWidth(currentState.inputBlock.width),
              height: currentState.inputBlock.fullScreen ? '98vh' : '90vh',
              maxWidth: currentState.inputBlock.fullScreen ? 'none' : '1850px',
            }}
            fixedPosition={AlertBoxFixedPositions.CENTER}
            onCloseIconClick={closeInputBlock}>
            <AlertBox.Header heading={currentState.inputBlock.name} />
            <AlertBox.Body hasFooter>
              <div>
                {currentState.status === WidgetStatus.loaded ? (
                  <InputWidget mdxBundle={currentState.mdxBundle} />
                ) : (
                  <StandardAlert
                    alertType={AlertType.ERROR}
                    headingText="Unable to load widget"
                    disableCloseIcon>
                    <div>Unable to load widget.</div>
                  </StandardAlert>
                )}
              </div>
            </AlertBox.Body>
            <AlertBox.Footer>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}>
                <button
                  className="aivBase-button aivBase-button--primary aivBase-button--small"
                  onClick={closeInputBlock}>
                  OK
                </button>
              </div>
            </AlertBox.Footer>
          </AlertBox>
        ) : null}
      </InputDataContext.Provider>
    </div>
  );
}
