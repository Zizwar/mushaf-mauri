import type { FileMapPluginWorker, FileMetadata, PerfLogger } from "../flow-types";
export interface ProcessFileRequest {
  readonly computeSha1: boolean;
  readonly maybeReturnContent: boolean;
}
export interface MaybeCodedError extends Error {
  code?: string;
}
export declare class FileProcessor {
  constructor(opts: {
    readonly maxFilesPerWorker?: null | undefined | number;
    readonly maxWorkers: number;
    readonly pluginWorkers?: null | ReadonlyArray<FileMapPluginWorker>;
    readonly perfLogger?: null | PerfLogger;
    readonly rootDir: string;
  });
  processBatch(files: ReadonlyArray<[string, FileMetadata]>, req: ProcessFileRequest): Promise<{
    errors: Array<{
      normalFilePath: string;
      error: MaybeCodedError;
    }>;
  }>;
  processRegularFile(normalPath: string, fileMetadata: FileMetadata, req: ProcessFileRequest): null | undefined | {
    content?: null | Buffer;
  };
  end(): Promise<void>;
}