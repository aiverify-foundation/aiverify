import { RiFlaskLine } from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { TestModel } from '@/app/models/utils/types';
import { Dataset, Plugin } from '@/app/types';
import { IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import { getPlugins } from '@/lib/fetchApis/getPlugins';
import { getTestDatasets } from '@/lib/fetchApis/getTestDatasets';
import { checkServerActive } from '@/lib/fetchApis/getTestRunApis';
import TestRunForm from './components/TestRunForm';

export default async function RunTestPage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string;
    flow?: string;
    algorithmGid?: string;
    algorithmCid?: string;
    modelId?: string;
  }>;
}) {
  // Check if coming from project flow
  const resolvedParams = await searchParams;
  const projectId = resolvedParams.projectId;
  const flow = resolvedParams.flow;
  const algorithmGid = resolvedParams.algorithmGid;
  const algorithmCid = resolvedParams.algorithmCid;
  const modelId = resolvedParams.modelId;
  const isProjectFlow = !!projectId && !!flow;

  // Fetch models and datasets
  let models: TestModel[] = [];
  let datasets: Dataset[] = [];
  let plugins: Plugin[] = [];
  let fetchError: string | null = null;
  let isServerActive = false;
  let preselectedModel: TestModel | undefined;

  try {
    // Check if server is active
    isServerActive = await checkServerActive();

    // Get models
    models = await getTestModels();

    // Get pre-selected model if modelId is provided
    if (modelId) {
      preselectedModel = models.find(
        (model) => model.id.toString() === modelId
      );
    }

    // Get datasets
    const datasetsResult = await getTestDatasets();
    if ('message' in datasetsResult) {
      fetchError = datasetsResult.message;
    } else {
      datasets = datasetsResult.data;
    }

    // Get plugins with algorithms
    const pluginsResult = await getPlugins();
    if ('message' in pluginsResult) {
      fetchError = pluginsResult.message;
    } else {
      // Filter plugins to only include those with algorithms
      plugins = (pluginsResult.data as Plugin[]).filter(
        (plugin: Plugin) => plugin.algorithms && plugin.algorithms.length > 0
      );

      // Pre-filter to specific algorithm if coming from project flow
      if (isProjectFlow && algorithmGid && algorithmCid) {
        const filteredPlugins = plugins
          .map((plugin) => {
            if (plugin.algorithms) {
              const filtered = plugin.algorithms.filter(
                (algo) => algo.gid === algorithmGid && algo.cid === algorithmCid
              );
              if (filtered.length > 0) {
                return { ...plugin, algorithms: filtered };
              }
            }
            return null;
          })
          .filter(Boolean) as Plugin[];

        if (filteredPlugins.length > 0) {
          plugins = filteredPlugins;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    fetchError = 'Error fetching required data. Please try again later.';
  }

  // If we're in project flow but couldn't find the necessary data, return 404
  if (
    isProjectFlow &&
    ((algorithmGid && algorithmCid && plugins.length === 0) ||
      (modelId && !preselectedModel))
  ) {
    notFound();
  }

  return (
    <div className="p-6">
      {/* Header - only shown when not in project flow, since project flow has its own header */}
      {!isProjectFlow && (
        <div className="mb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <RiFlaskLine
                size={40}
                color="#FFFFFF"
              />
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-white">Run New Test</h1>
                <h3 className="text-white">
                  Configure and run a new algorithm test
                </h3>
              </div>
            </div>

            <Link href="/results/run/view_tests">
              <Button
                pill
                variant={ButtonVariant.PRIMARY}
                text="VIEW RUNNING TESTS"
                size="md"
              />
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={`rounded-lg bg-secondary-950 ${isProjectFlow ? 'mt-16' : ''}`}>
        {fetchError ? (
          <div className="py-8 text-center">
            <p className="text-red-600">{fetchError}</p>
            <Button
              variant={ButtonVariant.PRIMARY}
              text="Retry"
              size="md"
              className="mt-4"
              onClick={() => window.location.reload()}
            />
          </div>
        ) : (
          <>
            <TestRunForm
              plugins={plugins}
              models={models}
              datasets={datasets}
              initialServerActive={isServerActive}
              preselectedModel={preselectedModel}
              projectId={projectId}
              flow={flow}
            />
          </>
        )}
      </div>

      {/* Footer Navigation - Different based on flow */}
      <div className="mt-4 flex items-center">
        {isProjectFlow ? (
          <Link
            href={`/project/select_data?projectId=${projectId}&flow=${flow}`}
            className="flex items-center text-blue-600 hover:text-blue-800">
            <Button
              pill
              variant={ButtonVariant.SECONDARY}
              icon={IconName.ArrowLeft}
              iconPosition="left"
              text="Back to Project"
              size="md"
            />
          </Link>
        ) : (
          <Link
            href="/results"
            className="flex items-center text-blue-600 hover:text-blue-800">
            <Button
              pill
              variant={ButtonVariant.SECONDARY}
              icon={IconName.ArrowLeft}
              iconPosition="left"
              text="Back to Results"
              size="md"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
