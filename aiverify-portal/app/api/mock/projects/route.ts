import { Project } from '@/app/types';
import { sleep } from '@/lib/utils/sleep';

const projects: Project[] = [
  {
    id: 1,
    globalVars: [],
    pages: [],
    templateId: null,
    projectInfo: {
      name: 'Project 1',
      description:
        'Description 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      reportTitle: 'Report 1',
      company: 'Company 1',
    },
    testModelId: null,
    inputBlocks: [],
    testResults: [],
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
  {
    id: 2,
    globalVars: [],
    pages: [],
    templateId: null,
    projectInfo: {
      name: 'Project 2',
      description:
        'Description 2. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      reportTitle: 'Report 2',
      company: 'Company 2',
    },
    testModelId: null,
    inputBlocks: [],
    testResults: [],
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
  {
    id: 3,
    globalVars: [],
    pages: [],
    templateId: null,
    projectInfo: {
      name: 'Project 3',
      description:
        'Description 3. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      reportTitle: 'Report 3',
      company: 'Company 3',
    },
    testModelId: null,
    inputBlocks: [],
    testResults: [],
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
  {
    id: 4,
    globalVars: [],
    pages: [],
    templateId: null,
    projectInfo: {
      name: 'Project 4',
      description:
        'Description 4. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      reportTitle: 'Report 4',
      company: 'Company 4',
    },
    testModelId: null,
    inputBlocks: [],
    testResults: [],
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
  {
    id: 5,
    globalVars: [],
    pages: [],
    templateId: null,
    projectInfo: {
      name: 'Project 5',
      description:
        'Description 5. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      reportTitle: 'Report 5',
      company: 'Company 5',
    },
    testModelId: null,
    inputBlocks: [],
    testResults: [],
    created_at: '2021-01-01',
    updated_at: '2021-01-01',
  },
];

export async function GET() {
  await sleep(5);
  return Response.json(projects);
}
