import type { WatcherOptions } from "./common";
import { AbstractWatcher } from "./AbstractWatcher";
declare class WatchmanWatcher extends AbstractWatcher {
  readonly subscriptionName: string;
  constructor(dir: string, opts: WatcherOptions);
  startWatching(): Promise<void>;
  stopWatching(): Promise<void>;
  getPauseReason(): null | undefined | string;
}
export default WatchmanWatcher;