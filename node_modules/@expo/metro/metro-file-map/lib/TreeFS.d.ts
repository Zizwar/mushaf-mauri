import type { FileData, FileMetadata, FileStats, FileSystemListener, LookupResult, MutableFileSystem, Path, ProcessFileFunction } from "../flow-types";
type DirectoryNode = Map<string, MixedNode>;
type FileNode = FileMetadata;
type MixedNode = FileNode | DirectoryNode;
export interface DeserializedSnapshotInput {
  rootDir: string;
  fileSystemData: DirectoryNode;
  processFile: ProcessFileFunction;
}
export interface TreeFSOptions {
  rootDir: Path;
  files?: FileData;
  processFile: ProcessFileFunction;
}
export interface MatchFilesOptions {
  readonly filter?: null | undefined | RegExp;
  readonly filterCompareAbsolute?: boolean;
  readonly filterComparePosix?: boolean;
  readonly follow?: boolean;
  readonly recursive?: boolean;
  readonly rootDir?: null | undefined | Path;
}
export interface MetadataIteratorOptions {
  readonly includeSymlinks: boolean;
  readonly includeNodeModules: boolean;
}
declare class TreeFS implements MutableFileSystem {
  constructor(opts: TreeFSOptions);
  getSerializableSnapshot(): any;
  static fromDeserializedSnapshot(args: DeserializedSnapshotInput): TreeFS;
  getSize(mixedPath: Path): null | undefined | number;
  getDifference(files: FileData, options?: {
    readonly subpath?: string;
  }): {
    changedFiles: FileData;
    removedFiles: Set<string>;
  };
  getSha1(mixedPath: Path): null | undefined | string;
  getOrComputeSha1(mixedPath: Path): Promise<null | undefined | {
    sha1: string;
    content?: Buffer;
  }>;
  exists(mixedPath: Path): boolean;
  lookup(mixedPath: Path): LookupResult;
  getAllFiles(): Array<Path>;
  linkStats(mixedPath: Path): null | undefined | FileStats;
  matchFiles(opts: MatchFilesOptions): Iterable<Path>;
  addOrModify(mixedPath: Path, metadata: FileMetadata, changeListener?: FileSystemListener): void;
  bulkAddOrModify(addedOrModifiedFiles: FileData, changeListener?: FileSystemListener): void;
  remove(mixedPath: Path, changeListener?: FileSystemListener): void;
  hierarchicalLookup(mixedStartPath: string, subpath: string, opts: {
    breakOnSegment?: null | string;
    invalidatedBy?: null | Set<string>;
    subpathType?: "f" | "d";
  }): null | undefined | {
    absolutePath: string;
    containerRelativePath: string;
  };
  metadataIterator(opts: MetadataIteratorOptions): Iterator<{
    baseName: string;
    canonicalPath: string;
    metadata: FileMetadata;
  }>;
}
export default TreeFS;