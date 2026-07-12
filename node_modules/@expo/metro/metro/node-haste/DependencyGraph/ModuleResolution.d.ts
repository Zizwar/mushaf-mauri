import type { BundlerResolution, TransformResultDependency } from "../../DeltaBundler/types";
import type { Reporter } from "../../lib/reporting";
import type { ResolverInputOptions } from "../../shared/types";
import type { CustomResolver, DoesFileExist, FileCandidates, FileSystemLookup, Resolution, ResolveAsset } from "../../../metro-resolver";
import type { PackageForModule, PackageJson } from "../../../metro-resolver/types";
export type DirExistsFn = (filePath: string) => boolean;
export interface _Options_unstable_conditionsByPlatform {
  readonly [platform: string]: ReadonlyArray<string>;
}
export interface Options {
  readonly assetExts: ReadonlySet<string>;
  readonly dirExists: DirExistsFn;
  readonly disableHierarchicalLookup: boolean;
  readonly doesFileExist: DoesFileExist;
  readonly emptyModulePath: string;
  readonly extraNodeModules?: null | Object;
  readonly fileSystemLookup: FileSystemLookup;
  readonly getHasteModulePath: (name: string, platform: null | undefined | string) => null | undefined | string;
  readonly getHastePackagePath: (name: string, platform: null | undefined | string) => null | undefined | string;
  readonly mainFields: ReadonlyArray<string>;
  readonly getPackage: (packageJsonPath: string) => null | undefined | PackageJson;
  readonly getPackageForModule: (absolutePath: string) => null | undefined | PackageForModule;
  readonly nodeModulesPaths: ReadonlyArray<string>;
  readonly preferNativePlatform: boolean;
  readonly projectRoot: string;
  readonly reporter: Reporter;
  readonly resolveAsset: ResolveAsset;
  readonly resolveRequest?: null | CustomResolver;
  readonly sourceExts: ReadonlyArray<string>;
  readonly unstable_conditionNames: ReadonlyArray<string>;
  readonly unstable_conditionsByPlatform: _Options_unstable_conditionsByPlatform;
  readonly unstable_enablePackageExports: boolean;
  readonly unstable_incrementalResolution: boolean;
}
export declare class ModuleResolver {
  _options: Options;
  _projectRootFakeModulePath: string;
  _cachedEmptyModule: null | undefined | BundlerResolution;
  constructor(options: Options);
  _getEmptyModule(): BundlerResolution;
  resolveDependency(originModulePath: string, dependency: TransformResultDependency, allowHaste: boolean, platform: string | null, resolverOptions: ResolverInputOptions): BundlerResolution;
  _getFileResolvedModule(resolution: Resolution): BundlerResolution;
  _logWarning: any;
  _removeRoot(candidates: FileCandidates): FileCandidates;
}
export declare class UnableToResolveError extends Error {
  originModulePath: string;
  targetModuleName: string;
  cause: null | undefined | Error;
  readonly type: "UnableToResolveError";
  constructor(originModulePath: string, targetModuleName: string, message: string, options?: {
    readonly dependency?: null | undefined | TransformResultDependency;
    readonly cause?: Error;
  });
  buildCodeFrameMessage(dependency: null | undefined | TransformResultDependency): null | undefined | string;
}