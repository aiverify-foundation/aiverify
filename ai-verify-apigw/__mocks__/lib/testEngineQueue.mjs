import {jest} from '@jest/globals'

/**
 * Mocks for testEngineQueue.mjs
 */

export const queueTests = jest.fn();

export const cancelTestRun = jest.fn();

export const queueDataset = jest.fn();

export const queueModel = jest.fn();

export const shutdown = jest.fn();
