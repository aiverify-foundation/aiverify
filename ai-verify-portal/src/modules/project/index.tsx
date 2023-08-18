import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import Project, { ProjectReportStatus } from 'src/types/project.interface';
import { useProjectStore } from './projectContext';

import { Algorithm } from 'src/types/plugin.interface';
import ProjectInformationComponent from './projectInformation';
import SelectTemplate from './selectTemplate';
import CanvasComponent from '../projectTemplate/canvas';
import UserInputComponent from './userInput';
import PluginManagerType from 'src/types/pluginManager.interface';
import {
  DatasetModelFilePicker,
  FileSelectMode,
} from './datasetModelFilePicker';
import { ReportDesignerHeader } from './header';
import { formatDate } from 'src/lib/utils';
import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';

type Props = {
  data: Project;
  pluginManager: PluginManagerType;
  designStep?: number;
};

export enum ProjectStep {
  CaptureProjectInfo = 1,
  SelectTemplate = 2,
  DesignReport = 3,
  CaptureTestInput = 4,
  SelectDataset = 5,
}

export const BlankTemplateId = 'blank';

/**
 * Main project module component
 */
export default function ProjectModule({
  data,
  pluginManager,
  designStep,
}: Props) {
  const router = useRouter();
  const projectStore = useProjectStore(data, pluginManager);
  const [step, setStep] = useState(
    projectStore.isNew
      ? ProjectStep.CaptureProjectInfo
      : ProjectStep.SelectTemplate
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [showSelectAlgoDialog, setShowSelectAlgoDialog] = useState(false);
  const [selectedProjectTemplateId, setSelectedProjectTemplateId] = useState<
    string | 'blank' | undefined
  >();
  const [validAlgos, setValidAlgos] = useState<Algorithm[]>([]);
  const [invalidAlgos, setInvalidAlgos] = useState<Algorithm[]>([]);
  const [disableNextBtn, setDisableNextBtn] = useState(false);
  const [filePickerMode, setFilePickerMode] = useState<FileSelectMode>(
    FileSelectMode.DATASET
  );
  const [invalidInputs, setInvalidInputs] = useState<boolean>(false);

  function handleProjectTemplateSelected(
    templateId: string | 'blank' | undefined
  ) {
    setSelectedProjectTemplateId(templateId);
    if (templateId === undefined) {
      setDisableNextBtn(true);
      return;
    }
    setDisableNextBtn(false);
  }

  async function goForward() {
    switch (step) {
      case ProjectStep.CaptureProjectInfo:
        setStep(
          projectStore.isNew
            ? ProjectStep.SelectTemplate
            : ProjectStep.DesignReport
        );
        break;
      case ProjectStep.SelectTemplate:
        if (selectedProjectTemplateId == undefined) return;
        if (selectedProjectTemplateId == BlankTemplateId) {
          if (projectStore.isNew) {
            await projectStore.createProject();
            setStep(ProjectStep.DesignReport);
            return;
          }
        }
        if (projectStore.isNew) {
          const id = await projectStore.createProjectFromTemplate(
            selectedProjectTemplateId
          );
          if (id) router.push(`/project/${id}`);
        }
        break;
      case ProjectStep.CaptureTestInput:
        if (
          projectStore.reportStatus === ProjectReportStatus.GeneratingReport
        ) {
          router.push(`/reportStatus/${data.id}`);
        } else {
          setValidAlgos(
            projectStore.dependencies.algorithms.filter((algo) =>
              projectStore.isAlgorithmValid(algo.gid)
            )
          );
          setInvalidAlgos(
            projectStore.dependencies.algorithms.filter(
              (algo) => !projectStore.isAlgorithmValid(algo.gid)
            )
          );
          setShowSelectAlgoDialog(true);
        }
        break;
      default:
        setStep(step + 1);
        break;
    }
  }

  const goBack = () => {
    switch (step) {
      case ProjectStep.DesignReport:
        setStep(ProjectStep.CaptureProjectInfo);
        break;
      default:
        setStep(step - 1);
        break;
    }
  };

  const generateReport = () => {
    const gids = validAlgos.map((e) => e.gid);

    projectStore
      .generateReport(gids)
      .then(() => {
        router.push(`/reportStatus/${projectStore.id}`);
      })
      .catch((err) => {
        setErrorMessage(`Generate report error: ${err.message}`);
        console.error('Generate report error', err);
      });
  };

  function handleProjectInfoChange(isProjectInfoInputValid: boolean) {
    setDisableNextBtn(isProjectInfoInputValid === false);
  }

  const lastSavedTime = projectStore.lastSavedTime
    ? formatDate(projectStore.lastSavedTime)
    : undefined;

  const selectDatasetBtnClickHandler = () => {
    setFilePickerMode(FileSelectMode.DATASET);
    setStep(step + 1);
  };

  const selectModelBtnClickHandler = () => {
    setFilePickerMode(FileSelectMode.MODEL);
    setStep(step + 1);
  };

  const selectGroundTruthBtnClickHandler = () => {
    setFilePickerMode(FileSelectMode.GROUNDTRUTH);
    setStep(step + 1);
  };

  const datasetSelectedCallback = () => {
    setStep(step - 1);
  };

  const modelSelectedCallback = () => {
    setStep(step - 1);
  };

  const groundTruthSelectedCallback = () => {
    setStep(step - 1);
  };

  useEffect(() => {
    if (designStep != undefined) {
      setStep(designStep);
      return;
    }
    if (!projectStore.isNew) setStep(ProjectStep.DesignReport);
  }, []);

  useEffect(() => {
    if (!projectStore.isNew) return;
    if (
      step === ProjectStep.SelectTemplate &&
      selectedProjectTemplateId == undefined
    ) {
      setDisableNextBtn(true);
    }
  }, [step]);

  useEffect(() => {
    if (step == ProjectStep.CaptureTestInput) setDisableNextBtn(invalidInputs);
  }, [invalidInputs]);

  return (
    <div>
      <ReportDesignerHeader
        projectStore={projectStore}
        onBackBtnClick={goBack}
        onNextBtnClick={goForward}
        lastSavedTime={lastSavedTime}
        isTemplate={false}
        designStep={step}
        disableSaveMenu={projectStore.isNew}
        disableSaveBtn={projectStore.isNew}
        disableNextBtn={disableNextBtn}
      />
      <div className="layoutContentArea">
        <div className="scrollContainer">
          {step === ProjectStep.CaptureProjectInfo && (
            <ProjectInformationComponent
              projectStore={projectStore}
              onProjectInfoChange={handleProjectInfoChange}
            />
          )}
          {step === ProjectStep.SelectTemplate && (
            <SelectTemplate
              onProjectTemplateSelected={handleProjectTemplateSelected}
              selectedId={selectedProjectTemplateId}
            />
          )}
          {step === ProjectStep.DesignReport && (
            <CanvasComponent projectStore={projectStore} />
          )}
          {step === ProjectStep.CaptureTestInput && (
            <UserInputComponent
              projectStore={projectStore}
              onSelectDatasetBtnClick={selectDatasetBtnClickHandler}
              onSelectModelBtnClick={selectModelBtnClickHandler}
              onSelectGroundTruthBtnClick={selectGroundTruthBtnClickHandler}
              setInvalidInputs={setInvalidInputs}
            />
          )}
          {step === ProjectStep.SelectDataset && (
            <DatasetModelFilePicker
              mode={filePickerMode}
              projectStore={projectStore}
              onGroundTruthSelected={groundTruthSelectedCallback}
              onDatasetSelected={datasetSelectedCallback}
              onModelSelected={modelSelectedCallback}
            />
          )}
          {/* 👇 TODO: clean up or replace snackbar. Probably unused now */}
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={errorMessage.length > 0}
            autoHideDuration={5000}
            onClose={() => {
              setErrorMessage('');
            }}>
            <Alert variant="filled" severity="error">
              {errorMessage}
            </Alert>
          </Snackbar>
          {projectStore.dependencies.algorithms && showSelectAlgoDialog ? (
            <AlertBox
              renderInPortal
              enableModalOverlay
              size={AlertBoxSize.AUTO}
              fixedPosition={AlertBoxFixedPositions.CENTER}
              onCloseIconClick={() => setShowSelectAlgoDialog(false)}>
              <AlertBox.Header heading="Confirm Generate Report" />
              <AlertBox.Body hasFooter bodyStyles={{ minHeight: 100 }}>
                {invalidAlgos.length > 0 ? (
                  <div>
                    The following algorithms has invalid arguments and cannot be
                    run:
                    <List
                      dense={true}
                      sx={{ listStyleType: 'disc', pl: 2, pt: 0 }}>
                      {invalidAlgos.map((algo) => (
                        <ListItem
                          key={`invalid-algo-${algo.gid}`}
                          disablePadding
                          sx={{ display: 'list-item' }}>
                          {algo.name}
                        </ListItem>
                      ))}
                    </List>
                  </div>
                ) : null}
                {validAlgos.length > 0 ? (
                  <div>
                    The following algorithms will be run:
                    <List
                      dense={true}
                      sx={{ listStyleType: 'disc', pl: 2, pt: 0 }}>
                      {validAlgos.map((algo) => (
                        <ListItem
                          key={`valid-algo-${algo.gid}`}
                          disablePadding
                          sx={{ display: 'list-item' }}>
                          {algo.name}
                        </ListItem>
                      ))}
                    </List>
                  </div>
                ) : (
                  <p>No algorithms to run. Click Proceed to generate report.</p>
                )}
              </AlertBox.Body>
              <AlertBox.Footer>
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}>
                  <div>
                    <button
                      className="aivBase-button aivBase-button--secondary aivBase-button--small"
                      onClick={() => setShowSelectAlgoDialog(false)}>
                      Cancel
                    </button>
                    <button
                      className="aivBase-button aivBase-button--primary aivBase-button--small"
                      onClick={() => generateReport()}>
                      Proceed
                    </button>
                  </div>
                </div>
              </AlertBox.Footer>
            </AlertBox>
          ) : null}
        </div>
      </div>
    </div>
  );
}
