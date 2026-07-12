declare function checkWatchmanCapabilities(requiredCapabilities: ReadonlyArray<string>): Promise<{
  version: string;
}>;
export default checkWatchmanCapabilities;