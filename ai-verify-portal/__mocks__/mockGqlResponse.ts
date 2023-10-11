import {
  CREATE_PROJECT,
  GENERATE_REPORT,
  UPDATE_PROJECT,
} from 'src/lib/projectService';
import { GET_PROJECT_TEMPLATES } from 'src/lib/projectTemplateService';
import { GET_DATASETS } from 'src/modules/assets/datasetList';
import { GET_MODELS } from 'src/modules/assets/modelList';

const MOCK_PROJECTID = '64c82da4c99adb254a4203ad';
const MOCK_MODELID = '647d8c0514ae095e2e890af4';
const MOCK_DATASETID = '647d8bf214ae095e2e890add';
export const MOCK_ALGO_ID = 'aiverify.test.mock_test_plugin1:mock_algo1';
export const MOCK_IBLOCK_ID = 'aiverify.test.mock_test_plugin1:mock_iblock1';
export const MOCK_DATE_WIDGET_1 = 1695202143375;

export const mockGqlDataE2E = [
  {
    request: {
      query: GET_PROJECT_TEMPLATES,
    },
    result: {
      data: {
        projectTemplates: [],
      },
    },
  },

  {
    request: {
      query: CREATE_PROJECT,
      variables: {
        project: {
          projectInfo: { name: 'Test Project' },
          pages: [],
        },
      },
    },
    result: {
      data: {
        createProject: {
          id: MOCK_PROJECTID,
        },
      },
    },
  },

  {
    request: {
      query: CREATE_PROJECT,
      variables: {
        project: {
          projectInfo: {
            name: 'Test Project',
            description: 'Test Description',
            reportTitle: 'Test Report Name',
            company: 'Test Company Pte Ltd',
          },
          pages: [],
        },
      },
    },
    result: {
      data: {
        createProject: {
          id: MOCK_PROJECTID,
        },
      },
    },
  },

  {
    request: {
      query: GET_DATASETS,
    },
    result: {
      data: {
        datasets: [
          {
            __typename: 'Dataset',
            id: '647d8bf214ae095e2e890add',
            name: 'pickle_pandas_tabular_compas_testing.sav',
            filename: 'pickle_pandas_tabular_compas_testing.sav',
            filePath:
              '/home/aiverify/uploads/data/pickle_pandas_tabular_compas_testing.sav',
            ctime: '2023-06-05T07:17:06.360Z',
            size: '68.33 KB',
            status: 'Valid',
            description: '',
            dataColumns: [
              {
                __typename: 'DatasetColumn',
                id: '647d8bf3ef104c4da904734a',
                name: 'age_cat_cat',
                datatype: 'int64',
                label: 'age_cat_cat',
              },
              {
                __typename: 'DatasetColumn',
                id: '647d8bf3ef104c4da904734b',
                name: 'sex_code',
                datatype: 'int64',
                label: 'sex_code',
              },
              {
                __typename: 'DatasetColumn',
                id: '647d8bf3ef104c4da904734c',
                name: 'race_code',
                datatype: 'int64',
                label: 'race_code',
              },
              {
                __typename: 'DatasetColumn',
                id: '647d8bf3ef104c4da904734d',
                name: 'priors_count',
                datatype: 'int64',
                label: 'priors_count',
              },
              {
                __typename: 'DatasetColumn',
                id: '647d8bf3ef104c4da904734e',
                name: 'c_charge_degree_cat',
                datatype: 'int64',
                label: 'c_charge_degree_cat',
              },
              {
                __typename: 'DatasetColumn',
                id: '647d8bf3ef104c4da904734f',
                name: 'two_year_recid',
                datatype: 'int64',
                label: 'two_year_recid',
              },
            ],
            numRows: 1235,
            numCols: 6,
            serializer: 'pickle',
            dataFormat: 'pandas',
            errorMessages: '',
            type: 'File',
          },
          {
            __typename: 'Dataset',
            id: '64cb013aad81d1d5d0227bf5',
            name: 'image-test.png',
            filename: 'aiv-homescreen-v1.png',
            filePath: '/home/aiverify/uploads/data/image-test.png',
            ctime: '2023-08-03T01:22:02.814Z',
            size: '71.09 KB',
            status: 'Invalid',
            description: '',
            dataColumns: [],
            numRows: null,
            numCols: null,
            serializer: '',
            dataFormat: '',
            errorMessages:
              'The dataset /home/amdlahir/aiverify/uploads/data/aiv-homescreen-v1.png is not supported. Please upload a supported dataset: Unable to get data instance: ',
            type: 'File',
          },
        ],
      },
    },
  },

  {
    request: {
      query: GET_MODELS,
    },
    result: {
      data: {
        modelFiles: [
          {
            id: `${MOCK_MODELID}`,
            name: 'pickle_scikit_bc_compas.sav',
            filename: 'pickle_scikit_bc_compas.sav',
            filePath:
              '/home/amdlahir/aiverify/uploads/model/pickle_scikit_bc_compas.sav',
            ctime: '2023-06-05T07:17:25.132Z',
            size: '502.71 KB',
            status: 'Valid',
            description: '',
            serializer: 'pickle',
            modelFormat: 'sklearn',
            modelType: 'Classification',
            errorMessages: '',
            type: 'File',
            __typename: 'ModelFile',
          },
        ],
      },
    },
  },

  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: `${MOCK_PROJECTID}`,
        project: {
          pages: [
            {
              layouts: [],
              reportWidgets: [],
            },
          ],
        },
      },
    },
    result: {
      data: {
        updateProject: {
          id: `${MOCK_PROJECTID}`,
          // Note: the actual result actually might or might not have below properties and they should contain sub properties. In unit test, we can just omit them. These returned properties are not used in the UI.
          projectInfo: {},
          globalVars: {},
          inpuBlockData: {},
          testInformation: {},
          pages: [],
          modelAndDatasets: {},
        },
      },
    },
  },

  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: `${MOCK_PROJECTID}`,
        project: {
          pages: [
            {
              layouts: [
                {
                  h: 3,
                  i: `${MOCK_DATE_WIDGET_1}`,
                  maxH: 36,
                  maxW: 12,
                  minH: 3,
                  minW: 6,
                  static: false,
                  w: 6,
                  x: 1,
                  y: 1,
                },
              ],
              reportWidgets: [
                {
                  widgetGID: 'aiverify.test.mock_test_plugin1:widget_cid_1',
                  key: `${MOCK_DATE_WIDGET_1}`,
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                  },
                  properties: {},
                },
              ],
            },
          ],
        },
      },
    },
    result: {
      data: {
        updateProject: {
          id: `${MOCK_PROJECTID}`,
          // Note: the actual result actually might or might not have below properties and they should contain sub properties. In unit test, we can just omit them. These returned properties are not used in the UI.
          projectInfo: {},
          globalVars: {},
          inpuBlockData: {},
          testInformation: {},
          pages: [],
          modelAndDatasets: {},
        },
      },
    },
  },

  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: `${MOCK_PROJECTID}`,
        project: {
          modelAndDatasets: {
            modelId: `${MOCK_MODELID}`,
            testDatasetId: `${MOCK_DATASETID}`,
            groundTruthDatasetId: `${MOCK_DATASETID}`,
            groundTruthColumn: 'two_year_recid',
          },
        },
      },
    },
    result: {
      data: {
        updateProject: {
          id: `${MOCK_PROJECTID}`, // Note: the actual result actually has many more properties than just `id`. In unit test, we do not need them so omitting in this mock
        },
      },
    },
  },

  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: `${MOCK_PROJECTID}`,
        project: {
          testInformationData: [
            {
              algorithmGID: `${MOCK_ALGO_ID}`,
              testArguments: { sensitive_feature: ['race_code'] },
            },
          ],
        },
      },
    },
    result: {
      data: {
        updateProject: {
          id: `${MOCK_PROJECTID}`,
          // Note: the actual result actually might or might not have below properties and they should contain sub properties. In unit test, we can just omit them. These returned properties are not used in the UI.
          projectInfo: {},
          globalVars: {},
          inpuBlockData: {},
          testInformation: {},
          pages: [],
          modelAndDatasets: {},
        },
      },
    },
  },

  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: `${MOCK_PROJECTID}`,
        project: {
          inputBlockData: {
            'aiverify.test.mock_test_plugin1:mock_iblock1': {},
          },
        },
      },
    },
    result: {
      data: {
        updateProject: {
          id: `${MOCK_PROJECTID}`,
          // Note: the actual result actually might or might not have below properties and they should contain sub properties. In unit test, we can just omit them. These returned properties are not used in the UI.
          projectInfo: {},
          globalVars: {},
          inpuBlockData: {},
          testInformation: {},
          pages: [],
          modelAndDatasets: {},
        },
      },
    },
  },

  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: `${MOCK_PROJECTID}`,
        project: {
          inputBlockData: {
            'aiverify.test.mock_test_plugin1:mock_iblock1': {
              fname: 'John',
              lname: 'Doe',
              bio: 'Test input block',
            },
          },
        },
      },
    },
    result: {
      data: {
        updateProject: {
          updateProject: {
            id: `${MOCK_PROJECTID}`,
            // Note: the actual result actually might or might not have below properties and they should contain sub properties. In unit test, we can just omit them. These returned properties are not used in the UI.
            projectInfo: {},
            globalVars: {},
            inpuBlockData: {},
            testInformation: {},
            pages: [],
            modelAndDatasets: {},
          },
        },
      },
    },
  },

  {
    request: {
      query: GENERATE_REPORT,
      variables: {
        projectID: MOCK_PROJECTID,
        algorithms: [`${MOCK_ALGO_ID}`],
      },
    },
    result: {
      generateReport: {
        status: 'RunningTests',
      },
    },
  },
];
