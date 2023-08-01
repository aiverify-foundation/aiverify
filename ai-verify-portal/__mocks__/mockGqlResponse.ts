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
