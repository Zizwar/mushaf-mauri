export interface Options {
  readonly root: string;
}
declare class FileStore<T> {
  constructor(options: Options);
  get(key: Buffer): Promise<null | undefined | T>;
  set(key: Buffer, value: T): Promise<void>;
  clear(): void;
}
export default FileStore;