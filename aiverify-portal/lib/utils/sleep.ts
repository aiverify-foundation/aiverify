/**
 * Sleeps and blocks the thread for the specified number of seconds
 * @param seconds Number of seconds to sleep
 * @returns Promise that resolves after the sleep duration
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}
