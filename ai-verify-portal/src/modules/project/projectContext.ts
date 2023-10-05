import { useReducer, useCallback, useState, useMemo, Dispatch } from 'react';
import * as _ from 'lodash';
import moment from 'moment';
import { Validator } from 'jsonschema';
const validator = new Validator();

import {
  ProjectTemplateStore,
  useProjectTemplateStore,
  GenericMap,
  MapActions,
  DEBOUNCE_WAIT,
  DataUpdateActions,
  ARUActionTypes,
} from '../projectTemplate/projectTemplateContext';
export * from '../projectTemplate/projectTemplateContext';
import Project, {
  Report,
  ProjectReportStatus,
  ModelAndDatasets,
} from 'src/types/project.interface';
import { TestInformation } from 'src/types/test.interface';

import PluginManagerType from 'src/types/pluginManager.interface';
import {
  useCreateProject,
  useCreateProjectFromTemplate,
  useUpdateProject,
  useGenerateReport,
  useCancelTestRuns,
} from 'src/lib/projectService';
import { toErrorWithMessage } from 'src/lib/errorUtils';

export interface ProjectStore extends ProjectTemplateStore {
  requireGroundTruth: boolean;
  inputBlockData: GenericMap<any>;
  dispatchInputBlockData: Dispatch<any>;
  testInformationData: GenericMap<TestInformation>;
  isAlgorithmValid: (gid: string) => boolean;
  dispatchTestInformationData: Dispatch<MapActions<TestInformation>>;
  reportStatus: ProjectReportStatus;
  createProject: () => Promise<string>;
  createProjectFromTemplate: (
    templateId: string,
    onProjectCreated?: () => void
  ) => Promise<string>;
  generateReport: (algorithms: string[]) => Promise<Partial<Report>>;
  cancelTestRuns: (algorithms: string[]) => Promise<Report>;
  dispatchModelAndDatasets: Dispatch<DataUpdateActions<ModelAndDatasets>>;
  modelAndDatasets: ModelAndDatasets;
  flushAllUpdates: () => void;
  flushAllUpdatesAsync(): Promise<any[]>;
}

/**
 * Represents the project context to be passed to child components
 */
// const DEBOUNCE_WAIT = 5000; // in ms

