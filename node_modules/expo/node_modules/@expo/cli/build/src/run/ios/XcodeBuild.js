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
    get _assertXcodeBuildResults () {
        return _assertXcodeBuildResults;
    },
    get buildAsync () {
        return buildAsync;
    },
    get extractEnvVariableFromBuild () {
        return extractEnvVariableFromBuild;
    },
    get getAppBinaryPath () {
        return getAppBinaryPath;
    },
    get getEscapedPath () {
        return getEscapedPath;
    },
    get getGenericSimulatorDestination () {
        return getGenericSimulatorDestination;
    },
    get getProcessOptions () {
        return getProcessOptions;
    },
    get getXcodeBuildArgsAsync () {
        return getXcodeBuildArgsAsync;
    },
    get logPrettyItem () {
        return logPrettyItem;
    },
    get matchEstimatedBinaryPath () {
        return matchEstimatedBinaryPath;
    }
});
function _spawnasync() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/spawn-async"));
    _spawnasync = function() {
        return data;
    };
    return data;
}
function _xcpretty() {
    const data = require("@expo/xcpretty");
    _xcpretty = function() {
        return data;
    };
    return data;
}
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
function _child_process() {
    const data = require("child_process");
    _child_process = function() {
        return data;
    };
    return data;
}
function _fs() {
    const data = /*#__PURE__*/ _interop_require_default(require("fs"));
    _fs = function() {
        return data;
    };
    return data;
}
function _os() {
    const data = /*#__PURE__*/ _interop_require_default(require("os"));
    _os = function() {
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
const _configureCodeSigning = require("./codeSigning/configureCodeSigning");
const _simulatorCodeSigning = require("./codeSigning/simulatorCodeSigning");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _dir = require("../../utils/dir");
const _env = require("../../utils/env");
const _errors = require("../../utils/errors");
const _terminal = require("../../utils/terminal");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// Error messages that indicate concurrent Xcode build failures.
// When multiple builds run simultaneously, Xcode's build database can become locked.
const CONCURRENT_BUILD_ERROR_MESSAGE_1 = 'database is locked';
const CONCURRENT_BUILD_ERROR_MESSAGE_2 = 'there are two concurrent builds running';
function getGenericSimulatorDestination(osType) {
    switch(osType){
        case 'tvOS':
            return 'generic/platform=tvOS Simulator';
        case 'watchOS':
            return 'generic/platform=watchOS Simulator';
        case 'xrOS':
            return 'generic/platform=visionOS Simulator';
        case 'iOS':
        default:
            return 'generic/platform=iOS Simulator';
    }
}
function logPrettyItem(message) {
    _log.log((0, _chalk().default)`{whiteBright \u203A} ${message}`);
}
function matchEstimatedBinaryPath(buildOutput) {
    // Match the full path that contains `/(.*)/Developer/Xcode/DerivedData/(.*)/Build/Products/(.*)/(.*).app`
    const appBinaryPathMatch = buildOutput.match(/(\/(?:\\\s|[^ ])+\/Developer\/Xcode\/DerivedData\/(?:\\\s|[^ ])+\/Build\/Products\/(?:Debug|Release)-(?:[^\s/]+)\/(?:\\\s|[^ ])+\.app)/);
    const pathFiltered = appBinaryPathMatch == null ? void 0 : appBinaryPathMatch.filter((a)=>typeof a === 'string' && a);
    if (!(pathFiltered == null ? void 0 : pathFiltered.length)) {
        throw new _errors.CommandError('XCODE_BUILD', `Malformed xcodebuild results: app binary path was not generated in build output. Report this issue and run your project with Xcode instead.`);
    } else {
        var _pathFiltered_sort_;
        // Sort for the shortest
        const shortestPath = (_pathFiltered_sort_ = pathFiltered.sort((a, b)=>a.length - b.length)[0]) == null ? void 0 : _pathFiltered_sort_.trim();
        _log.debug(`Found app binary path: ${shortestPath}`);
        return shortestPath ?? null;
    }
}
function getAppBinaryPath(buildOutput) {
    // Matches what's used in "Bundle React Native code and images" script.
    // Requires that `-hideShellScriptEnvironment` is not included in the build command (extra logs).
    try {
        // Like `\=/Users/evanbacon/Library/Developer/Xcode/DerivedData/Exponent-anpuosnglkxokahjhfszejloqfvo/Build/Products/Debug-iphonesimulator`
        const CONFIGURATION_BUILD_DIR = extractEnvVariableFromBuild(buildOutput, 'CONFIGURATION_BUILD_DIR').sort(// Longer name means more suffixes, we want the shortest possible one to be first.
        // Massive projects (like Expo Go) can sometimes print multiple different sets of environment variables.
        // This can become an issue with some
        (a, b)=>a.length - b.length);
        // Like `Exponent.app`
        const UNLOCALIZED_RESOURCES_FOLDER_PATH = extractEnvVariableFromBuild(buildOutput, 'UNLOCALIZED_RESOURCES_FOLDER_PATH');
        const binaryPath = _path().default.join(// Use the shortest defined env variable (usually there's just one).
        CONFIGURATION_BUILD_DIR[0], // Use the last defined env variable.
        UNLOCALIZED_RESOURCES_FOLDER_PATH[UNLOCALIZED_RESOURCES_FOLDER_PATH.length - 1]);
        // If the app has a space in the name it'll fail because it isn't escaped properly by Xcode.
        return getEscapedPath(binaryPath);
    } catch (error) {
        if (error instanceof _errors.CommandError && error.code === 'XCODE_BUILD') {
            const possiblePath = matchEstimatedBinaryPath(buildOutput);
            if (possiblePath) {
                return possiblePath;
            }
        }
        throw error;
    }
}
function getEscapedPath(filePath) {
    if (_fs().default.existsSync(filePath)) {
        return filePath;
    }
    const unescapedPath = filePath.split(/\\ /).join(' ');
    if (_fs().default.existsSync(unescapedPath)) {
        return unescapedPath;
    }
    throw new _errors.CommandError('XCODE_BUILD', `Unexpected: Generated app at path "${filePath}" cannot be read, the app cannot be installed. Report this and build onto a simulator.`);
}
function extractEnvVariableFromBuild(buildOutput, variableName) {
    // Xcode can sometimes escape `=` with a backslash or put the value in quotes
    const reg = new RegExp(`export ${variableName}\\\\?=(.*)$`, 'mg');
    const matched = [
        ...buildOutput.matchAll(reg)
    ].map((value)=>value[1]).filter((value)=>!!value);
    if (!matched || !matched.length) {
        throw new _errors.CommandError('XCODE_BUILD', `Malformed xcodebuild results: "${variableName}" variable was not generated in build output. Report this issue and run your project with Xcode instead.`);
    }
    return matched;
}
function getProcessOptions({ packager, shouldSkipInitialBundling, terminal, port, eagerBundleOptions }) {
    const SKIP_BUNDLING = shouldSkipInitialBundling ? '1' : undefined;
    if (packager) {
        return {
            env: {
                ...process.env,
                RCT_TERMINAL: terminal,
                SKIP_BUNDLING,
                RCT_METRO_PORT: port.toString(),
                __EXPO_EAGER_BUNDLE_OPTIONS: eagerBundleOptions
            }
        };
    }
    return {
        env: {
            ...process.env,
            RCT_TERMINAL: terminal,
            SKIP_BUNDLING,
            __EXPO_EAGER_BUNDLE_OPTIONS: eagerBundleOptions,
            // Always skip launching the packager from a build script.
            // The script is used for people building their project directly from Xcode.
            // This essentially means "› Running script 'Start Packager'" does nothing.
            RCT_NO_LAUNCH_PACKAGER: 'true'
        }
    };
}
async function getXcodeBuildArgsAsync(props) {
    // Use specific device UDID when available, otherwise use generic simulator destination
    // for build-only workflows (e.g., --device generic).
    const destination = props.device ? `id=${props.device.udid}` : getGenericSimulatorDestination(props.osType);
    const args = [
        props.xcodeProject.isWorkspace ? '-workspace' : '-project',
        props.xcodeProject.name,
        '-configuration',
        props.configuration,
        '-scheme',
        props.scheme,
        '-destination',
        destination,
        // Enable parallel code signing for CocoaPods frameworks to speed up device builds.
        // When building for device, multiple frameworks need to be code signed. By default this
        // happens sequentially. This flag allows them to run in parallel.
        // https://github.com/CocoaPods/CocoaPods/pull/6088
        'COCOAPODS_PARALLEL_CODE_SIGN=true',
        // Disable the Xcode compiler index store during CLI builds.
        // The index store is used for code completion, refactoring, and navigation in Xcode IDE.
        // Since CLI builds don't need these features, disabling it saves build time and disk I/O.
        'COMPILER_INDEX_STORE_ENABLE=NO'
    ];
    // Skip code signing setup for generic simulator builds (no device).
    if (props.device && (!props.isSimulator || (0, _simulatorCodeSigning.simulatorBuildRequiresCodeSigning)(props.projectRoot))) {
        const developmentTeamId = await (0, _configureCodeSigning.ensureDeviceIsCodeSignedForDeploymentAsync)(props.projectRoot);
        if (developmentTeamId) {
            args.push(`DEVELOPMENT_TEAM=${developmentTeamId}`, '-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration');
        }
    }
    // Add last
    if (props.buildCache === false) {
        args.push(// Will first clean the derived data folder.
        'clean', // Then build step must be added otherwise the process will simply clean and exit.
        'build');
    }
    if (_env.env.EXPO_PROFILE) {
        args.push('-showBuildTimingSummary');
    }
    return args;
}
function spawnXcodeBuild(args, options, { onData }) {
    const buildProcess = (0, _child_process().spawn)('xcodebuild', args, options);
    let results = '';
    let error = '';
    buildProcess.stdout.on('data', (data)=>{
        const stringData = data.toString();
        results += stringData;
        onData(stringData);
    });
    buildProcess.stderr.on('data', (data)=>{
        const stringData = data instanceof Buffer ? data.toString() : data;
        error += stringData;
    });
    return new Promise(async (resolve, reject)=>{
        buildProcess.on('close', (code)=>{
            resolve({
                code,
                results,
                error
            });
        });
    });
}
async function spawnXcodeBuildWithFlush(args, options, { onFlush }) {
    let currentBuffer = '';
    // Data can be sent in chunks that would have no relevance to our regex
    // this can cause massive slowdowns, so we need to ensure the data is complete before attempting to parse it.
    function flushBuffer() {
        if (!currentBuffer) {
            return;
        }
        const data = currentBuffer;
        // Reset buffer.
        currentBuffer = '';
        // Process data.
        onFlush(data);
    }
    const data = await spawnXcodeBuild(args, options, {
        onData (stringData) {
            currentBuffer += stringData;
            // Only flush the data if we have a full line.
            if (currentBuffer.endsWith(_os().default.EOL)) {
                flushBuffer();
            }
        }
    });
    // Flush log data at the end just in case we missed something.
    flushBuffer();
    return data;
}
async function spawnXcodeBuildWithFormat(args, options, { projectRoot, xcodeProject }) {
    _log.debug(`  xcodebuild ${args.join(' ')}`);
    logPrettyItem(_chalk().default.bold`Planning build`);
    const formatter = _xcpretty().ExpoRunFormatter.create(projectRoot, {
        xcodeProject,
        isDebug: _env.env.EXPO_DEBUG
    });
    const results = await spawnXcodeBuildWithFlush(args, options, {
        onFlush (data) {
            // Process data through formatter for display
            for (const line of formatter.pipe(data)){
                _log.log(line);
            }
        }
    });
    _log.debug(`Exited with code: ${results.code}`);
    if (// User cancelled with ctrl-c
    results.code === null || // Build interrupted
    results.code === 75) {
        throw new _errors.AbortCommandError();
    }
    _log.log(formatter.getBuildSummary());
    return {
        ...results,
        formatter
    };
}
async function buildAsync(props) {
    const args = await getXcodeBuildArgsAsync(props);
    const { projectRoot, xcodeProject, shouldSkipInitialBundling, port, eagerBundleOptions } = props;
    // Remove extended attributes that can cause code signing failures before building.
    // These are added by Finder, cloud storage services, or when downloading files.
    await removeExtendedAttributesAsync(projectRoot);
    const processOptions = getProcessOptions({
        packager: false,
        terminal: (0, _terminal.getUserTerminal)(),
        shouldSkipInitialBundling,
        port,
        eagerBundleOptions
    });
    // Retry logic for concurrent build failures.
    // When multiple Xcode builds run simultaneously (e.g., in CI), the build database
    // can become locked. We retry with exponential backoff to handle this.
    const maxRetries = 3;
    let retryDelaySeconds = 1;
    let lastResults = null;
    for(let attempt = 0; attempt <= maxRetries; attempt++){
        const { code, results, formatter, error } = await spawnXcodeBuildWithFormat(args, processOptions, {
            projectRoot,
            xcodeProject
        });
        lastResults = {
            code,
            results,
            error,
            formatter
        };
        // If build succeeded or failed for a reason other than concurrent builds, stop retrying
        if (code === 0 || !isConcurrentBuildError(results)) {
            break;
        }
        // If we have retries left, wait and try again
        if (attempt < maxRetries) {
            _log.warn(`Xcode build failed due to concurrent builds, retrying in ${retryDelaySeconds}s... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve)=>setTimeout(resolve, retryDelaySeconds * 1000));
            retryDelaySeconds *= 2; // Exponential backoff
        } else {
            _log.warn('Xcode build failed due to concurrent builds after maximum retries.');
        }
    }
    const { code, results, formatter, error } = lastResults;
    const logFilePath = writeBuildLogs(projectRoot, results, error);
    if (code !== 0) {
        // Determine if the logger found any errors;
        const wasErrorPresented = !!formatter.errors.length;
        if (wasErrorPresented) {
            // This has a flaw, if the user is missing a file, and there is a script error, only the missing file error will be shown.
            // They will only see the script error if they fix the missing file and rerun.
            // The flaw can be fixed by catching script errors in the custom logger.
            throw new _errors.CommandError(`Failed to build iOS project. "xcodebuild" exited with error code ${code}.`);
        }
        _assertXcodeBuildResults(code, results, error, xcodeProject, logFilePath);
    }
    return results;
}
function _assertXcodeBuildResults(code, results, error, xcodeProject, logFilePath) {
    var _error_match;
    const errorTitle = `Failed to build iOS project. "xcodebuild" exited with error code ${code}.`;
    const throwWithMessage = (message)=>{
        throw new _errors.CommandError(`${errorTitle}\nTo view more error logs, try building the app with Xcode directly, by opening ${xcodeProject.name}.\n\n` + message + `Build logs written to ${_chalk().default.underline(logFilePath)}`);
    };
    const localizedError = (_error_match = error.match(/NSLocalizedFailure = "(.*)"/)) == null ? void 0 : _error_match[1];
    if (localizedError) {
        throwWithMessage(_chalk().default.bold(localizedError) + '\n\n');
    }
    // Show all the log info because often times the error is coming from a shell script,
    // that invoked a node script, that started metro, which threw an error.
    throwWithMessage(results + '\n\n' + error);
}
function writeBuildLogs(projectRoot, buildOutput, errorOutput) {
    const [logFilePath, errorFilePath] = getErrorLogFilePath(projectRoot);
    _fs().default.writeFileSync(logFilePath, buildOutput);
    _fs().default.writeFileSync(errorFilePath, errorOutput);
    return logFilePath;
}
function getErrorLogFilePath(projectRoot) {
    const folder = _path().default.join(projectRoot, '.expo');
    (0, _dir.ensureDirectory)(folder);
    return [
        _path().default.join(folder, 'xcodebuild.log'),
        _path().default.join(folder, 'xcodebuild-error.log')
    ];
}
/**
 * Remove extended attributes that can cause code signing failures.
 *
 * Attributes like `com.apple.FinderInfo` and `com.apple.provenance` are added by Finder,
 * cloud storage services (OneDrive, iCloud, Dropbox), or when files are downloaded.
 * These must be removed before code signing or the build may fail.
 *
 * @see https://developer.apple.com/library/archive/qa/qa1940/_index.html
 */ async function removeExtendedAttributesAsync(projectRoot) {
    // These specific attributes are known to cause code signing issues.
    // We preserve com.apple.xcode.CreatedByBuildSystem which Xcode uses to manage build directories.
    const attributesToRemove = [
        'com.apple.FinderInfo',
        'com.apple.provenance'
    ];
    const iosProjectPath = _path().default.join(projectRoot, 'ios');
    // Only proceed if the ios directory exists
    if (!_fs().default.existsSync(iosProjectPath)) {
        return;
    }
    for (const attribute of attributesToRemove){
        try {
            // -r: recursive, -d: delete attribute
            await (0, _spawnasync().default)('xattr', [
                '-r',
                '-d',
                attribute,
                iosProjectPath
            ]);
        } catch  {
            // Ignore errors - attribute may not exist or directory may be missing.
            // This is expected behavior and not a problem.
            _log.debug(`Failed to remove extended attribute ${attribute} (this is usually fine)`);
        }
    }
}
/**
 * Check if the build failure is due to concurrent Xcode builds.
 * When multiple builds run simultaneously, Xcode's build database can become locked.
 */ function isConcurrentBuildError(results) {
    return results.includes(CONCURRENT_BUILD_ERROR_MESSAGE_1) && results.includes(CONCURRENT_BUILD_ERROR_MESSAGE_2);
}

//# sourceMappingURL=XcodeBuild.js.map