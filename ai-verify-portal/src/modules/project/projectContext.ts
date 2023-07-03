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
} from '../projectTemplate/projectTemplateContext';
export * from '../projectTemplate/projectTemplateContext';
// import ProjectTemplate, { ProjectInformation, Page, ReportWidgetItem, GlobalVariable } from 'src/types/projectTemplate.interface';
import Project, {
  Report,
  ProjectReportStatus,
  ModelAndDatasets,
} from 'src/types/project.interface';
// import { InputBlock, Algorithm } from 'src/types/plugin.interface';
import { TestInformation } from 'src/types/test.interface';
// import { WidgetProperties, useWidgetProperties } from 'src/lib/canvasUtils';

import PluginManagerType from 'src/types/pluginManager.interface';
import {
  useCreateProject,
  useCreateProjectFromTemplate,
  useUpdateProject,
  useGenerateReport,
  useCancelTestRuns,
} from 'src/lib/projectService';

export interface ProjectStore extends ProjectTemplateStore {
  requireGroundTruth: boolean;
  inputBlockData: GenericMap<any>;
  dispatchInputBlockData: Dispatch<any>;
  testInformationData: GenericMap<TestInformation>;
  isAlgorithmValid: (gid: string) => boolean;
  dispatchTestInformationData: Dispatch<MapActions<TestInformation>>;
  reportStatus: ProjectReportStatus;
  createProject: () => Promise<string>;
  createProjectFromTemplate: (templateId: string) => Promise<string>;
  generateReport: (algorithms: string[]) => Promise<Partial<Report>>;
  cancelTestRuns: (algorithms: string[]) => Promise<Report>;
  dispatchModelAndDatasets: Dispatch<DataUpdateActions<ModelAndDatasets>>;
  modelAndDatasets: ModelAndDatasets;
  flushAllUpdates: () => void;
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
  // console.log("templateStore", templateStore);

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
      // console.log("Updating page", id, pages);
      if (!id || id.length == 0) return;
      updateProjectFn(id, { inputBlockData: state })
        .then(() => {
          // console.log("updated proj", proj);
          templateStore.setLastSavedTime(moment());
        })
        .catch((err) => {
          console.error('Update input block error:', err);
        });
    }, DEBOUNCE_WAIT),
    []
  );
  const dispatchInputBlockData = (action: MapActions<any>) => {
    // console.log("dispatchPages", id, action)
    _dispatchInputBlockData({
      ...action,
      updateFn: _sendInputBlockDataUpdates,
    });
  };

  // Test Information
  // @ts-ignore
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
      if (!id || id.length == 0) return;
      // console.log("Updating TestInformationData", id, Object.values(state));
      const testInformationArray = Object.values(state).map((info) => {
        return {
          algorithmGID: info.algorithmGID,
          // isTestArgumentsValid: info.isTestArgumentsValid,
          testArguments: info.testArguments,
        };
      }) as any[];
      // console.log("testInformationArray", testInformationArray)
      updateProjectFn(id, { testInformationData: testInformationArray })
        .then(() => {
          // console.log("updated proj", proj);
          templateStore.setLastSavedTime(moment());
        })
        .catch((err) => {
          console.error('Update test info error:', err);
        });
    }, DEBOUNCE_WAIT),
    []
  );
  const dispatchTestInformationData = (action: MapActions<TestInformation>) => {
    // console.log("dispatchPages", id, action)
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
      // console.log("Updating page", id, pages);
      if (!id || id.length == 0) return;
      // const data = _.pick(state, [ "model", "testDataset", "groundTruthDataset", "groundTruthColumn"]);
      const modelAndDatasets = {
        modelId: state.model ? state.model.id : undefined,
        testDatasetId: state.testDataset ? state.testDataset.id : undefined,
        groundTruthDatasetId: state.groundTruthDataset
          ? state.groundTruthDataset.id
          : undefined,
        groundTruthColumn: state.groundTruthColumn,
      };
      updateProjectFn(id, { modelAndDatasets })
        .then(() => {
          templateStore.setLastSavedTime(moment());
        })
        .catch((err) => {
          console.error('Update Info error:', err);
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
      // console.log("create project", project)
      createProjectFn(project)
        .then((result: string) => {
          // console.log("New project id", result)
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
  const createProjectFromTemplate = (templateId: string) => {
    return new Promise<string>((resolve, reject) => {
      const project = {
        projectInfo: templateStore.projectInfo,
      };
      createProjectFromTemplateFn(project, templateId)
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
      flushAllUpdates();
      setReportStatus(ProjectReportStatus.GeneratingReport);
      generateReportFn(templateStore.id as string, algorithms)
        .then((result: Partial<Report>) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const cancelTestRunsFn = useCancelTestRuns();
  const cancelTestRuns = (algorithms: string[]) => {
    return new Promise<Report>((resolve, reject) => {
      // console.log("create project", project)
      cancelTestRunsFn(templateStore.id as string, algorithms)
        .then((result: Report) => {
          // console.log("New project id", result)
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const _allDebounceFns = [
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
  };
}
