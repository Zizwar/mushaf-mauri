import type { AssetDataWithoutFiles } from "../Assets";
import type { ModuleTransportLike } from "../shared/types";
import type { File } from "@babel/types";
type SubTree<T extends ModuleTransportLike> = (moduleTransport: T, moduleTransportsByPath: Map<string, T>) => Iterable<number>;
export declare function generateAssetCodeFileAst(assetRegistryPath: string, assetDescriptor: AssetDataWithoutFiles): File;
export declare function createRamBundleGroups<T extends ModuleTransportLike>(ramGroups: ReadonlyArray<string>, groupableModules: ReadonlyArray<T>, subtree: SubTree<T>): Map<number, Set<number>>;