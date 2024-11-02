import { Project } from '@/app/types';
import { sleep } from '@/lib/utils/sleep';

const projects: Project[] = [
  {
    id: '1',
    name: 'Project 1',
    description:
      'Description 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utmaximus purus sed velit porttitor, cursus auctor elit eleifend.',
    createdAt: '2021-01-01',
    model: 'Model 1',
    status: 'Completed',
  },
  {
    id: '2',
    name: 'Project 2',
    description:
      'Description 2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utmaximus purus sed velit porttitor, cursus auctor elit eleifend.',
    createdAt: '2021-01-01',
    model: 'Model 2',
    status: 'Completed',
  },
  {
    id: '3',
    name: 'Project 3',
    description:
      'Description 3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utmaximus purus sed velit porttitor, cursus auctor elit eleifend.',
    createdAt: '2021-01-01',
    model: 'Model 3',
    status: 'Running',
  },
  {
    id: '4',
    name: 'Project 4',
    description:
      'Description 4. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utmaximus purus sed velit porttitor, cursus auctor elit eleifend.',
    createdAt: '2021-01-01',
    model: 'Model 4',
    status: 'Running',
  },
  {
    id: '5',
    name: 'Project 5',
    description:
      'Description 5. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utmaximus purus sed velit porttitor, cursus auctor elit eleifend.',
    createdAt: '2021-01-01',
    model: 'Model 5',
    status: 'No Report yet',
  },
];

export async function GET() {
  await sleep(5);
  return Response.json(projects);
}
