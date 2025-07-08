import { LegacyFakeTimers, ModernFakeTimers } from "@jest/fake-timers";
import { ModuleMocker } from "jest-mock";
import { Context } from "vm";
import * as jsdom from "jsdom";
import { EnvironmentContext, JestEnvironment, JestEnvironmentConfig } from "@jest/environment";
import { Global } from "@jest/types";

//#region src/index.d.ts

type Win = Window & Global.Global & {
  Error: {
    stackTraceLimit: number;
  };
};
declare abstract class BaseJSDOMEnvironment implements JestEnvironment<number> {
  dom: jsdom.JSDOM | null;
  fakeTimers: LegacyFakeTimers<number> | null;
  fakeTimersModern: ModernFakeTimers | null;
  global: Win;
  private errorEventListener;
  moduleMocker: ModuleMocker | null;
  customExportConditions: string[];
  private readonly _configuredExportConditions?;
  protected constructor(config: JestEnvironmentConfig, context: EnvironmentContext, jsdomModule: typeof jsdom);
  setup(): Promise<void>;
  teardown(): Promise<void>;
  exportConditions(): Array<string>;
  getVmContext(): Context | null;
}
//#endregion
export { BaseJSDOMEnvironment as default };