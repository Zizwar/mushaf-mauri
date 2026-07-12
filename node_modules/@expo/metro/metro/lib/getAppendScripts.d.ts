import type { Module } from "../DeltaBundler";
export interface Options<T extends number | string> {
  readonly asyncRequireModulePath: string;
  readonly createModuleId: ($$PARAM_0$$: string) => T;
  readonly getRunModuleStatement: (moduleId: T, globalPrefix: string) => string;
  readonly globalPrefix: string;
  readonly inlineSourceMap?: null | boolean;
  readonly runBeforeMainModule: ReadonlyArray<string>;
  readonly runModule: boolean;
  readonly shouldAddToIgnoreList: ($$PARAM_0$$: Module) => boolean;
  readonly sourceMapUrl?: null | string;
  readonly sourceUrl?: null | string;
  readonly getSourceUrl?: null | (($$PARAM_0$$: Module) => string);
}
declare function getAppendScripts<T extends number | string>(entryPoint: string, modules: ReadonlyArray<Module>, options: Options<T>): ReadonlyArray<Module>;
export default getAppendScripts;