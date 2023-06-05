import { useState, useEffect } from 'react';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import ProjectTemplate from 'src/types/projectTemplate.interface';
import { useProjectTemplateStore } from './projectTemplateContext';

import PluginManagerType from 'src/types/pluginManager.interface';
import ProjectTemplateInformationComponent from './projectInformation';
import CanvasComponent from './canvas';
import { ReportDesignerHeader } from '../project/header';
import { formatDate } from 'src/lib/utils';

type Props = {
  data: ProjectTemplate,
  pluginManager: PluginManagerType
}

/**
 * Main project module component
 */
export default function ProjectTemplateModule({ data, pluginManager }: Props) {
  const projectStore = useProjectTemplateStore(data, pluginManager);
  const [ disableNextBtn, setDisableNextBtn ] = useState(true);
  const [step, setStep] = useState(projectStore.isNew?1:2);
  const lastSavedTime = projectStore.lastSavedTime ? formatDate(projectStore.lastSavedTime) : undefined;

  function handleProjectInfoChange(isProjectInfoInputValid: boolean) {
    setDisableNextBtn(isProjectInfoInputValid === false);
  }

  useEffect(() => {
    if (!projectStore.isNew) {
      setStep(2)
    }
  }, [])

  const goForward = () => {
    if (step == 1) {
      if (projectStore.isNew) {
        projectStore.createProjectTemplate().then(() => {
          setStep(step+1);
        })
      } else {
        setStep(step+1);
      }
    } else {
      setStep(step+1);
    }
  }

  const goBack = () => {
    setStep(step-1);
  }

  return (
    <div>
      <ReportDesignerHeader
        projectStore={projectStore}
        onBackBtnClick={goBack}
        onNextBtnClick={goForward}
        lastSavedTime={lastSavedTime}
        designStep={step}
        disableSaveMenu={projectStore.isNew}
        disableSaveBtn={projectStore.isReadonly || projectStore.isNew}
        disableNextBtn={disableNextBtn}
        isTemplate
        disableSaveMenuItem
      />
      <div className="layoutContentArea">
        <div className="scrollContainer">
          {step == 1 && <ProjectTemplateInformationComponent
            projectStore={projectStore}
            onProjectInfoChange={handleProjectInfoChange}
          />}
          {step == 2 && <CanvasComponent projectStore={projectStore} isTemplate/>}
        </div>
      </div>
    </div>
  )
}