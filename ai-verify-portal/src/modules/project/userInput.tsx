import { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { getMDXExport } from 'mdx-bundler/client';

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import ErrorIcon from '@mui/icons-material/Error';
import { ProjectStore, MapActionTypes } from './projectContext';
import {
  WidgetStatus,
  InputBlockState,
  InputBlockStateMap,
} from './inputBlockTypes';
import { InputBlock } from 'src/types/plugin.interface';
import InputBlockList from './inputBlockList';
import AlgorithmList from './algorithmList';
import SelectDatasetAndModelSection from './selectDatasetAndModel';
import styles from './styles/inputs.module.css';
import { CollapsibleList } from './collapsibleList';
import { Stack } from '@mui/material';

type Props = {
  projectStore: ProjectStore;
  onSelectDatasetBtnClick: () => void;
  onSelectModelBtnClick: () => void;
  onSelectGroundTruthBtnClick: () => void;
  setInvalidInputs: Dispatch<SetStateAction<boolean>>;
};

type InputDisplay = InputBlock | InputBlock[] | string;

const MyStepConnector = styled(StepConnector)(() => ({
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#bfbfbf',
    marginLeft: 6,
  },
}));

export default function UserInputComponent({
  projectStore,
  onSelectDatasetBtnClick,
  onSelectModelBtnClick,
  onSelectGroundTruthBtnClick,
  setInvalidInputs,
}: Props) {
  const [inputBlockStates, setInputBlockStates] = useState<InputBlockStateMap>(
    {}
  );
  const { algorithms, inputBlocks } = projectStore.dependencies;

  useEffect(() => {
    if (!projectStore.dependencies.inputBlocks) return;
    for (const ib of projectStore.dependencies.inputBlocks) {
      const data = projectStore.inputBlockData[ib.gid];
      if (!data) {
        projectStore.dispatchInputBlockData({
          type: MapActionTypes.SET,
          key: ib.gid,
          payload: {},
        });
      }
    }
  }, [inputBlocks]);

  const iblocksList = useMemo<InputDisplay[]>(() => {
    if (!inputBlocks) return [[], []];

    const groups: { [groupname: string]: InputBlock[] } = {};
    const nogroup: InputBlock[] = [];

    for (const ib of inputBlocks) {
      if (ib.group && ib.group.length > 0) {
        groups[ib.group] = groups[ib.group] || [];
        groups[ib.group].push(ib);
      } else {
        nogroup.push(ib);
      }
    }

    const iblocksList: InputDisplay[] = [];
    for (const [groupname, ibArray] of Object.entries<InputBlock[]>(groups)) {
      iblocksList.push(groupname);
      iblocksList.push([...ibArray]);
    }
    iblocksList.push(...nogroup);
    return iblocksList;
  }, [inputBlocks]);

  useEffect(() => {
    const fetchSummaries = async () => {
      const states = {} as InputBlockStateMap;
      let valid = true;
      for (const inputBlock of projectStore.dependencies.inputBlocks) {
        const createDynamic = () => {
          const apiPath = `/api/bundler/summary/${inputBlock.gid}`;
          // console.log("apiPath", apiPath)
          return new Promise<string>((resolve, reject) => {
            fetch(apiPath)
              .then(async (res) => {
                if (res.status === 200) {
                  const data = await res.json();
                  if (!data.code) return reject('Invalid MDX');
                  // console.log("data", data);
                  resolve(data.code);
                } else {
                  reject('Invalid MDX');
                }
              })
              .catch((error) => {
                console.log('error', error);
                reject(error);
              });
          });
        };
        try {
          // const {summary, progress} = await import(`../../../plugins/${inputBlock.pluginGID}/inputs/${inputBlock.cid}.ts`);
          const code = await createDynamic();
          const mdxExport = getMDXExport(code);
          const state: InputBlockState = {
            open: false,
            status: WidgetStatus.unloaded,
            inputBlock,
            summaryFn: mdxExport.summary,
            progressFn: mdxExport.progress,
            validateFn: mdxExport.validate,
          };
          if (
            valid &&
            state.validateFn &&
            projectStore.inputBlockData[inputBlock.gid] &&
            !state.validateFn(projectStore.inputBlockData[inputBlock.gid])
          )
            valid = false;
          states[inputBlock.gid] = state;
        } catch (err) {
          console.log('Error loading summary file', err);
        }
      }
      setInputBlockStates((prevState) => ({
        ...prevState,
        ...states,
      }));
      setInvalidInputs(!valid);
    };
    fetchSummaries();
  }, []);

  useEffect(() => {
    let valid = true;
    for (const ib of projectStore.dependencies.inputBlocks) {
      if (!inputBlockStates[ib.gid] || !inputBlockStates[ib.gid].validateFn)
        continue;
      if (!getInputBlockValidation(ib.gid)) {
        valid = false;
        break;
      }
    }
    setInvalidInputs(!valid);
  }, [projectStore.inputBlockData]);

  const getInputBlockProgress = (gid: string): number => {
    if (inputBlockStates[gid])
      return inputBlockStates[gid].progressFn(projectStore.inputBlockData[gid]);
    else return 0;
  };

  const getInputBlockValidation = (gid: string): boolean => {
    if (inputBlockStates[gid])
      return inputBlockStates[gid].validateFn(projectStore.inputBlockData[gid]);
    // if not exists, assume always valid
    else return true;
  };

  function ProgressStepIcon(stepItem: InputBlock | string, idx?: number) {
    return function Comp(props: StepIconProps) {
      if (typeof stepItem === 'string') {
        let completed = true;
        let error = false;
        if (idx !== undefined) {
          if (Array.isArray(iblocksList[idx + 1])) {
            const groupOfiblocks = iblocksList[idx + 1] as InputBlock[];
            for (let i = 0; i < groupOfiblocks.length; i++) {
              if (!getInputBlockValidation(groupOfiblocks[i].gid)) {
                error = true;
                break;
              }
              if (getInputBlockProgress(groupOfiblocks[i].gid) < 100) {
                completed = false;
                break;
              }
            }
          }
        }
        if (error)
          return (
            <ErrorIcon color="error" fontSize="large" sx={{ width: '38px' }} />
          );
        if (completed)
          return (
            <CheckCircleIcon
              color="primary"
              fontSize="large"
              sx={{ width: '38px' }}
            />
          );
        return (
          <CircleIcon color="primary" fontSize="large" sx={{ width: '38px' }} />
        );
      } else {
        const ib = stepItem as InputBlock;
        const fontSize = ib.group && ib.group.length > 0 ? 'small' : 'large';
        const color = ib.group && ib.group.length > 0 ? 'secondary' : 'primary';
        const valid = getInputBlockValidation(ib.gid);
        if (!valid)
          return (
            <ErrorIcon
              color="error"
              fontSize={fontSize}
              sx={{ width: '38px' }}
            />
          );
        if (props.completed)
          return (
            <CheckCircleIcon
              color={color}
              fontSize={fontSize}
              sx={{ width: '38px' }}
            />
          );
        else
          return (
            <CircleIcon
              color={color}
              fontSize={fontSize}
              sx={{ width: '38px' }}
            />
          );
      }
    };
  }

  function AlgoStepIcon({ algoId }: { algoId: string }) {
    if (projectStore.isAlgorithmValid(algoId))
      return <CheckCircleIcon style={{ color: '#702F8A', fontSize: '28px' }} />;

    return <ErrorIcon style={{ color: '#f73939', fontSize: '29px' }} />;
  }

  function handleAlgoItemClick(algoId: string) {
    return () => {
      const card = document.getElementById(`algocard-${algoId}`);
      if (card) {
        card.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
        card.style.borderColor = '#991E66';
        setTimeout(() => {
          card.style.borderColor = 'transparent';
        }, 1000);
      }
    };
  }

  function handleIblockItemClick(iblockId: string) {
    return () => {
      const card = document.getElementById(`ibcard-${iblockId}`);
      if (card) {
        card.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
        card.style.borderColor = '#991E66';
        setTimeout(() => {
          card.style.borderColor = 'transparent';
        }, 1000);
      }
    };
  }

  return (
    <div className={styles.container__limits}>
      <div className={styles.inputsLayout}>
        <div id="inputsLeftpanel" className={styles.stickyInputsLeftpanel}>
          <div className={styles.projectDetail}>
            <h4>Project</h4>
            <h3>{projectStore.projectInfo.name}</h3>
            {/* <div>TODO - template name</div> */}
          </div>
          {/* Missing */}
          {projectStore.dependencies.missing.length > 0 && (
            <Accordion disableGutters={true} sx={{ mt: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ bgcolor: 'background.paper' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignContent: 'center',
                    width: '100%',
                  }}>
                  <Box sx={{ width: '30px', mt: 0.5 }}>
                    <ErrorIcon fontSize="small" color="error" />
                  </Box>
                  <Typography variant="subtitle1" color="error">
                    Missing Dependencies
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: 'background.default' }}>
                {projectStore.dependencies.missing && (
                  <Stack>
                    {projectStore.dependencies.missing.map((item) => (
                      <Box key={`missing-${item.gid}`}>{item.gid}</Box>
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {algorithms && algorithms.length ? (
            <CollapsibleList
              headerContent={
                <CollapsibleList.Header>
                  <DirectionsRunIcon />
                  <span style={{ color: '#676767', fontWeight: 500 }}>
                    Tests Arguments
                  </span>
                </CollapsibleList.Header>
              }
              defaultExpanded
              style={{ marginTop: '10px' }}>
              {algorithms.map((algo) => (
                <CollapsibleList.Item key={algo.gid}>
                  <div
                    className={styles.itemWrapper}
                    onClick={handleAlgoItemClick(algo.gid)}>
                    <AlgoStepIcon algoId={algo.gid} />
                    <div className={styles.itemText}>{algo.name}</div>
                  </div>
                </CollapsibleList.Item>
              ))}
            </CollapsibleList>
          ) : null}

          {inputBlocks && inputBlocks.length ? (
            <CollapsibleList
              headerContent={
                <CollapsibleList.Header>
                  <DynamicFormIcon />
                  <span style={{ color: '#676767', fontWeight: 500 }}>
                    Input Blocks Progress
                  </span>
                </CollapsibleList.Header>
              }
              defaultExpanded
              style={{ marginTop: '10px' }}>
              <div className={styles.iBlockStepperWrapper}>
                {iblocksList.map((step, idx) => {
                  if (typeof step === 'string') {
                    const groupedSteps = iblocksList[idx + 1];
                    return (
                      <div
                        key={`stepper-${step}`}
                        style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <Stepper
                          orientation="vertical"
                          nonLinear={true}
                          style={{ textAlign: 'center' }}
                          connector={<MyStepConnector />}>
                          <Step key={step}>
                            <StepLabel
                              StepIconComponent={ProgressStepIcon(step, idx)}>
                              <div
                                style={{ color: '#676767', fontWeight: '600' }}>
                                {step}
                              </div>
                            </StepLabel>
                          </Step>
                          {Array.isArray(groupedSteps) &&
                            groupedSteps.map((groupStepItem) => {
                              const ib = groupStepItem as InputBlock;
                              return (
                                <Step
                                  key={`step${ib.gid}`}
                                  completed={
                                    getInputBlockProgress(ib.gid) >= 100
                                  }>
                                  <StepLabel
                                    StepIconComponent={ProgressStepIcon(ib)}>
                                    <div
                                      style={{
                                        cursor: 'pointer',
                                        color: '#676767',
                                        fontWeight: '400',
                                      }}
                                      onClick={handleIblockItemClick(ib.gid)}>
                                      {ib.name}
                                    </div>
                                  </StepLabel>
                                </Step>
                              );
                            })}
                        </Stepper>
                      </div>
                    );
                  } else if (Array.isArray(step)) {
                    return null;
                  } else {
                    const ib = step as InputBlock;
                    return (
                      <div
                        key={`stepper-${ib.gid}`}
                        style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <Stepper
                          orientation="vertical"
                          nonLinear={true}
                          style={{ textAlign: 'center' }}
                          connector={<MyStepConnector />}>
                          <Step
                            key={ib.gid}
                            completed={getInputBlockProgress(ib.gid) >= 100}>
                            <StepLabel StepIconComponent={ProgressStepIcon(ib)}>
                              <div
                                style={{
                                  cursor: 'pointer',
                                  color: '#676767',
                                  fontWeight: '600',
                                }}
                                onClick={handleIblockItemClick(ib.gid)}>
                                {ib.name}
                              </div>
                            </StepLabel>
                          </Step>
                        </Stepper>
                      </div>
                    );
                  }
                })}
              </div>
            </CollapsibleList>
          ) : null}
        </div>

        <div id="inputsRightPanel" className={styles.inputsRightpanel}>
          {algorithms && algorithms.length ? (
            <div>
              <SelectDatasetAndModelSection
                projectStore={projectStore}
                showGroundTruth={projectStore.requireGroundTruth}
                onSelectGroundTruthDataset={onSelectGroundTruthBtnClick}
                onSelectDataset={onSelectDatasetBtnClick}
                onSelectModel={onSelectModelBtnClick}
              />
              <AlgorithmList projectStore={projectStore} />
            </div>
          ) : null}
          {inputBlocks && inputBlocks.length ? (
            <InputBlockList
              projectStore={projectStore}
              userInputList={iblocksList}
              inputBlockStates={inputBlockStates}
              setInputBlockStates={setInputBlockStates}
            />
          ) : null}
          {(!projectStore.dependencies.inputBlocks ||
            projectStore.dependencies.inputBlocks.length == 0) &&
            (!projectStore.dependencies.algorithms ||
              projectStore.dependencies.algorithms.length == 0) && (
              <div style={{ marginTop: 25 }}>
                <p>
                  No input blocks and technical tests required for this report.{' '}
                  <br /> Click Next to generate report.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
