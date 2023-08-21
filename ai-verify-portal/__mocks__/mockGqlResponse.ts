import { CREATE_PROJECT } from 'src/lib/projectService';
import { GET_PROJECT_TEMPLATES } from 'src/lib/projectTemplateService';

export const mockGqlData = [
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
          id: '64c82da4c99adb254a4203ad',
        },
      },
    },
  },
];

export const mockGqlDataMinimal = [
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
          id: '64c82da4c99adb254a4203ad',
        },
      },
    },
  },
];

export const mockDatasets = {
  datasets: [
    {
      __typename: 'Dataset',
      id: '647d8bf214ae095e2e890add',
      name: 'pickle_pandas_tabular_compas_testing.sav',
      filename: 'pickle_pandas_tabular_compas_testing.sav',
      filePath:
        '/home/amdlahir/aiverify/uploads/data/pickle_pandas_tabular_compas_testing.sav',
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
      name: 'aiv-homescreen-v1.png',
      filename: 'aiv-homescreen-v1.png',
      filePath: '/home/amdlahir/aiverify/uploads/data/aiv-homescreen-v1.png',
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
    {
      __typename: 'Dataset',
      id: '64cb014ead81d1d5d0227c05',
      name: 'Screenshot 2023-05-04 082818.png',
      filename: 'Screenshot 2023-05-04 082818.png',
      filePath:
        '/home/amdlahir/aiverify/uploads/data/Screenshot 2023-05-04 082818.png',
      ctime: '2023-08-03T01:22:22.845Z',
      size: '186.47 KB',
      status: 'Invalid',
      description: '',
      dataColumns: [],
      numRows: null,
      numCols: null,
      serializer: '',
      dataFormat: '',
      errorMessages:
        'The dataset /home/amdlahir/aiverify/uploads/data/Screenshot 2023-05-04 082818.png is not supported. Please upload a supported dataset: Unable to get data instance: ',
      type: 'File',
    },
  ],
};
