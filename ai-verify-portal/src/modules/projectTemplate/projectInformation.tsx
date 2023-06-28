import { TextInput } from 'src/components/textInput';
import {
  ProjectTemplateStore,
  UpdateActionTypes,
} from '../projectTemplate/projectTemplateContext';
import styles from './styles/projectInfo.module.css';
import { produce } from 'immer';
import React, { useEffect, useState } from 'react';
import { TextArea } from 'src/components/textArea';

type TemplateInfoProps = {
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

type inputName = 'name' | 'description' | 'company';

function validateProjectInfo(info: ProjectGeneralInfo): boolean {
  if (info.name.trim() === '') {
    return false;
  }
  return true;
}

export default function ProjectTemplateInformationComponent(
  props: TemplateInfoProps
) {
  const { projectStore, onProjectInfoChange } = props;
  const [projectGeneralInfo, setProjectGeneralInfo] =
    useState<ProjectGeneralInfo>(
      () => projectStore.projectInfo || initialProjectInfo
    );

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setProjectGeneralInfo(
      produce((draft) => {
        draft[e.target.name as inputName] = e.target.value;
      })
    );
  }

  useEffect(() => {
    if (onProjectInfoChange)
      onProjectInfoChange(validateProjectInfo(projectGeneralInfo));
    projectStore.dispatchProjectInfo({
      type: UpdateActionTypes.UPDATE,
      payload: projectGeneralInfo,
    });
  }, [projectGeneralInfo]);

  return (
    <div className="mainContainer">
      <div className={styles.container__limits}>
        <div className={styles.layout}>
          <div style={{ marginBottom: '25px' }}>
            <h3 className="screenHeading">
              Create a new AI Testing Project Template
            </h3>
            <p className="headingDescription">
              Create a new AI Testing Project to design the tests to be run on
              the AI Model <br />
              and document the test results in the report generated
            </p>
          </div>
          <div className={styles.projectInfoForm}>
            <div className={styles.leftSection}>
              <h4>General Information</h4>
              <p>Provide general information required for the template</p>
            </div>
            <div className={styles.vDivider} />
            <div className={styles.rightSection}>
              <TextInput
                label="Template Name"
                name="name"
                placeholder="Give it a name that is easy to identify and distinguish from others"
                value={projectGeneralInfo.name}
                onChange={handleInputChange}
                maxLength={128}
              />

              <TextArea
                label="Template Description"
                name="description"
                placeholder="Provide a description of the template and the desired test outcomes."
                value={projectGeneralInfo.description}
                onChange={handleInputChange}
                maxLength={256}
              />

              <TextInput
                label="Author"
                name="company"
                placeholder="Provide author name"
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
