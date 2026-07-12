import type { BuildParameters } from "../flow-types";
declare function rootRelativeCacheKeys(buildParameters: BuildParameters): {
  rootDirHash: string;
  relativeConfigHash: string;
};
export default rootRelativeCacheKeys;