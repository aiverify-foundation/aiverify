/**
 * Mock graphql-redis-subscriptions
 */
import {jest} from '@jest/globals'

export const mockPublish = jest.fn();

const pubsub = {
  publish: mockPublish,
}

export default pubsub;