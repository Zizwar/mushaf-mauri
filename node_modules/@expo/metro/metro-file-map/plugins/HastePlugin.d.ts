import type { Console, FileMapPlugin, FileMapPluginInitOptions, FileMapPluginWorker, HasteConflict, HasteMap, HasteMapItemMetadata, HTypeValue, Path, PerfLogger, ReadonlyFileSystemChanges } from "../flow-types";
export interface HasteMapOptions {
  readonly console?: null | undefined | Console;
  readonly enableHastePackages: boolean;
  readonly hasteImplModulePath?: null | string;
  readonly perfLogger?: null | undefined | PerfLogger;
  readonly platforms: ReadonlySet<string>;
  readonly rootDir: Path;
  readonly failValidationOnConflicts: boolean;
}
declare class HastePlugin implements HasteMap, FileMapPlugin<null, string | null> {
  readonly name: "haste";
  constructor(options: HasteMapOptions);
  initialize($$PARAM_0$$: FileMapPluginInitOptions<null, string | null>): Promise<void>;
  getSerializableSnapshot(): null;
  getModule(name: string, platform?: null | undefined | string, supportsNativePlatform?: null | undefined | boolean, type?: null | undefined | HTypeValue): null | undefined | Path;
  getModuleNameByPath(mixedPath: Path): null | undefined | string;
  getPackage(name: string, platform: null | undefined | string, _supportsNativePlatform?: null | undefined | boolean): null | undefined | Path;
  onChanged(delta: ReadonlyFileSystemChanges<null | undefined | string>): void;
  setModule(id: string, module: HasteMapItemMetadata): void;
  assertValid(): void;
  computeConflicts(): Array<HasteConflict>;
  getCacheKey(): string;
  getWorker(): FileMapPluginWorker;
}
export default HastePlugin;