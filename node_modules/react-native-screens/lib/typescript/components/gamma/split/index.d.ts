import SplitHost from './SplitHost';
export type { DisplayModeWillChangeEvent, // TODO: This event should be renamed to match the convention
SplitDisplayModeButtonVisibility, SplitBehavior, SplitPrimaryEdge, SplitPrimaryBackgroundStyle, SplitDisplayMode, SplitHostOrientation, SplitColumnMetrics, SplitNavigableColumn, SplitHostCommands, SplitHostProps, } from './SplitHost.types';
export type { SplitScreenColumnType, SplitScreenProps, } from './SplitScreen.types';
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
export declare const Split: {
    Host: typeof SplitHost;
    Column: (props: import("./SplitScreen.types").SplitScreenProps) => import("react").JSX.Element;
    Inspector: (props: import("./SplitScreen.types").SplitScreenProps) => import("react").JSX.Element;
};
//# sourceMappingURL=index.d.ts.map