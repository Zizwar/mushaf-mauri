import type { PerfLogger, PerfLoggerFactory, RootPerfLogger } from "../metro-config";
export type { PerfLoggerFactory, PerfLogger };
export interface BuildParameters {
  readonly computeSha1: boolean;
  readonly enableSymlinks: boolean;
  readonly extensions: ReadonlyArray<string>;
  readonly forceNodeFilesystemAPI: boolean;
  readonly ignorePattern: RegExp;
  readonly plugins: ReadonlyArray<InputFileMapPlugin>;
  readonly retainAllFiles: boolean;
  readonly rootDir: string;
  readonly roots: ReadonlyArray<string>;
  readonly cacheBreaker: string;
}
export interface BuildResult {
  fileSystem: FileSystem;
}
export interface CacheData {
  readonly clocks: WatchmanClocks;
  readonly fileSystemData: unknown;
  readonly plugins: ReadonlyMap<string, void | V8Serializable>;
}
export interface CacheManager {
  read(): Promise<null | undefined | CacheData>;
  write(getSnapshot: () => CacheData, opts: CacheManagerWriteOptions): Promise<void>;
  end(): Promise<void>;
}
export interface CacheManagerEventSource {
  onChange(listener: () => void): () => void;
}
export type CacheManagerFactory = (options: CacheManagerFactoryOptions) => CacheManager;
export interface CacheManagerFactoryOptions {
  readonly buildParameters: BuildParameters;
}
export interface CacheManagerWriteOptions {
  readonly changedSinceCacheRead: boolean;
  readonly eventSource: CacheManagerEventSource;
  readonly onWriteError: (error: Error) => void;
}
export type CanonicalPath = string;
export interface ChangedFileMetadata {
  readonly isSymlink: boolean;
  readonly modifiedTime?: null | undefined | number;
}
export interface ChangeEvent {
  readonly logger?: null | RootPerfLogger;
  readonly changes: ReadonlyFileSystemChanges<Readonly<ChangedFileMetadata>>;
  readonly rootDir: string;
}
export interface ChangeEventMetadata {
  modifiedTime?: null | number;
  size?: null | number;
  type?: "f" | "d" | "l";
}
export type Console = typeof global.console;
export interface _CrawlerOptions_previousState {
  readonly clocks: ReadonlyMap<CanonicalPath, WatchmanClockSpec>;
  readonly fileSystem: FileSystem;
}
export interface CrawlerOptions {
  abortSignal?: null | AbortSignal;
  computeSha1: boolean;
  console: Console;
  extensions: ReadonlyArray<string>;
  forceNodeFilesystemAPI: boolean;
  ignore: IgnoreMatcher;
  includeSymlinks: boolean;
  perfLogger?: null | undefined | PerfLogger;
  previousState: _CrawlerOptions_previousState;
  rootDir: string;
  roots: ReadonlyArray<string>;
  onStatus: (status: WatcherStatus) => void;
  subpath?: string;
}
export type CrawlResult = {
  changedFiles: FileData;
  removedFiles: Set<Path>;
  clocks: WatchmanClocks;
} | {
  changedFiles: FileData;
  removedFiles: Set<Path>;
};
export interface DependencyExtractor {
  extract: (content: string, absoluteFilePath: string, defaultExtractor?: any) => Set<string>;
  getCacheKey: () => string;
}
export type WatcherStatus = {
  type: "watchman_slow_command";
  timeElapsed: number;
  command?: "watch-project" | "query";
} | {
  type: "watchman_slow_command_complete";
  timeElapsed: number;
  command?: "watch-project" | "query";
} | {
  type: "watchman_warning";
  warning: unknown;
  command?: "watch-project" | "query";
};
export type DuplicatesSet = Map<string, number>;
export type DuplicatesIndex = Map<string, Map<string, DuplicatesSet>>;
export interface _FileMapPluginInitOptions_files<SerializableState, PerFileData = void> {
  fileIterator(opts: {
    readonly includeNodeModules: boolean;
    readonly includeSymlinks: boolean;
  }): Iterable<{
    baseName: string;
    canonicalPath: string;
    readonly pluginData?: null | PerFileData;
  }>;
  lookup(mixedPath: string): {
    exists: false;
  } | {
    exists: true;
    type: "f";
    readonly pluginData: PerFileData;
  } | {
    exists: true;
    type: "d";
  };
}
export interface FileMapPluginInitOptions<SerializableState, PerFileData = void> {
  readonly files: _FileMapPluginInitOptions_files<SerializableState, PerFileData>;
  readonly pluginState?: null | SerializableState;
}
export interface _FileMapPluginWorker_worker {
  readonly modulePath: string;
  readonly setupArgs: JsonData;
}
export interface FileMapPluginWorker {
  readonly worker: _FileMapPluginWorker_worker;
  readonly filter: ($$PARAM_0$$: {
    normalPath: string;
    isNodeModules: boolean;
  }) => boolean;
}
export type V8Serializable = string | number | boolean | null | ReadonlyArray<V8Serializable> | ReadonlySet<V8Serializable> | ReadonlyMap<string, V8Serializable> | {
  readonly [key: string]: V8Serializable;
};
export interface FileMapPlugin<SerializableState extends void | V8Serializable = void | V8Serializable, PerFileData extends void | V8Serializable = void | V8Serializable> {
  readonly name: string;
  initialize(initOptions: FileMapPluginInitOptions<SerializableState, PerFileData>): Promise<void>;
  assertValid(): void;
  onChanged(changes: ReadonlyFileSystemChanges<null | undefined | PerFileData>): void;
  getSerializableSnapshot(): void | V8Serializable;
  getCacheKey(): string;
  getWorker(): null | undefined | FileMapPluginWorker;
}
export type InputFileMapPlugin = FileMapPlugin;
export interface MetadataWorker {
  processFile($$PARAM_0$$: WorkerMessage, $$PARAM_1$$: {
    readonly getContent: () => Buffer;
  }): V8Serializable;
}
export interface HType {
  MTIME: 0;
  SIZE: 1;
  VISITED: 2;
  SHA1: 3;
  SYMLINK: 4;
  PLUGINDATA: number;
  PATH: 0;
  TYPE: 1;
  MODULE: 0;
  PACKAGE: 1;
  GENERIC_PLATFORM: "g";
  NATIVE_PLATFORM: "native";
}
export type HTypeValue = HType[keyof HType];
export type IgnoreMatcher = (item: string) => boolean;
export type FileData = Map<CanonicalPath, FileMetadata>;
export type FileMetadata = [null | undefined | number, number, 0 | 1, null | undefined | string, 0 | 1 | string];
export interface FileStats {
  readonly fileType?: "f" | "l";
  readonly modifiedTime?: null | number;
  readonly size?: null | number;
}
export interface FileSystem {
  exists(file: Path): boolean;
  getAllFiles(): Array<Path>;
  getDifference(files: FileData, options?: {
    readonly subpath?: string;
  }): {
    changedFiles: FileData;
    removedFiles: Set<string>;
  };
  getSerializableSnapshot(): any;
  getSha1(file: Path): null | undefined | string;
  getOrComputeSha1(file: Path): Promise<null | undefined | {
    sha1: string;
    content?: Buffer;
  }>;
  hierarchicalLookup(mixedStartPath: string, subpath: string, opts: {
    breakOnSegment?: null | string;
    invalidatedBy?: null | Set<string>;
    subpathType?: "f" | "d";
  }): null | undefined | {
    absolutePath: string;
    containerRelativePath: string;
  };
  linkStats(file: Path): null | undefined | FileStats;
  lookup(mixedPath: Path): LookupResult;
  matchFiles(opts: {
    filter?: RegExp | null;
    filterCompareAbsolute?: boolean;
    filterComparePosix?: boolean;
    follow?: boolean;
    recursive?: boolean;
    rootDir?: Path | null;
  }): Iterable<Path>;
}
export type Glob = string;
export type JsonData = string | number | boolean | null | Array<JsonData> | {
  [key: string]: JsonData;
};
export type LookupResult = {
  exists: false;
  links: ReadonlySet<string>;
  missing: string;
} | {
  exists: true;
  links: ReadonlySet<string>;
  realPath: string;
  type: "d";
} | {
  exists: true;
  links: ReadonlySet<string>;
  realPath: string;
  type: "f";
  metadata: FileMetadata;
};
export interface MockMap {
  getMockModule(name: string): null | undefined | Path;
}
export interface HasteConflict {
  id: string;
  platform?: string | null;
  absolutePaths: Array<string>;
  type?: "duplicate" | "shadowing";
}
export interface HasteMap {
  getModule(name: string, platform?: null | undefined | string, supportsNativePlatform?: null | undefined | boolean, type?: null | undefined | HTypeValue): null | undefined | Path;
  getModuleNameByPath(file: Path): null | undefined | string;
  getPackage(name: string, platform: null | undefined | string, _supportsNativePlatform: null | undefined | boolean): null | undefined | Path;
  computeConflicts(): Array<HasteConflict>;
}
export type HasteMapData = Map<string, HasteMapItem>;
export interface HasteMapItem {
  [platform: string]: HasteMapItemMetadata;
}
export type HasteMapItemMetadata = [string, number];
export interface FileSystemListener {
  directoryAdded(canonicalPath: CanonicalPath): void;
  directoryRemoved(canonicalPath: CanonicalPath): void;
  fileAdded(canonicalPath: CanonicalPath, data: FileMetadata): void;
  fileModified(canonicalPath: CanonicalPath, oldData: FileMetadata, newData: FileMetadata): void;
  fileRemoved(canonicalPath: CanonicalPath, data: FileMetadata): void;
}
export interface ReadonlyFileSystemChanges<T = FileMetadata> {
  readonly addedDirectories: Iterable<CanonicalPath>;
  readonly removedDirectories: Iterable<CanonicalPath>;
  readonly addedFiles: Iterable<Readonly<[CanonicalPath, T]>>;
  readonly modifiedFiles: Iterable<Readonly<[CanonicalPath, T]>>;
  readonly removedFiles: Iterable<Readonly<[CanonicalPath, T]>>;
}
export interface MutableFileSystem extends FileSystem {
  remove(filePath: Path, listener?: FileSystemListener): void;
  addOrModify(filePath: Path, fileMetadata: FileMetadata, listener?: FileSystemListener): void;
  bulkAddOrModify(addedOrModifiedFiles: FileData, listener?: FileSystemListener): void;
}
export type Path = string;
export type ProcessFileFunction = (normalPath: string, metadata: FileMetadata, request: {
  readonly computeSha1: boolean;
}) => null | undefined | Buffer;
export interface RawMockMap {
  readonly duplicates: Map<string, Set<string>>;
  readonly mocks: Map<string, Path>;
  readonly version: number;
}
export interface ReadOnlyRawMockMap {
  readonly duplicates: ReadonlyMap<string, ReadonlySet<string>>;
  readonly mocks: ReadonlyMap<string, Path>;
  readonly version: number;
}
export interface WatcherBackend {
  getPauseReason(): null | undefined | string;
  onError(listener: (error: Error) => void): () => void;
  onFileEvent(listener: (event: WatcherBackendChangeEvent) => void): () => void;
  startWatching(): Promise<void>;
  stopWatching(): Promise<void>;
}
export type ChangeEventClock = [string, string];
export type WatcherBackendChangeEvent = {
  readonly event: "touch";
  readonly clock?: ChangeEventClock;
  readonly relativePath: string;
  readonly root: string;
  readonly metadata: ChangeEventMetadata;
} | {
  readonly event: "delete";
  readonly clock?: ChangeEventClock;
  readonly relativePath: string;
  readonly root: string;
  readonly metadata?: void;
} | {
  readonly event: "recrawl";
  readonly clock?: ChangeEventClock;
  readonly relativePath: string;
  readonly root: string;
};
export interface WatcherBackendOptions {
  readonly ignored?: null | RegExp;
  readonly globs: ReadonlyArray<string>;
  readonly dot: boolean;
}
export type WatchmanClockSpec = string | {
  readonly scm: {
    readonly "mergebase-with": string;
  };
};
export type WatchmanClocks = Map<Path, WatchmanClockSpec>;
export interface WorkerMessage {
  readonly computeSha1: boolean;
  readonly filePath: string;
  readonly maybeReturnContent: boolean;
  readonly pluginsToRun: ReadonlyArray<number>;
}
export interface WorkerMetadata {
  readonly sha1?: null | undefined | string;
  readonly content?: null | undefined | Buffer;
  readonly pluginData?: ReadonlyArray<V8Serializable>;
}
export interface WorkerSetupArgs {
  readonly plugins?: ReadonlyArray<any>;
}