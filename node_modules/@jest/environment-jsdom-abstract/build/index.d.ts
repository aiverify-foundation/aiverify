/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Context} from 'vm';
import * as jsdom from 'jsdom';
import {
  EnvironmentContext,
  JestEnvironment,
  JestEnvironmentConfig,
} from '@jest/environment';
import {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import {Global as Global_2} from '@jest/types';
import {ModuleMocker} from 'jest-mock';

declare abstract class BaseJSDOMEnvironment implements JestEnvironment<number> {
  dom: jsdom.JSDOM | null;
  fakeTimers: LegacyFakeTimers<number> | null;
  fakeTimersModern: ModernFakeTimers | null;
  global: Win;
  private errorEventListener;
  moduleMocker: ModuleMocker | null;
  customExportConditions: Array<string>;
  private readonly _configuredExportConditions?;
  protected constructor(
    config: JestEnvironmentConfig,
    context: EnvironmentContext,
    jsdomModule: typeof jsdom,
  );
  setup(): Promise<void>;
  teardown(): Promise<void>;
  exportConditions(): Array<string>;
  getVmContext(): Context | null;
}
export default BaseJSDOMEnvironment;

declare type Win = Window &
  Global_2.Global & {
    Error: {
      stackTraceLimit: number;
    };
  };

export {};
