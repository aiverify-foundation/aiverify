import { TextInput } from 'src/components/textInput';
import {
  ARUActionTypes,
  ProjectTemplateStore,
  UpdateActionTypes,
} from '../projectTemplate/projectTemplateContext';
import styles from './styles/projectInfo.module.css';
import { produce } from 'immer';
import React, { useEffect, useRef, useState } from 'react';
import { TextArea } from 'src/components/textArea';

type ProjectInfoProps = {
  projectStore: ProjectTemplateStore;
  onProjectInfoChange?: (infoIsValid: boolean) => void;
};

type ProjectGeneralInfo = {
  name: string;
  description?: string;
  reportTitle?: string;
  company?: string;
};

const initialProjectInfo: ProjectGeneralInfo = {
  name: '',
  description: '',
  reportTitle: '',
  company: '',
};

type inputName = 'name' | 'description' | 'reportTitle' | 'company';

function validateProjectInfo(info: ProjectGeneralInfo): boolean {
  if (info.name.trim() === '') {
    return false;
  }
  return true;
}

export default function ProjectInformationComponent(props: ProjectInfoProps) {
  const { projectStore, onProjectInfoChange } = props;
  const [useProjectNameAsTitle, setUseProjectNameAsTitle] = useState(false);
  const [projectGeneralInfo, setProjectGeneralInfo] =
    useState<ProjectGeneralInfo>(
      () => projectStore.projectInfo || initialProjectInfo
    );
  const timer = useRef<NodeJS.Timeout>();

  function handleCheckboxChange() {
    setUseProjectNameAsTitle((prev) => !prev);
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setProjectGeneralInfo(
      produce((draft) => {
        draft[e.target.name as inputName] = e.target.value;
      })
    );
  }

  const debouncedProjectInfoChangeHandler = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (onProjectInfoChange)
        onProjectInfoChange(validateProjectInfo(projectGeneralInfo));
      projectStore.dispatchProjectInfo({
        type: UpdateActionTypes.UPDATE,
        payload: projectGeneralInfo,
      });
      if (projectStore.isNew) return;
      for (const propertyName in projectGeneralInfo) {
        if (propertyName === '__typename') continue;
        const idx = projectStore.globalVars.findIndex(
          (gvar) => gvar.key === propertyName
        );
        const gVarValue =
          projectGeneralInfo[
            propertyName as 'name' | 'company' | 'reportTitle' | 'description'
          ];
        if (gVarValue == null) continue;
        if (idx < 0) {
          projectStore.dispatchGlobalVars({
            type: ARUActionTypes.ADD,
            payload: { key: propertyName, value: gVarValue },
          });
        } else if (gVarValue !== projectStore.globalVars[idx].value) {
          projectStore.dispatchGlobalVars({
            type: ARUActionTypes.UPDATE,
            index: idx,
            payload: { key: propertyName, value: gVarValue },
          });
        }
      }
    }, 450);
  };

  useEffect(() => {
    debouncedProjectInfoChangeHandler();
  }, [projectGeneralInfo]);

  useEffect(() => {
    if (useProjectNameAsTitle) {
      setProjectGeneralInfo(
        produce((draft) => {
          draft.reportTitle = draft.name;
        })
      );
    }
  }, [useProjectNameAsTitle]);

  useEffect(() => {
    const { name, reportTitle } = projectStore.projectInfo;
    if (!name || !reportTitle) return;
    if (name === reportTitle) setUseProjectNameAsTitle(true);
  }, []);

  return (
    <div className="mainContainer">
      <div className={styles.container__limits}>
        <div className={styles.layout}>
          <div style={{ marginBottom: '25px' }}>
            <h3 className="screenHeading">Create a new AI Testing Project</h3>
            <p className="headingDescription">
              Create a new AI Testing Project to design the tests to be run on
              the AI Model <br />
              and document the test results in the report generated
            </p>
          </div>
          <div className={styles.projectInfoForm}>
            <div className={styles.leftSection}>
              <h4>General Information</h4>
              <p>
                Provide general information required for the report generation
              </p>
            </div>
            <div className={styles.vDivider} />
            <div className={styles.rightSection}>
              <TextInput
                label="Project Name *"
                name="name"
                placeholder="Enter name of this project e.g. Credit Scoring Model Tests"
                value={projectGeneralInfo.name}
                onChange={handleInputChange}
                maxLength={128}
              />

              <TextArea
                label="Project Description"
                name="description"
                placeholder="Enter Project Description e.g. To test whether the classification model is fair towards all groups with respect to gender, robust against unexpected input and explainable."
                value={projectGeneralInfo.description}
                onChange={handleInputChange}
                maxLength={256}
              />

              <TextInput
                label="Report Title"
                name="reportTitle"
                placeholder="Enter the title to be used for the generated report"
                value={
                  useProjectNameAsTitle
                    ? projectGeneralInfo.name
                    : projectGeneralInfo.reportTitle
                }
                onChange={handleInputChange}
                maxLength={128}
                labelSibling={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      onChange={handleCheckboxChange}
                      checked={useProjectNameAsTitle}
                      style={{
                        width: '15px',
                        height: '15px',
                        marginRight: '5px',
                      }}
                    />
                    <div style={{ fontWeight: 'normal', fontSize: '13px' }}>
                      Use Project Name
                    </div>
                  </div>
                }
              />

              <TextInput
                label="Company Name"
                name="company"
                placeholder="Enter the company name"
                value={projectGeneralInfo.company}
                onChange={handleInputChange}
                maxLength={128}
              />

              <div className={styles.formFooter}>* Required</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
