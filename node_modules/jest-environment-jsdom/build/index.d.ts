/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EnvironmentContext, JestEnvironmentConfig} from '@jest/environment';
import BaseEnv from '@jest/environment-jsdom-abstract';

declare class JSDOMEnvironment extends BaseEnv {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext);
}
export default JSDOMEnvironment;

export declare const TestEnvironment: typeof JSDOMEnvironment;

export {};
