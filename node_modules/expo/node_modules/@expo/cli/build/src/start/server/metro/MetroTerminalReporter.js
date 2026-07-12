"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get MetroTerminalReporter () {
        return MetroTerminalReporter;
    },
    get event () {
        return event;
    },
    get extractCodeFrame () {
        return extractCodeFrame;
    },
    get formatUsingNodeStandardLibraryError () {
        return formatUsingNodeStandardLibraryError;
    },
    get isNodeStdLibraryModule () {
        return isNodeStdLibraryModule;
    },
    get stripMetroInfo () {
        return stripMetroInfo;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
function _util() {
    const data = require("util");
    _util = function() {
        return data;
    };
    return data;
}
const _TerminalReporter = require("./TerminalReporter");
const _externals = require("./externals");
const _env = require("../../../utils/env");
const _link = require("../../../utils/link");
const _serverLogLikeMetro = require("../serverLogLikeMetro");
const _metroErrorInterface = require("./metroErrorInterface");
const _events = require("../../../events");
const _ansi = require("../../../utils/ansi");
const _interactive = require("../../../utils/interactive");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:metro:logger');
const event = (0, _events.events)('metro', (t)=>[
        t.event(),
        t.event(),
        t.event(),
        t.event(),
        t.event(),
        t.event(),
        t.event(),
        t.event(),
        t.event()
    ]);
const MAX_PROGRESS_BAR_CHAR_WIDTH = 16;
const DARK_BLOCK_CHAR = '\u2593';
const LIGHT_BLOCK_CHAR = '\u2591';
class MetroTerminalReporter extends _TerminalReporter.TerminalReporter {
    #lastFailedBuildID;
    constructor(serverRoot, terminal){
        super(terminal), this.serverRoot = serverRoot;
    }
    /**
   * Suppress status messages in non-interactive mode.
   * In TTY mode, Terminal overwrites status lines in-place (progress bars).
   * In non-TTY mode, Terminal writes status via a 3500ms throttle, producing
   * permanent output that interleaves with log messages like "Bundled Xms".
   */ _getStatusMessage() {
        if (!(0, _interactive.isInteractive)()) {
            return '';
        }
        return super._getStatusMessage();
    }
    _log(event) {
        this.#captureLog(event);
        switch(event.type){
            case 'unstable_server_log':
                var _event_data;
                if (typeof ((_event_data = event.data) == null ? void 0 : _event_data[0]) === 'string') {
                    const message = event.data[0];
                    if (message.match(/JavaScript logs have moved/)) {
                        // Hide this very loud message from upstream React Native in favor of the note in the terminal UI:
                        // The "› Press j │ open debugger"
                        // logger?.info(
                        //   '\u001B[1m\u001B[7m💡 JavaScript logs have moved!\u001B[22m They can now be ' +
                        //     'viewed in React Native DevTools. Tip: Type \u001B[1mj\u001B[22m in ' +
                        //     'the terminal to open (requires Google Chrome or Microsoft Edge).' +
                        //     '\u001B[27m',
                        // );
                        return;
                    }
                    if (!_env.env.EXPO_DEBUG) {
                        // In the context of developing an iOS app or website, the MetroInspectorProxy "connection" logs are very confusing.
                        // Here we'll hide them behind EXPO_DEBUG or DEBUG=expo:*. In the future we can reformat them to clearly indicate that the "Connection" is regarding the debugger.
                        // These logs are also confusing because they can say "connection established" even when the debugger is not in a usable state. Really they belong in a UI or behind some sort of debug logging.
                        if (message.match(/Connection (closed|established|failed|terminated)/i)) {
                            // Skip logging.
                            return;
                        }
                    }
                }
                break;
            case 'client_log':
                {
                    if (this.shouldFilterClientLog(event)) {
                        return;
                    } else if (event.level != null) {
                        return this.#onClientLog(event);
                    } else {
                        break;
                    }
                }
        }
        return super._log(event);
    }
    // Used for testing
    _getElapsedTime(startTime) {
        return process.hrtime.bigint() - startTime;
    }
    /**
   * Extends the bundle progress to include the current platform that we're bundling.
   *
   * @returns `iOS path/to/bundle.js ▓▓▓▓▓░░░░░░░░░░░ 36.6% (4790/7922)`
   */ _getBundleStatusMessage(progress, phase) {
        var _progress_bundleDetails_customTransformOptions, _progress_bundleDetails;
        const env = getEnvironmentForBuildDetails(progress.bundleDetails);
        const platform = env || getPlatformTagForBuildDetails(progress.bundleDetails);
        const inProgress = phase === 'in_progress';
        const localPath = typeof ((_progress_bundleDetails = progress.bundleDetails) == null ? void 0 : (_progress_bundleDetails_customTransformOptions = _progress_bundleDetails.customTransformOptions) == null ? void 0 : _progress_bundleDetails_customTransformOptions.dom) === 'string' && progress.bundleDetails.customTransformOptions.dom.includes(_path().default.sep) ? progress.bundleDetails.customTransformOptions.dom.replace(/^(\.?\.[\\/])+/, '') : this.#normalizePath(progress.bundleDetails.entryFile);
        if (!inProgress) {
            const status = phase === 'done' ? `Bundled ` : `Bundling failed `;
            const color = phase === 'done' ? _chalk().default.green : _chalk().default.red;
            const startTime = this._bundleTimers.get(progress.bundleDetails.buildID);
            let time = '';
            let ms = null;
            if (startTime != null) {
                const elapsed = this._getElapsedTime(startTime);
                const micro = Number(elapsed) / 1000;
                ms = Number(elapsed) / 1e6;
                // If the milliseconds are < 0.5 then it will display as 0, so we display in microseconds.
                if (ms <= 0.5) {
                    const tenthFractionOfMicro = (micro * 10 / 1000).toFixed(0);
                    // Format as microseconds to nearest tenth
                    time = _chalk().default.cyan.bold(`0.${tenthFractionOfMicro}ms`);
                } else {
                    time = _chalk().default.dim(ms.toFixed(0) + 'ms');
                }
            }
            if (phase === 'done') {
                event('bundling:done', {
                    id: progress.bundleDetails.buildID ?? null,
                    total: progress.totalFileCount,
                    ms
                });
            }
            // iOS Bundled 150ms
            const plural = progress.totalFileCount === 1 ? '' : 's';
            return color(platform + status) + time + _chalk().default.reset.dim(` ${localPath} (${progress.totalFileCount} module${plural})`);
        }
        event('bundling:progress', {
            id: progress.bundleDetails.buildID ?? null,
            progress: progress.ratio,
            total: progress.totalFileCount,
            current: progress.transformedFileCount
        });
        if ((0, _events.shouldReduceLogs)()) {
            return '';
        }
        const filledBar = Math.floor(progress.ratio * MAX_PROGRESS_BAR_CHAR_WIDTH);
        const _progress = inProgress ? _chalk().default.green.bgGreen(DARK_BLOCK_CHAR.repeat(filledBar)) + _chalk().default.bgWhite.white(LIGHT_BLOCK_CHAR.repeat(MAX_PROGRESS_BAR_CHAR_WIDTH - filledBar)) + _chalk().default.bold(` ${(100 * progress.ratio).toFixed(1).padStart(4)}% `) + _chalk().default.dim(`(${progress.transformedFileCount.toString().padStart(progress.totalFileCount.toString().length)}/${progress.totalFileCount})`) : '';
        return platform + _chalk().default.reset.dim(`${_path().default.dirname(localPath)}${_path().default.sep}`) + _chalk().default.bold(_path().default.basename(localPath)) + ' ' + _progress;
    }
    _logInitializing(port, hasReducedPerformance) {
        // Don't print a giant logo...
        if (!(0, _events.shouldReduceLogs)()) {
            this.terminal.log(_chalk().default.dim('Starting Metro Bundler') + '\n');
        }
    }
    shouldFilterClientLog(event) {
        return isAppRegistryStartupMessage(event.data);
    }
    shouldFilterBundleEvent(event) {
        var _event_bundleDetails;
        return 'bundleDetails' in event && ((_event_bundleDetails = event.bundleDetails) == null ? void 0 : _event_bundleDetails.bundleType) === 'map';
    }
    /** Print the cache clear message. */ transformCacheReset() {
        (0, _TerminalReporter.logWarning)(this.terminal, (0, _chalk().default)`Bundler cache is empty, rebuilding {dim (this may take a minute)}`);
    }
    /** One of the first logs that will be printed */ dependencyGraphLoading(hasReducedPerformance) {
        // this.terminal.log('Dependency graph is loading...');
        if (hasReducedPerformance) {
            // Extends https://github.com/facebook/metro/blob/347b1d7ed87995d7951aaa9fd597c04b06013dac/packages/metro/src/lib/TerminalReporter.js#L283-L290
            this.terminal.log(_chalk().default.red([
                'Metro is operating with reduced performance.',
                'Fix the problem above and restart Metro.'
            ].join('\n')));
        }
    }
    /**
   * Workaround to link build ids to bundling errors.
   * This works because `_logBundleBuildFailed` is called before `_logBundlingError` in synchronous manner.
   * https://github.com/facebook/metro/blob/main/packages/metro/src/Server.js#L939-L945
   */ _logBundleBuildFailed(buildID) {
        this.#lastFailedBuildID = buildID;
        super._logBundleBuildFailed(buildID);
    }
    _logBundlingError(error) {
        const importStack = (0, _metroErrorInterface.nearestImportStack)(error);
        const moduleResolutionError = formatUsingNodeStandardLibraryError(this.serverRoot, error);
        if (moduleResolutionError) {
            const message = maybeAppendCodeFrame(moduleResolutionError, error.message);
            event('bundling:failed', {
                id: this.#lastFailedBuildID ?? null,
                message: (0, _ansi.stripAnsi)(message) ?? null,
                importStack: importStack ?? null,
                filename: error.filename ?? null,
                targetModuleName: this.#normalizePath(error.targetModuleName),
                originModulePath: this.#normalizePath(error.originModulePath)
            });
            return this.terminal.log(importStack ? `${message}\n\n${importStack}` : message);
        } else {
            event('bundling:failed', {
                id: this.#lastFailedBuildID ?? null,
                message: (0, _ansi.stripAnsi)(error.message) ?? null,
                importStack: importStack ?? null,
                filename: error.filename ?? null,
                targetModuleName: error.targetModuleName ?? null,
                originModulePath: error.originModulePath ?? null
            });
            (0, _metroErrorInterface.attachImportStackToRootMessage)(error, importStack);
            // NOTE(@kitten): Metro drops the stack forcefully when it finds a `SyntaxError`. However,
            // this is really unhelpful, since it prevents debugging Babel plugins or reporting bugs
            // in Babel plugins or a transformer entirely
            if (error.snippet == null && error.stack != null && error instanceof SyntaxError) {
                error.message = error.stack;
                delete error.stack;
            }
            return super._logBundlingError(error);
        }
    }
    #onClientLog(evt) {
        const { level = 'log' } = evt;
        // Apply printf-style format substitution (e.g. %s, %d) that browsers handle
        // natively in console methods but Node/Metro terminal logging does not.
        const data = applyConsoleFormatting(evt.data);
        const platformTag = getPlatformTagForClientLog(evt.mode);
        if (level === 'warn' || level === 'error') {
            let hasStack = false;
            const parsed = data.map((msg)=>{
                // Quick check to see if an unsymbolicated stack is being logged.
                if (typeof msg === 'string' && // Native stack frames use `.bundle//&platform=...`; web stack frames use `.bundle?platform=...`.
                (msg.includes('.bundle//&platform=') || msg.includes('.bundle?platform='))) {
                    const stack = (0, _serverLogLikeMetro.parseErrorStringToObject)(msg);
                    if (stack) {
                        hasStack = true;
                    }
                    return stack;
                }
                return msg;
            });
            if (hasStack) {
                (async ()=>{
                    const symbolicating = parsed.map((p)=>{
                        if (typeof p === 'string') {
                            return p;
                        } else if (p && typeof p === 'object' && 'message' in p && typeof p.message === 'string') {
                            return (0, _serverLogLikeMetro.maybeSymbolicateAndFormatJSErrorStackLogAsync)(this.serverRoot, level, p);
                        } else {
                            return null;
                        }
                    });
                    let usefulStackCount = 0;
                    const fallbackIndices = [];
                    const symbolicated = (await Promise.allSettled(symbolicating)).map((s, index)=>{
                        if (s.status === 'rejected') {
                            debug('Error formatting stack', parsed[index], s.reason);
                            return parsed[index];
                        } else if (!s.value) {
                            return parsed[index];
                        } else if (typeof s.value === 'string') {
                            return s.value;
                        } else {
                            if (!s.value.isFallback) {
                                usefulStackCount++;
                            } else {
                                fallbackIndices.push(index);
                            }
                            return s.value.stack;
                        }
                    });
                    // Using EXPO_DEBUG we can print all stack
                    const filtered = usefulStackCount && !_env.env.EXPO_DEBUG ? symbolicated.filter((_, index)=>!fallbackIndices.includes(index)) : symbolicated;
                    event('client_log', {
                        level,
                        data: symbolicated
                    });
                    (0, _serverLogLikeMetro.logLikeMetro)(this.terminal.log.bind(this.terminal), level, platformTag, ...filtered);
                })();
                return;
            }
        }
        event('client_log', {
            level,
            data
        });
        // Overwrite the Metro terminal logging so we can improve the warnings, symbolicate stacks, and inject extra info.
        (0, _serverLogLikeMetro.logLikeMetro)(this.terminal.log.bind(this.terminal), level, platformTag, ...data);
    }
    #captureLog(evt) {
        switch(evt.type){
            case 'bundle_build_started':
                {
                    var _evt_bundleDetails_customTransformOptions, _evt_bundleDetails, _evt_bundleDetails_customTransformOptions1;
                    const entry = typeof ((_evt_bundleDetails = evt.bundleDetails) == null ? void 0 : (_evt_bundleDetails_customTransformOptions = _evt_bundleDetails.customTransformOptions) == null ? void 0 : _evt_bundleDetails_customTransformOptions.dom) === 'string' && evt.bundleDetails.customTransformOptions.dom.includes(_path().default.sep) ? evt.bundleDetails.customTransformOptions.dom.replace(/^(\.?\.[\\/])+/, '') : this.#normalizePath(evt.bundleDetails.entryFile);
                    return event('bundling:started', {
                        id: evt.buildID,
                        platform: evt.bundleDetails.platform ?? null,
                        environment: ((_evt_bundleDetails_customTransformOptions1 = evt.bundleDetails.customTransformOptions) == null ? void 0 : _evt_bundleDetails_customTransformOptions1.environment) ?? null,
                        entry
                    });
                }
            case 'unstable_server_log':
                return event('server_log', {
                    level: evt.level ?? null,
                    data: evt.data ?? null
                });
            case 'client_log':
                // Handled separately: see this.#onClientLog
                return;
            case 'hmr_client_error':
            case 'cache_write_error':
            case 'cache_read_error':
                return event(evt.type, {
                    message: evt.error.message
                });
        }
    }
    #normalizePath(dest) {
        return dest != null && _path().default.isAbsolute(dest) ? _path().default.relative(this.serverRoot, dest) : dest || null;
    }
}
function formatUsingNodeStandardLibraryError(serverRoot, error) {
    if (!error.message) {
        return null;
    }
    const { targetModuleName, originModulePath } = error;
    if (!targetModuleName || !originModulePath) {
        return null;
    }
    const relativePath = _path().default.relative(serverRoot, originModulePath);
    const DOCS_PAGE_URL = 'https://docs.expo.dev/workflow/using-libraries/#using-third-party-libraries';
    if (isNodeStdLibraryModule(targetModuleName)) {
        if (originModulePath.includes('node_modules')) {
            return [
                `The package at "${_chalk().default.bold(relativePath)}" attempted to import the Node standard library module "${_chalk().default.bold(targetModuleName)}".`,
                `It failed because the native React runtime does not include the Node standard library.`,
                (0, _link.learnMore)(DOCS_PAGE_URL)
            ].join('\n');
        } else {
            return [
                `You attempted to import the Node standard library module "${_chalk().default.bold(targetModuleName)}" from "${_chalk().default.bold(relativePath)}".`,
                `It failed because the native React runtime does not include the Node standard library.`,
                (0, _link.learnMore)(DOCS_PAGE_URL)
            ].join('\n');
        }
    }
    return `Unable to resolve "${targetModuleName}" from "${relativePath}"`;
}
function isNodeStdLibraryModule(moduleName) {
    return /^node:/.test(moduleName) || _externals.NODE_STDLIB_MODULES.includes(moduleName);
}
/** If the code frame can be found then append it to the existing message.  */ function maybeAppendCodeFrame(message, rawMessage) {
    const codeFrame = extractCodeFrame(stripMetroInfo(rawMessage));
    if (codeFrame) {
        message += '\n' + codeFrame;
    }
    return message;
}
function extractCodeFrame(errorMessage) {
    const codeFrameLine = /^(?:\s*(?:>?\s*\d+\s*\||\s*\|).*\n?)+/;
    let wasPreviousLineCodeFrame = null;
    return errorMessage.split('\n').filter((line)=>{
        if (wasPreviousLineCodeFrame === false) return false;
        const keep = codeFrameLine.test((0, _util().stripVTControlCharacters)(line));
        if (keep && wasPreviousLineCodeFrame === null) wasPreviousLineCodeFrame = true;
        else if (!keep && wasPreviousLineCodeFrame) wasPreviousLineCodeFrame = false;
        return keep;
    }).join('\n');
}
function stripMetroInfo(errorMessage) {
    // Newer versions of Metro don't include the list.
    if (!errorMessage.includes('4. Remove the cache')) {
        return errorMessage;
    }
    const lines = errorMessage.split('\n');
    const index = lines.findIndex((line)=>line.includes('4. Remove the cache'));
    if (index === -1) {
        return errorMessage;
    }
    return lines.slice(index + 1).join('\n');
}
/** @returns if the message matches the initial startup log */ function isAppRegistryStartupMessage(body) {
    return body.length === 1 && (/^Running application "main" with appParams:/.test(body[0]) || /^Running "main" with \{/.test(body[0]));
}
/** Apply printf-style format substitutions (%s, %d, %i, %f, %o, %O) that browsers handle natively */ function applyConsoleFormatting(data) {
    if (data.length <= 1 || typeof data[0] !== 'string' || !/%[sdifoO%]/.test(data[0])) {
        return data;
    }
    return [
        (0, _util().format)(...data)
    ];
}
/** @returns formatted platform name for a client log event, or null if no prefix should be shown */ function getPlatformTagForClientLog(mode) {
    switch(mode){
        case 'ios':
            return 'iOS';
        case 'android':
            return 'Android';
        case 'web':
            return 'Web';
        case 'dom':
            return 'DOM';
        default:
            return null;
    }
}
/** @returns platform specific tag for a `BundleDetails` object */ function getPlatformTagForBuildDetails(bundleDetails) {
    const platform = (bundleDetails == null ? void 0 : bundleDetails.platform) ?? null;
    if (platform) {
        let formatted;
        switch(platform){
            case 'ios':
                formatted = 'iOS';
                break;
            case 'android':
                formatted = 'Android';
                break;
            case 'web':
                formatted = 'Web';
                break;
            case 'dom':
                formatted = 'DOM';
                break;
            default:
                formatted = platform;
        }
        return `${_chalk().default.bold(formatted)} `;
    }
    return '';
}
/** @returns platform specific tag for a `BundleDetails` object */ function getEnvironmentForBuildDetails(bundleDetails) {
    var _bundleDetails_customTransformOptions, _bundleDetails_customTransformOptions1, _bundleDetails_customTransformOptions2;
    // Expo CLI will pass `customTransformOptions.environment = 'node'` when bundling for the server.
    const env = (bundleDetails == null ? void 0 : (_bundleDetails_customTransformOptions = bundleDetails.customTransformOptions) == null ? void 0 : _bundleDetails_customTransformOptions.environment) ?? null;
    if (env === 'node') {
        return _chalk().default.bold('λ') + ' ';
    } else if (env === 'react-server') {
        return _chalk().default.bold(`RSC(${getPlatformTagForBuildDetails(bundleDetails).trim()})`) + ' ';
    }
    if ((bundleDetails == null ? void 0 : (_bundleDetails_customTransformOptions1 = bundleDetails.customTransformOptions) == null ? void 0 : _bundleDetails_customTransformOptions1.dom) && typeof (bundleDetails == null ? void 0 : (_bundleDetails_customTransformOptions2 = bundleDetails.customTransformOptions) == null ? void 0 : _bundleDetails_customTransformOptions2.dom) === 'string') {
        return _chalk().default.bold(`DOM`) + ' ';
    }
    return '';
}

//# sourceMappingURL=MetroTerminalReporter.js.map