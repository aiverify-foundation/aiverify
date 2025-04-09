const TEST_RUNS_ENDPOINT = `${process.env.APIGW_HOST}/test_runs`;

export interface TestRunInput {
  mode: 'upload' | 'api';
  algorithmGID: string;
  algorithmCID: string;
  algorithmArgs: Record<string, unknown>;
  testDatasetFilename: string;
  groundTruthDatasetFilename?: string;
  groundTruth?: string;
  modelFilename: string;
}

export interface TestRunOutput extends TestRunInput {
  id: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  progress: number;
  testResult?: Record<string, unknown>;
  errorMessages?: string;
}

/**
 * Check if the test engine worker server is active
 * @returns boolean indicating if server is active
 */
export async function checkServerActive(): Promise<boolean> {
  try {
    const response = await fetch(`${TEST_RUNS_ENDPOINT}/server_active`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 }, // Disable cache for this request
    });

    if (!response.ok) {
      return false;
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking server status:', error);
    return false;
  }
}

/**
 * Create and run a new test
 * @param input Test run input data
 * @returns Test run output data
 */
export async function runTest(input: TestRunInput): Promise<TestRunOutput> {
  const response = await fetch(`/api/test_runs/run_test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to run test: ${responseText}`);
  }

  return response.json();
}

/**
 * Get list of test runs
 * @returns List of test runs
 */
export async function getTestRuns(): Promise<TestRunOutput[]> {
  const response = await fetch(TEST_RUNS_ENDPOINT);

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to get test runs: ${responseText}`);
  }

  return response.json();
}

/**
 * Get a specific test run by ID
 * @param id Test run ID
 * @returns Test run output data
 */
export async function getTestRun(id: string): Promise<TestRunOutput> {
  const response = await fetch(`${TEST_RUNS_ENDPOINT}/${id}`);

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to get test run ${id}: ${responseText}`);
  }

  return response.json();
}

/**
 * Cancel a pending test run
 * @param id Test run ID
 * @returns Updated test run data
 */
export async function cancelTestRun(id: string): Promise<TestRunOutput> {
  const response = await fetch(`${TEST_RUNS_ENDPOINT}/${id}/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to cancel test run ${id}: ${responseText}`);
  }

  return response.json();
}
