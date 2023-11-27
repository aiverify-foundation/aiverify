import Dataset, { DatasetColumn } from 'src/types/dataset.interface';
import Model from 'src/types/model.interface';
import { ModelAndDatasets } from 'src/types/project.interface';
import DatasetListComponent from '../assets/datasetList';
import ModelListComponent from '../assets/modelList';
import { ProjectStore, UpdateActionTypes } from './projectContext';
import styles from './styles/inputs.module.css';
import { useState } from 'react';
import NewDatasetModule from '../assets/newDataset';
import NewModelModule from '../assets/newModel';

enum FileSelectMode {
  GROUNDTRUTH,
  DATASET,
  MODEL,
}

type DatasetModelFileSelectorProps = {
  mode: FileSelectMode;
  projectStore: ProjectStore;
  onDatasetSelected?: () => void;
  onModelSelected?: () => void;
  onGroundTruthSelected?: () => void;
};

function DatasetModelFilePicker(props: DatasetModelFileSelectorProps) {
  const {
    mode,
    projectStore,
    onModelSelected,
    onDatasetSelected,
    onGroundTruthSelected,
  } = props;

  const [showNewDataset, setShowNewDataset] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);

  function handleNewDatasetBtnClick() {
    setShowNewDataset(true);
  }

  function handleNewDatasetBackIconClick() {
    setShowNewDataset(false);
  }

  function handleNewModelBtnClick() {
    setShowNewModel(true);
  }

  function handleNewModelBackIconClick() {
    setShowNewModel(false);
  }

  function fileSelectedHandler(
    selectedFile:
      | (Dataset & { __typename?: string })
      | (Model & { __typename?: string })
  ) {
    const payload: Partial<ModelAndDatasets> = {};
    const { __typename, ...rest } = selectedFile;
    if (mode === FileSelectMode.DATASET) {
      payload.testDataset = rest as Dataset;
      if (payload.testDataset.dataColumns) {
        payload.testDataset.dataColumns = payload.testDataset.dataColumns.map(
          (datCol) => {
            const { __typename, ...rest } = datCol as DatasetColumn & {
              __typename?: string;
            };
            return rest;
          }
        );
      }
    } else if (mode === FileSelectMode.MODEL) {
      payload.model = rest as Model;
    } else if (mode === FileSelectMode.GROUNDTRUTH) {
      payload.groundTruthDataset = rest as Dataset;
      if (payload.groundTruthDataset.dataColumns) {
        payload.groundTruthDataset.dataColumns =
          payload.groundTruthDataset.dataColumns.map((datCol) => {
            const { __typename, ...rest } = datCol as DatasetColumn & {
              __typename?: string;
            };
            return rest;
          });
      }
    }
    projectStore.dispatchModelAndDatasets({
      type: UpdateActionTypes.UPDATE,
      payload,
    });

    if (onDatasetSelected && mode === FileSelectMode.DATASET) {
      onDatasetSelected();
    }

    if (onModelSelected && mode === FileSelectMode.MODEL) {
      onModelSelected();
    }

    if (onGroundTruthSelected && mode === FileSelectMode.GROUNDTRUTH) {
      onGroundTruthSelected();
    }
  }

  if (mode === FileSelectMode.DATASET || mode === FileSelectMode.GROUNDTRUTH) {
    return showNewDataset ? (
      <NewDatasetModule
        withoutLayoutContainer
        onBackIconClick={handleNewDatasetBackIconClick}
      />
    ) : (
      <div className={styles.container__limits}>
        <div
          className={styles.inputsLayout}
          style={{ height: '600px', paddingTop: '24px' }}>
          <div
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
            <h3 className="screenHeading">
              {mode === FileSelectMode.DATASET
                ? 'Choose the Dataset'
                : 'Choose Ground Truth Dataset'}
            </h3>
            <button
              className="aivBase-button aivBase-button--primary aivBase-button--medium"
              onClick={handleNewDatasetBtnClick}>
              New Dataset +
            </button>
          </div>
          <DatasetListComponent
            containerStyles={{
              padding: 0,
              height: '100%',
              backgroundColor: '#FFF',
              margin: 0,
              borderRadius: '12px',
              boxShadow:
                '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
            }}
            gridStyles={{
              maxHeight: '100%',
              margin: 0,
              padding: '10px',
            }}
            showSelectDatasetBtn
            onDatasetSelected={fileSelectedHandler}
          />
        </div>
      </div>
    );
  }

  if (mode === FileSelectMode.MODEL) {
    if (showNewModel) {
      return (
        <NewModelModule
          withoutLayoutContainer
          currentProjectId={projectStore.id}
          onBackIconClick={handleNewModelBackIconClick}
        />
      );
    } else {
      return (
        <div className={styles.container__limits}>
          <div
            className={styles.inputsLayout}
            style={{ height: '600px', paddingTop: '24px' }}>
            <div
              style={{
                marginBottom: '15px',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
              <h3 className="screenHeading">Choose the Model</h3>
              <button
                className="aivBase-button aivBase-button--primary aivBase-button--medium"
                onClick={handleNewModelBtnClick}>
                New Model +
              </button>
            </div>
            <ModelListComponent
              containerStyles={{
                padding: 0,
                height: '100%',
                backgroundColor: '#FFF',
                margin: 0,
                borderRadius: '12px',
                boxShadow:
                  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
              }}
              gridStyles={{
                maxHeight: '100%',
                margin: 0,
                padding: '10px',
              }}
              showSelectModelBtn
              onModelSelected={fileSelectedHandler}
              isProjectFlow
              currentProjectId={projectStore.id}
            />
          </div>
        </div>
      );
    }
  }

  return null;
}

export { DatasetModelFilePicker, FileSelectMode };
