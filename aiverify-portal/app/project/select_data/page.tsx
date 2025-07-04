import { notFound } from 'next/navigation';
import {
  transformProjectOutputToState,
  ProjectOutput,
} from '@/app/canvas/utils/transformProjectOutputToState';
import { getAllInputBlockGroups } from '@/lib/fetchApis/getAllInputBlockGroup';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import { getInputBlockDatas } from '@/lib/fetchApis/getInputBlockDatas';
import { getPlugins } from '@/lib/fetchApis/getPlugins';
import { populatePluginsMdxBundles } from '@/lib/fetchApis/getPlugins';
import { getProjects } from '@/lib/fetchApis/getProjects';
import { getTestResults } from '@/lib/fetchApis/getTestResults';
import ClientSelectData from './components/ClientSelectData';
import SelectDataHeader from './components/SelectDataHeader';

export default async function SelectDataPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; flow?: string }>;
}) {
  const params = await searchParams;
  const projectId = params.projectId;
  const flow = params.flow;
  console.log('flow', flow);

  if (!projectId || !flow) {
    notFound();
  }

  // get all data
  const result = await getProjects({ ids: [projectId] });

  if ('message' in result || !result.data || result.data.length === 0) {
    notFound();
  }

  const project = result.data[0] as ProjectOutput;
  const allModels = await getTestModels();
  const allTestResults = await getTestResults();
  const allInputBlockGroups = await getAllInputBlockGroups();
  const allInputBlockDatas = await getInputBlockDatas();

  console.log('Project data:', {
    testModelId: project.testModelId,
    testResults: project.testResults,
    inputBlocks: project.inputBlocks,
  });

  const plugins = await getPlugins({ groupByPluginId: false });

  if ('message' in plugins || !plugins.data || !Array.isArray(plugins.data)) {
    notFound();
  }

  const pluginsWithMdx = await populatePluginsMdxBundles(plugins.data);

  // Transform project data to get required algorithms and input blocks
  const transformedProject = transformProjectOutputToState(
    project,
    pluginsWithMdx
  );
  console.log('Transformed project:', transformedProject);
  const requiredAlgorithms = transformedProject.algorithmsOnReport || [];
  const requiredInputBlocks = transformedProject.inputBlocksOnReport || [];

  // Ensure we have the correct data types and handle missing or malformed data
  const initialModelId = project.testModelId?.toString();
  const initialTestResults = Array.isArray(project.testResults)
    ? project.testResults.map((result) => ({
        id:
          typeof result.id === 'number'
            ? result.id
            : parseInt(result.id || '0'),
        gid: result.gid || '',
        cid: result.cid || '',
      }))
    : [];
  const initialInputBlocks = Array.isArray(project.inputBlocks)
    ? project.inputBlocks.map((block) => ({
        id: typeof block.id === 'number' ? block.id : parseInt(block.id || '0'),
        gid: block.gid || '',
        cid: block.cid || '',
      }))
    : [];

  console.log('Transformed data:', {
    initialModelId,
    initialTestResults,
    initialInputBlocks,
  });

  return (
    <>
      <SelectDataHeader updatedAt={project.updated_at} />
      <div className="flex">
        <div
          className="flex-shrink-0 flex-grow basis-1/5"
          role="region"
          aria-label="Left pane content">
          <div className="rounded-lg bg-secondary-950 p-6">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-white">
                  {project.projectInfo.name}
                </h2>
                <p className="text-gray-300">
                  {project.projectInfo.description}
                </p>
                <p className="text-gray-300">{project.projectInfo.company}</p>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex-shrink-0 flex-grow basis-4/5 overflow-y-auto pl-6 pr-6"
          role="region"
          aria-label="Right pane content">
          <ClientSelectData
            projectId={projectId}
            requiredAlgorithms={requiredAlgorithms}
            requiredInputBlocks={requiredInputBlocks}
            allModels={allModels}
            allTestResults={allTestResults}
            allInputBlockGroups={allInputBlockGroups}
            allInputBlockDatas={allInputBlockDatas}
            flow={flow}
            initialModelId={initialModelId}
            initialTestResults={initialTestResults}
            initialInputBlocks={initialInputBlocks}
          />
        </div>
      </div>
    </>
  );
}
