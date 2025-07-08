import BaseEnv from "@jest/environment-jsdom-abstract";
import { EnvironmentContext, JestEnvironmentConfig } from "@jest/environment";

//#region src/index.d.ts

declare class JSDOMEnvironment extends BaseEnv {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext);
}
declare const TestEnvironment: typeof JSDOMEnvironment;
//#endregion
export { TestEnvironment, JSDOMEnvironment as default };