import SplitHost from './SplitHost';
export * from './SplitHost.types';
export * from './SplitScreen.types';
/**
 * EXPERIMENTAL API, MIGHT CHANGE W/O ANY NOTICE
 */
declare const Split: {
    Host: typeof SplitHost;
    Column: (props: import("./SplitScreen.types").SplitScreenProps) => import("react").JSX.Element;
    Inspector: (props: import("./SplitScreen.types").SplitScreenProps) => import("react").JSX.Element;
};
export default Split;
//# sourceMappingURL=index.d.ts.map