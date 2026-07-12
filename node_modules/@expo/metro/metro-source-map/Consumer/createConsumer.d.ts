import type { MixedSourceMap } from "../source-map";
import type { IConsumer } from "./types";
declare function createConsumer(sourceMap: MixedSourceMap): IConsumer;
export default createConsumer;