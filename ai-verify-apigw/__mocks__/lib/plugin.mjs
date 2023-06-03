/**
 * Mock plugin.mjs
 */
import {jest} from '@jest/globals'
import casual from '#testutil/mockData.mjs';

export const getAlgorithm = jest.fn(gid => casual.algorithm["data"]); 
export const getAlgorithmInputSchema = jest.fn(gid => casual.algorithm["inputSchema"]);
export const getAlgorithmOutputSchema = jest.fn(gid => casual.algorithm["outputSchema"]);
export const getAlgorithmOutputSchemaByKey = jest.fn(key => casual.algorithm["outputSchema"]); 

