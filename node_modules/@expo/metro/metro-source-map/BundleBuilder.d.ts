import type { IndexMap, IndexMapSection, MixedSourceMap } from "./source-map";
export declare class BundleBuilder {
  _file: string;
  _sections: Array<IndexMapSection>;
  _line: number;
  _column: number;
  _code: string;
  _afterMappedContent: boolean;
  constructor(file: string);
  _pushMapSection(map: MixedSourceMap): void;
  _endMappedContent(): void;
  append(code: string, map: null | undefined | MixedSourceMap): this;
  getMap(): MixedSourceMap;
  getCode(): string;
}
export declare function createIndexMap(file: string, sections: Array<IndexMapSection>): IndexMap;