import Link from 'next/link';
import React from 'react';
import { TestModel } from '@/app/models/utils/types';
import { Dataset, Plugin } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { getTestModels } from '@/lib/fetchApis/getAllModels';
import { getPlugins } from '@/lib/fetchApis/getPlugins';
import { getTestDatasets } from '@/lib/fetchApis/getTestDatasets';
import { checkServerActive } from '@/lib/fetchApis/getTestRunApis';
import TestRunForm from './components/TestRunForm';

export default async function RunTestPage() {
  // Fetch models and datasets
  let models: TestModel[] = [];
  let datasets: Dataset[] = [];
  let plugins: Plugin[] = [];
  let fetchError: string | null = null;
  let isServerActive = false;

  try {
    // Check if server is active
    isServerActive = await checkServerActive();

    // Get models
    models = await getTestModels();

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
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    fetchError = 'Error fetching required data. Please try again later.';
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center">
          <Link
            href="/results"
            className="flex items-center text-blue-600 hover:text-blue-800">
            <Icon
              name={IconName.ArrowLeft}
              size={16}
              color="#2563eb"
            />
            <span className="ml-1">Back to Results</span>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon
              name={IconName.Lightning}
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
              icon={IconName.Lightning}
              iconPosition="left"
            />
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="rounded-lg bg-secondary-950 p-6">
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
            />
          </>
        )}
      </div>
    </div>
  );
}
