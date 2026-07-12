import type { TransformResult } from "../DeltaBundler";
import type { TransformerConfig, TransformOptions, Worker } from "./Worker";
import type { ConfigT } from "../../metro-config";
import type { Readable } from "node:stream";
export interface WorkerInterface extends Worker {
  end(): void | Promise<void>;
  getStdout(): Readable;
  getStderr(): Readable;
}
export interface TransformerResult {
  readonly result: TransformResult;
  readonly sha1: string;
}
declare class WorkerFarm {
  _config: ConfigT;
  _transformerConfig: TransformerConfig;
  _worker: WorkerInterface | Worker;
  constructor(config: ConfigT, transformerConfig: TransformerConfig);
  kill(): Promise<void>;
  transform(filename: string, options: TransformOptions, fileBuffer?: Buffer): Promise<TransformerResult>;
  _makeFarm(absoluteWorkerPath: string, exposedMethods: ReadonlyArray<string>, numWorkers: number): WorkerInterface;
  _computeWorkerKey(method: string, filename: string): null | undefined | string;
  _formatGenericError(err: {
    readonly message: string;
    readonly stack?: string;
  }, filename: string): TransformError;
  _formatBabelError(err: {
    readonly message: string;
    readonly stack?: string;
    readonly type?: string;
    readonly codeFrame?: unknown;
    readonly loc: {
      line?: number;
      column?: number;
    };
  }, filename: string): TransformError;
}
export default WorkerFarm;
declare class TransformError extends SyntaxError {
  type: string;
  constructor(message: string);
}