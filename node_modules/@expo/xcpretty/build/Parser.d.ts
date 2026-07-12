import { Formatter } from './Formatter';
export type Failure = {
    filePath: string;
    testCase: string;
    reason: string;
};
interface TestIssue {
    reason?: string;
    cursor?: string;
    line?: string;
    filePath?: string;
    fileName?: string;
}
interface LinkerFailure {
    message?: string;
    symbol?: string;
    reference?: string;
    files: string[];
    isWarning?: boolean;
}
export declare class Parser {
    formatter: Formatter;
    private static MAX_SCRIPT_OUTPUT_LINES;
    testSuite?: string;
    testCase?: string;
    testsDone?: boolean;
    formattedSummary: boolean;
    failures: Record<string, Failure[]>;
    formattingLinkerFailure?: boolean;
    formattingWarning?: boolean;
    formattingError?: boolean;
    linkerFailure: LinkerFailure;
    currentIssue: TestIssue;
    /** Rolling buffer of recent unmatched lines, used as context for command failure errors. */
    recentUnmatchedLines: string[];
    /** Tracks the most recently started script phase for error attribution. */
    lastScriptPhase: {
        name: string;
        target?: string;
        project?: string;
    } | null;
    constructor(formatter: Formatter);
    parse(text: string): void | string;
    private updateTestState;
    private updateErrorState;
    private updateLinkerFailureState;
    private shouldFormatError;
    private shouldFormatWarning;
    private errorOrWarningIsPresent;
    private shouldFormatUndefinedSymbols;
    private shouldFormatDuplicateSymbols;
    private formatCompileError;
    private formatCompileWarning;
    private formatUndefinedSymbols;
    private formatDuplicateSymbols;
    private resetLinkerFormatState;
    private storeFailure;
    private formatSummaryIfNeeded;
    private shouldFormatSummary;
}
export {};
