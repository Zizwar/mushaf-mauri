import type { Readable, Writable } from "node:stream";
import type { ReadStream } from "node:tty";
declare function main(argvInput?: Array<string>, _optionalArg?: {
  readonly stdin?: Readable | ReadStream;
  readonly stderr: Writable;
  readonly stdout: Writable;
}): Promise<number>;
export default main;