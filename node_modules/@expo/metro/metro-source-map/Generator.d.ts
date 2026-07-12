import type { BasicSourceMap, FBSourceFunctionMap, FBSourceMetadata } from "./source-map";
import B64Builder from "./B64Builder";
export interface FileFlags {
  readonly addToIgnoreList?: boolean;
}
declare class Generator {
  builder: B64Builder;
  last: {
    generatedColumn: number;
    generatedLine: number;
    name: number;
    source: number;
    sourceColumn: number;
    sourceLine: number;
  };
  names: IndexedSet;
  source: number;
  sources: Array<string>;
  sourcesContent: Array<null | undefined | string>;
  x_facebook_sources: Array<null | undefined | FBSourceMetadata>;
  x_google_ignoreList: Array<number>;
  constructor();
  startFile(file: string, code: string, functionMap: null | undefined | FBSourceFunctionMap, flags?: FileFlags): void;
  endFile(): void;
  addSimpleMapping(generatedLine: number, generatedColumn: number): void;
  addSourceMapping(generatedLine: number, generatedColumn: number, sourceLine: number, sourceColumn: number): void;
  addNamedSourceMapping(generatedLine: number, generatedColumn: number, sourceLine: number, sourceColumn: number, name: string): void;
  toMap(file?: string, options?: {
    excludeSource?: boolean;
  }): BasicSourceMap;
  toString(file?: string, options?: {
    excludeSource?: boolean;
  }): string;
  hasSourcesMetadata(): boolean;
}
export default Generator;
declare class IndexedSet {
  map: Map<string, number>;
  nextIndex: number;
  constructor();
  indexFor(x: string): number;
  items(): Array<string>;
}