export function useProjectStore(
  data: Project,
  pluginManager: PluginManagerType
): ProjectStore {
  const templateStore = useProjectTemplateStore(data, pluginManager, true);

  const updateProjectFn = useUpdateProject();

  /** create the reducers */

  const requireGroundTruth = useMemo<boolean>(() => {
    for (const algo of templateStore.dependencies.algorithms) {
      if (_.isNil(algo.requireGroundTruth))
        // default true
        return true;
      if (algo.requireGroundTruth) return true;
    }
    return false;
  }, [templateStore.dependencies.algorithms]);

  // Input block data
  // @ts-ignore
  const [inputBlockData, _dispatchInputBlockData] = useReducer(
    templateStore.mapReducer<any>,
    data.inputBlockData || {}
  );
  const _sendInputBlockDataUpdates = useCallback(
    _.debounce((id: string | undefined, state: any) => {
      if (!id || id.length == 0)
        return Promise.reject(
          toErrorWithMessage(
            new Error('_sendInputBlockDataUpdates: Invalid ID')
          )
        );
      return updateProjectFn(id, { inputBlockData: state })
        .then(() => {
          templateStore.setLastSavedTime(moment());
          return Promise.resolve(true);
        })
        .catch((err) => {
          console.error('Update input block error:', err);
          return Promise.reject(toErrorWithMessage(err));
        });
    }, DEBOUNCE_WAIT),
    []
  );
  const dispatchInputBlockData = (action: MapActions<any>) => {
    _dispatchInputBlockData({
      ...action,
      updateFn: _sendInputBlockDataUpdates,
    });
  };

  // Test Information
  const [testInformationData, _dispatchTestInformationData] = useReducer(
    templateStore.mapReducer<TestInformation>,
    {},
    () => {
      if (!data.testInformationData) return {};
      return data.testInformationData.reduce<GenericMap<TestInformation>>(
        (acc, info) => {
          const gid = info.algorithmGID;
          info.algorithm = pluginManager.algorithms.find((e) => e.gid === gid);
          acc[gid] = info;
          return acc;
        },
        {}
      );
    }
  );
  const _sendTestInformationUpdates = useCallback(
    _.debounce((id: string | undefined, state: GenericMap<TestInformation>) => {
      if (!id || id.length == 0)
        return Promise.reject(
          toErrorWithMessage(
            new Error('_sendTestInformationUpdates: Invalid ID')
          )
        );
      const testInformationArray = Object.values(state).map((info) => {
        return {
          algorithmGID: info.algorithmGID,
          testArguments: info.testArguments,
        };
      }) as any[];
      return updateProjectFn(id, { testInformationData: testInformationArray })
        .then(() => {
          templateStore.setLastSavedTime(moment());
          return Promise.resolve(true);
        })
        .catch((err) => {
          console.error('Update test info error:', err);
          return Promise.reject(toErrorWithMessage(err));
        });
    }, DEBOUNCE_WAIT),
    []
  );
  const dispatchTestInformationData = (action: MapActions<TestInformation>) => {
    _dispatchTestInformationData({
      ...action,
      updateFn: _sendTestInformationUpdates,
    });
  };

  // @ts-ignore
  const [modelAndDatasets, _dispatchModelAndDatasets] = useReducer(
    templateStore.updateReducer<any>,
    data.modelAndDatasets || {}
  );
  const _sendModelAndDatasets = useCallback(
    _.debounce((id: string | undefined, state: ModelAndDatasets) => {
      if (!id || id.length == 0)
        return Promise.reject(
          toErrorWithMessage(new Error('_sendModelAndDatasets: Invalid ID'))
        );
      const modelAndDatasets = {
        modelId: state.model ? state.model.id : undefined,
        testDatasetId: state.testDataset ? state.testDataset.id : undefined,
        groundTruthDatasetId: state.groundTruthDataset
          ? state.groundTruthDataset.id
          : undefined,
        groundTruthColumn: state.groundTruthColumn,
        apiConfig: state.apiConfig,
      };
      return updateProjectFn(id, { modelAndDatasets })
        .then(() => {
          templateStore.setLastSavedTime(moment());
          return Promise.resolve(true);
        })
        .catch((err) => {
          console.error('Update modelAndDatasets error:', err);
          return Promise.reject(toErrorWithMessage(err));
        });
    }, DEBOUNCE_WAIT),
    []
  );

  const dispatchModelAndDatasets = (
    action: DataUpdateActions<ModelAndDatasets>
  ) => {
    _dispatchModelAndDatasets({
      ...action,
      updateFn: _sendModelAndDatasets,
    });
  };

  const isAlgorithmValid = (gid: string): boolean => {
    const algo = templateStore.dependencies.algorithms.find(
      (algo) => algo.gid == gid
    );
    if (!algo) {
      console.error(`Algo ${gid} not found`);
      return false;
    }
    let data = {};
    if (testInformationData[gid] && testInformationData[gid].testArguments) {
      data = testInformationData[gid].testArguments;
    }
    return validator.validate(data, algo.inputSchema).valid;
  };

  const [reportStatus, setReportStatus] = useState<ProjectReportStatus>(
    data.report ? data.report.status : ProjectReportStatus.NotGenerated
  );

  const createProjectFn = useCreateProject();
  const createProject = () => {
    return new Promise<string>((resolve, reject) => {
      const project = {
        projectInfo: templateStore.projectInfo,
        pages: [],
      };
      createProjectFn(project)
        .then(async (result: string) => {
          const newGlobalVars = [];
          for (const propertyName in project.projectInfo) {
            if (propertyName === '__typename') continue;
            const gVarValue =
              project.projectInfo[
                propertyName as
                  | 'name'
                  | 'company'
                  | 'reportTitle'
                  | 'description'
              ];
            if (gVarValue == null) continue;
            newGlobalVars.push({ key: propertyName, value: gVarValue });
          }
          templateStore.dispatchGlobalVars({
            type: ARUActionTypes.REPLACE,
            payloadArray: newGlobalVars,
          });
          await templateStore.flushAllUpdatesAsync();
          return result;
        })
        .then((result: string) => {
          templateStore.setId(result);
          templateStore.setIsNew(false);
          templateStore.setLastSavedTime(moment());
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const createProjectFromTemplateFn = useCreateProjectFromTemplate();
  const createProjectFromTemplate = (
    templateId: string,
    onProjectCreated?: () => void
  ) => {
    return new Promise<string>((resolve, reject) => {
      const project = {
        projectInfo: templateStore.projectInfo,
      };
      createProjectFromTemplateFn(project, templateId)
        .then(async (doc: Partial<Project>) => {
          const newGlobalVars = [];
          for (const propertyName in doc.projectInfo) {
            if (propertyName === '__typename') continue;
            const gVarValue =
              doc.projectInfo[
                propertyName as
                  | 'name'
                  | 'company'
                  | 'reportTitle'
                  | 'description'
              ];
            if (gVarValue == null) continue;
            newGlobalVars.push({ key: propertyName, value: gVarValue });
          }
          templateStore.dispatchGlobalVars({
            type: ARUActionTypes.REPLACE,
            payloadArray: newGlobalVars,
            onCompleted: onProjectCreated,
            noDebounce: true,
          });
          return doc;
        })
        .then((doc: Partial<Project>) => {
          templateStore.setId(doc.id);
          templateStore.setIsNew(false);
          templateStore.setLastSavedTime(moment());
          resolve(doc.id as string);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const generateReportFn = useGenerateReport();
  const generateReport = (algorithms: string[]) => {
    return new Promise<Partial<Report>>((resolve, reject) => {
      flushAllUpdatesAsync().then(() => {
        setReportStatus(ProjectReportStatus.GeneratingReport);
        generateReportFn(templateStore.id as string, algorithms)
          .then((result: Partial<Report>) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  };

  const cancelTestRunsFn = useCancelTestRuns();
  const cancelTestRuns = (algorithms: string[]) => {
    return new Promise<Report>((resolve, reject) => {
      cancelTestRunsFn(templateStore.id as string, algorithms)
        .then((result: Report) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const _allDebounceFns = [
    _sendModelAndDatasets,
    _sendInputBlockDataUpdates,
    _sendTestInformationUpdates,
  ];

  // flush all updates
  const flushAllUpdates = (): void => {
    templateStore.flushAllUpdates();
    for (const fn of _allDebounceFns) {
      fn.flush();
    }
  };

  async function flushAllUpdatesAsync() {
    return Promise.all([
      _allDebounceFns.map((fn) => fn.flush()),
      templateStore.flushAllUpdatesAsync(),
    ]);
  }

  return {
    ...templateStore,
    requireGroundTruth,
    inputBlockData,
    dispatchInputBlockData,
    testInformationData,
    dispatchTestInformationData,
    modelAndDatasets,
    dispatchModelAndDatasets,
    isAlgorithmValid,
    reportStatus,
    createProject,
    createProjectFromTemplate,
    generateReport,
    cancelTestRuns,
    flushAllUpdates,
    flushAllUpdatesAsync,
  };
}
