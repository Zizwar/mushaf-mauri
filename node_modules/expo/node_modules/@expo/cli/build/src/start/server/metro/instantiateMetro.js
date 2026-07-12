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
    get event () {
        return event;
    },
    get instantiateMetroAsync () {
        return instantiateMetroAsync;
    },
    get isWatchEnabled () {
        return isWatchEnabled;
    },
    get loadMetroConfigAsync () {
        return loadMetroConfigAsync;
    }
});
function _config() {
    const data = require("@expo/config");
    _config = function() {
        return data;
    };
    return data;
}
function _paths() {
    const data = require("@expo/config/paths");
    _paths = function() {
        return data;
    };
    return data;
}
function _RevisionNotFoundError() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/metro/metro/IncrementalBundler/RevisionNotFoundError"));
    _RevisionNotFoundError = function() {
        return data;
    };
    return data;
}
function _formatBundlingError() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/metro/metro/lib/formatBundlingError"));
    _formatBundlingError = function() {
        return data;
    };
    return data;
}
function _metrocore() {
    const data = require("@expo/metro/metro-core");
    _metrocore = function() {
        return data;
    };
    return data;
}
function _metroconfig() {
    const data = require("@expo/metro-config");
    _metroconfig = function() {
        return data;
    };
    return data;
}
function _packedMap() {
    const data = require("@expo/metro-config/build/serializer/packedMap");
    _packedMap = function() {
        return data;
    };
    return data;
}
function _sourceMap() {
    const data = require("@expo/metro-config/build/serializer/sourceMap");
    _sourceMap = function() {
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
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
const _DevToolsPluginWebsocketEndpoint = require("./DevToolsPluginWebsocketEndpoint");
const _MetroTerminalReporter = require("./MetroTerminalReporter");
const _createFileMapfork = require("./createFileMap-fork");
const _attachAtlas = require("./debugging/attachAtlas");
const _createDebugMiddleware = require("./debugging/createDebugMiddleware");
const _createMetroMiddleware = require("./dev-server/createMetroMiddleware");
const _runServerfork = require("./runServer-fork");
const _withMetroMultiPlatform = require("./withMetroMultiPlatform");
const _events = require("../../../events");
const _log = require("../../../log");
const _env = require("../../../utils/env");
const _errors = require("../../../utils/errors");
const _CorsMiddleware = require("../middleware/CorsMiddleware");
const _createJsInspectorMiddleware = require("../middleware/inspector/createJsInspectorMiddleware");
const _mutations = require("../middleware/mutations");
const _platformBundlers = require("../platformBundlers");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const event = (0, _events.events)('metro', (t)=>[
        t.event(),
        t.event()
    ]);
function asWritable(input) {
    return input;
}
/**
 * Extends Metro's Terminal to intercept all console methods so they don't
 * corrupt the progress bar status lines.
 *
 * console.log/info are routed through terminal.log() (stdout, managed).
 * console.warn/error are routed through logStderr() which clears the
 * status from stdout before writing to stderr, then restores it.
 * Without this, unmanaged stderr writes shift the cursor and cause
 * progress bars to get stuck as permanent output.
 */ class LogRespectingTerminal extends _metrocore().Terminal {
    #stderrQueue;
    #drainingStderr;
    constructor(stream){
        super(stream, {
            ttyPrint: true
        }), this.#stderrQueue = [], this.#drainingStderr = false;
        const sendLog = (...msg)=>{
            if (!msg.length) {
                this.log('');
            } else {
                const [format, ...args] = msg;
                this.log(format, ...args);
            }
            // Flush the logs to the terminal immediately so logs at the end of the process are not lost.
            this.flush();
        };
        const sendStderr = (...msg)=>{
            if (!msg.length) {
                this.logStderr('');
            } else {
                const [format, ...args] = msg;
                this.logStderr(require('util').format(format, ...args));
            }
        };
        console.log = sendLog;
        console.info = sendLog;
        console.warn = sendStderr;
        console.error = sendStderr;
        // NOTE(@kitten): We flush the stderr queue immediately when we're about to exit
        process.on('exit', ()=>{
            if (!this.#drainingStderr && this.#stderrQueue.length) {
                this.#drainingStderr = true;
                this.status('');
                const lines = this.#stderrQueue.splice(0);
                process.stderr.write(lines.join('\n') + '\n');
            }
        });
    }
    /** Write to stderr without corrupting Terminal's cursor tracking. */ logStderr(line) {
        if (!process.stdout.isTTY) {
            process.stderr.write(line + '\n');
            return;
        }
        this.#stderrQueue.push(line);
        this.#drainStderr();
    }
    async #drainStderr() {
        if (this.#drainingStderr) return;
        this.#drainingStderr = true;
        while(this.#stderrQueue.length > 0){
            // Clear status, flush to ensure it's removed from screen
            const prev = this.status('');
            await this.flush();
            // Write to stderr while status is cleared
            const lines = this.#stderrQueue.splice(0);
            process.stderr.write(lines.join('\n') + '\n');
            // Restore status
            this.status(prev);
        }
        this.#drainingStderr = false;
    }
}
// Share one instance of Terminal for all instances of Metro.
const terminal = new LogRespectingTerminal(process.stdout);
async function loadMetroConfigAsync(projectRoot, options, { exp, isExporting, getMetroBundler }) {
    var _exp_experiments, _exp_experiments1, _exp_experiments2, _exp_experiments3, _exp_experiments4, _config_resolver, _exp_experiments5, _exp_experiments6;
    let reportEvent;
    // We're resolving a monorepo root, higher up than the `projectRoot`. If this
    // folder is different (presumably a parent) we're in a monorepo
    const serverRoot = (0, _paths().getMetroServerRoot)(projectRoot);
    const isWorkspace = serverRoot !== projectRoot;
    // Out-of-tree platforms (tvos/macos) rely on the autolinking module resolver to remap the
    // react-native package to their support package, and require autolinking module resolution
    const targetsOutOfTreePlatform = (0, _config().getPlatformsFromConfig)(projectRoot, exp).some((platform)=>platform === 'tvos' || platform === 'macos');
    // Autolinking Module Resolution is enabled by default in a monorepo or for out-of-tree platforms.
    const autolinkingModuleResolutionEnabled = ((_exp_experiments = exp.experiments) == null ? void 0 : _exp_experiments.autolinkingModuleResolution) ?? (isWorkspace || targetsOutOfTreePlatform);
    const serverActionsEnabled = ((_exp_experiments1 = exp.experiments) == null ? void 0 : _exp_experiments1.reactServerFunctions) ?? _env.env.EXPO_UNSTABLE_SERVER_FUNCTIONS;
    const serverComponentsEnabled = !!((_exp_experiments2 = exp.experiments) == null ? void 0 : _exp_experiments2.reactServerComponentRoutes);
    if (serverActionsEnabled) {
        process.env.EXPO_UNSTABLE_SERVER_FUNCTIONS = '1';
    }
    // NOTE: Enable all the experimental Metro flags when RSC is enabled.
    if (serverComponentsEnabled || serverActionsEnabled) {
        process.env.EXPO_USE_METRO_REQUIRE = '1';
    }
    if ((_exp_experiments3 = exp.experiments) == null ? void 0 : _exp_experiments3.reactCanary) {
        _log.Log.warn(`React 19 is enabled by default. Remove unused experiments.reactCanary flag.`);
    }
    const terminalReporter = new _MetroTerminalReporter.MetroTerminalReporter(serverRoot, terminal);
    let config = await (0, _metroconfig().loadUserConfig)({
        projectRoot,
        serverRoot,
        // NOTE: Allow external tools to override the metro config. This is considered internal and unstable
        overrideConfigPath: _env.env.EXPO_OVERRIDE_METRO_CONFIG ?? undefined
    });
    config = {
        ...config,
        // See: `overrideConfigWithArguments` https://github.com/facebook/metro/blob/5059e26/packages/metro-config/src/loadConfig.js#L274-L339
        // Compare to `LoadOptions` type (disregard `reporter` as we don't expose this)
        resetCache: !!options.resetCache,
        maxWorkers: options.maxWorkers ?? config.maxWorkers,
        server: {
            ...config.server,
            port: options.port ?? config.server.port
        },
        // Force-override the reporter
        reporter: {
            update (event) {
                terminalReporter.update(event);
                if (reportEvent) {
                    reportEvent(event);
                }
            }
        }
    };
    // On-Demand Filesystem is enabled by default
    // TODO(@kitten): Add to config-types JSON schema
    const onDemandFilesystem = ((_exp_experiments4 = exp.experiments) == null ? void 0 : _exp_experiments4.onDemandFilesystem) ?? true;
    asWritable(config.resolver).unstable_onDemandFilesystem = onDemandFilesystem;
    globalThis.__requireCycleIgnorePatterns = (_config_resolver = config.resolver) == null ? void 0 : _config_resolver.requireCycleIgnorePatterns;
    if (isExporting) {
        var _exp_experiments7;
        // This token will be used in the asset plugin to ensure the path is correct for writing locally.
        asWritable(config.transformer).publicPath = `/assets?export_path=${(((_exp_experiments7 = exp.experiments) == null ? void 0 : _exp_experiments7.baseUrl) ?? '') + '/assets'}`;
    } else {
        asWritable(config.transformer).publicPath = '/assets/?unstable_path=.';
    }
    const platformBundlers = (0, _platformBundlers.getPlatformBundlers)(projectRoot, exp);
    const reduceLogs = (0, _events.shouldReduceLogs)();
    const reactCompilerEnabled = !!((_exp_experiments5 = exp.experiments) == null ? void 0 : _exp_experiments5.reactCompiler);
    if (!reduceLogs && reactCompilerEnabled) {
        _log.Log.log(_chalk().default.gray`React Compiler enabled`);
    }
    if (!reduceLogs && autolinkingModuleResolutionEnabled) {
        _log.Log.log(_chalk().default.gray`Expo Autolinking module resolution enabled`);
    }
    if (_env.env.EXPO_UNSTABLE_TREE_SHAKING && !_env.env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH) {
        throw new _errors.CommandError('EXPO_UNSTABLE_TREE_SHAKING requires EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH to be enabled.');
    }
    if (!reduceLogs && _env.env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH) {
        _log.Log.warn(`Experimental bundle optimization is enabled.`);
    }
    if (!reduceLogs && _env.env.EXPO_UNSTABLE_TREE_SHAKING) {
        _log.Log.warn(`Experimental tree shaking is enabled.`);
    }
    if (!reduceLogs && _env.env.EXPO_UNSTABLE_LOG_BOX) {
        _log.Log.warn(`Experimental Expo LogBox is enabled.`);
    }
    if (!reduceLogs && serverActionsEnabled) {
        var _exp_experiments8;
        _log.Log.warn(`React Server Functions (beta) are enabled. Route rendering mode: ${((_exp_experiments8 = exp.experiments) == null ? void 0 : _exp_experiments8.reactServerComponentRoutes) ? 'server' : 'client'}`);
    }
    config = await (0, _withMetroMultiPlatform.withMetroMultiPlatformAsync)(projectRoot, {
        config,
        exp,
        platformBundlers,
        serverRoot,
        isTsconfigPathsEnabled: ((_exp_experiments6 = exp.experiments) == null ? void 0 : _exp_experiments6.tsconfigPaths) ?? true,
        isAutolinkingResolverEnabled: autolinkingModuleResolutionEnabled,
        isExporting,
        isNamedRequiresEnabled: _env.env.EXPO_USE_METRO_REQUIRE,
        isReactServerComponentsEnabled: serverComponentsEnabled,
        getMetroBundler
    });
    event('config', {
        serverRoot: event.path(serverRoot),
        projectRoot: event.path(projectRoot),
        exporting: isExporting,
        flags: {
            autolinkingModuleResolution: autolinkingModuleResolutionEnabled,
            serverActions: serverActionsEnabled,
            serverComponents: serverComponentsEnabled,
            reactCompiler: reactCompilerEnabled,
            optimizeGraph: _env.env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH,
            treeshaking: _env.env.EXPO_UNSTABLE_TREE_SHAKING,
            logbox: _env.env.EXPO_UNSTABLE_LOG_BOX
        }
    });
    return {
        config,
        setEventReporter: (logger)=>reportEvent = logger,
        reporter: terminalReporter
    };
}
async function instantiateMetroAsync(metroBundler, options, { isExporting, exp = (0, _config().getConfig)(metroBundler.projectRoot, {
    skipSDKVersionRequirement: true
}).exp }) {
    var _metroConfig_server;
    const projectRoot = metroBundler.projectRoot;
    const getMetroBundler = ()=>metro.getBundler().getBundler();
    const { config: metroConfig, setEventReporter, reporter } = await loadMetroConfigAsync(projectRoot, options, {
        exp,
        isExporting,
        getMetroBundler
    });
    // Get local URL to Metro bundler server (typically configured as 127.0.0.1:8081)
    const serverBaseUrl = metroBundler.getUrlCreator().constructUrl({
        scheme: 'http',
        hostType: 'localhost'
    });
    // Create the core middleware stack for Metro, including websocket listeners
    const { middleware, messagesSocket, eventsSocket, websocketEndpoints } = (0, _createMetroMiddleware.createMetroMiddleware)(metroConfig, {
        getMetroBundler,
        serverBaseUrl
    });
    if (!isExporting) {
        // Enable correct CORS headers for Expo Router features
        (0, _mutations.prependMiddleware)(middleware, (0, _CorsMiddleware.createCorsMiddleware)(exp));
        // Enable debug middleware for CDP-related debugging
        const { debugMiddleware, debugWebsocketEndpoints } = (0, _createDebugMiddleware.createDebugMiddleware)({
            serverBaseUrl,
            reporter
        });
        Object.assign(websocketEndpoints, debugWebsocketEndpoints);
        middleware.use(debugMiddleware);
        middleware.use('/_expo/debugger', (0, _createJsInspectorMiddleware.createJsInspectorMiddleware)({
            serverBaseUrl
        }));
        // TODO(cedric): `enhanceMiddleware` is deprecated, but is currently used to unify the middleware stacks
        // See: https://github.com/facebook/metro/commit/22e85fde85ec454792a1b70eba4253747a2587a9
        // See: https://github.com/facebook/metro/commit/d0d554381f119bb80ab09dbd6a1d310b54737e52
        const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
        asWritable(metroConfig.server).enhanceMiddleware = (metroMiddleware, server)=>{
            if (customEnhanceMiddleware) {
                metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
            }
            return middleware.use(metroMiddleware);
        };
        const devtoolsWebsocketEndpoints = (0, _DevToolsPluginWebsocketEndpoint.createDevToolsPluginWebsocketEndpoint)();
        Object.assign(websocketEndpoints, devtoolsWebsocketEndpoints);
    }
    // Attach Expo Atlas if enabled
    await (0, _attachAtlas.attachAtlasAsync)({
        isExporting,
        exp,
        projectRoot,
        middleware,
        metroConfig,
        // NOTE(cedric): reset the Atlas file once, and reuse it for static exports
        resetAtlasFile: isExporting
    });
    // Support HTTPS based on the metro's tls server config
    // TODO(@kitten): Remove cast once `@expo/metro` is updated to a Metro version that supports the tls config
    const tls = (_metroConfig_server = metroConfig.server) == null ? void 0 : _metroConfig_server.tls;
    const secureServerOptions = tls ? {
        key: tls.key,
        cert: tls.cert,
        ca: tls.ca,
        requestCert: tls.requestCert
    } : undefined;
    const watch = !isExporting && isWatchEnabled();
    const { address, server, hmrServer, metro } = await (0, _createFileMapfork.replaceMetroFileMap)(()=>{
        return (0, _runServerfork.runServer)(metroBundler, metroConfig, {
            host: options.host,
            websocketEndpoints,
            watch,
            secureServerOptions
        }, {
            mockServer: isExporting
        });
    });
    event('instantiate', {
        atlas: _env.env.EXPO_ATLAS,
        workers: metroConfig.maxWorkers ?? null,
        host: (address == null ? void 0 : address.address) ?? null,
        port: (address == null ? void 0 : address.port) ?? null
    });
    // Patch transform file to remove inconvenient customTransformOptions which are only used in single well-known files.
    const originalTransformFile = metro.getBundler().getBundler().transformFile.bind(metro.getBundler().getBundler());
    metro.getBundler().getBundler().transformFile = async function(filePath, transformOptions, fileBuffer) {
        return originalTransformFile(filePath, pruneCustomTransformOptions(projectRoot, filePath, // Clone the options so we don't mutate the original.
        {
            ...transformOptions,
            customTransformOptions: {
                __proto__: null,
                ...transformOptions.customTransformOptions
            }
        }), fileBuffer);
    };
    // Layered on top of the prune patch above. Both fresh worker results
    // and cache hits flow through `Bundler.transformFile`, so wrapping
    // here covers both.
    (0, _packedMap().patchTransformFileForPackedMaps)(metro.getBundler().getBundler());
    (0, _sourceMap().patchMetroSourceMapStringForPackedMaps)();
    setEventReporter(eventsSocket.reportMetroEvent);
    // This function ensures that modules in source maps are sorted in the same
    // order as in a plain JS bundle.
    metro._getSortedModules = function(graph) {
        var _graph_transformOptions_customTransformOptions;
        const modules = [
            ...graph.dependencies.values()
        ];
        const ctx = {
            // TODO(@kitten): Increase type-safety here
            platform: graph.transformOptions.platform,
            environment: (_graph_transformOptions_customTransformOptions = graph.transformOptions.customTransformOptions) == null ? void 0 : _graph_transformOptions_customTransformOptions.environment
        };
        // Assign IDs to modules in a consistent order
        for (const module of modules){
            this._createModuleId(module.path, ctx);
        }
        // Sort by IDs
        return modules.sort((a, b)=>this._createModuleId(a.path, ctx) - this._createModuleId(b.path, ctx));
    };
    if (hmrServer) {
        let hmrJSBundle;
        try {
            hmrJSBundle = require('@expo/metro-config/build/serializer/fork/hmrJSBundle').default;
        } catch  {
            // TODO: Add fallback for monorepo tests up until the fork is merged.
            _log.Log.warn('Failed to load HMR serializer from @expo/metro-config, using fallback version.');
            hmrJSBundle = require('@expo/metro/metro/DeltaBundler/Serializers/hmrJSBundle');
        }
        // Patch HMR Server to send more info to the `_createModuleId` function for deterministic module IDs and add support for serializing HMR updates the same as all other bundles.
        hmrServer._prepareMessage = async function(group, options, changeEvent) {
            // Fork of https://github.com/facebook/metro/blob/3b3e0aaf725cfa6907bf2c8b5fbc0da352d29efe/packages/metro/src/HmrServer.js#L327-L393
            // with patch for `_createModuleId`.
            const logger = !options.isInitialUpdate ? changeEvent == null ? void 0 : changeEvent.logger : null;
            try {
                var _revision_graph_transformOptions_customTransformOptions;
                const revPromise = this._bundler.getRevision(group.revisionId);
                if (!revPromise) {
                    return {
                        type: 'error',
                        body: (0, _formatBundlingError().default)(new (_RevisionNotFoundError()).default(group.revisionId))
                    };
                }
                logger == null ? void 0 : logger.point('updateGraph_start');
                const { revision, delta } = await this._bundler.updateGraph(await revPromise, false);
                logger == null ? void 0 : logger.point('updateGraph_end');
                this._clientGroups.delete(group.revisionId);
                group.revisionId = revision.id;
                for (const client of group.clients){
                    client.revisionIds = client.revisionIds.filter((revisionId)=>revisionId !== group.revisionId);
                    client.revisionIds.push(revision.id);
                }
                this._clientGroups.set(group.revisionId, group);
                logger == null ? void 0 : logger.point('serialize_start');
                // NOTE(EvanBacon): This is the patch
                const moduleIdContext = {
                    // TODO(@kitten): Increase type-safety here
                    platform: revision.graph.transformOptions.platform,
                    environment: (_revision_graph_transformOptions_customTransformOptions = revision.graph.transformOptions.customTransformOptions) == null ? void 0 : _revision_graph_transformOptions_customTransformOptions.environment
                };
                const hmrUpdate = hmrJSBundle(delta, revision.graph, {
                    clientUrl: group.clientUrl,
                    // NOTE(EvanBacon): This is also the patch
                    createModuleId: (moduleId)=>{
                        return this._createModuleId(moduleId, moduleIdContext);
                    },
                    includeAsyncPaths: group.graphOptions.lazy,
                    projectRoot: this._config.projectRoot,
                    serverRoot: this._config.server.unstable_serverRoot ?? this._config.projectRoot
                });
                logger == null ? void 0 : logger.point('serialize_end');
                return {
                    type: 'update',
                    body: {
                        revisionId: revision.id,
                        isInitialUpdate: options.isInitialUpdate,
                        ...hmrUpdate
                    }
                };
            } catch (error) {
                const formattedError = (0, _formatBundlingError().default)(error);
                this._config.reporter.update({
                    type: 'bundling_error',
                    error
                });
                return {
                    type: 'error',
                    body: formattedError
                };
            }
        };
    }
    return {
        metro,
        hmrServer,
        server,
        middleware,
        messageSocket: messagesSocket,
        address
    };
}
// TODO: Fork the entire transform function so we can simply regex the file contents for keywords instead.
function pruneCustomTransformOptions(projectRoot, filePath, transformOptions) {
    var _transformOptions_customTransformOptions, _transformOptions_customTransformOptions1, _transformOptions_customTransformOptions2, _transformOptions_customTransformOptions3;
    // Normalize the filepath for cross platform checking.
    filePath = filePath.split(_path().default.sep).join('/');
    if (((_transformOptions_customTransformOptions = transformOptions.customTransformOptions) == null ? void 0 : _transformOptions_customTransformOptions.dom) && // The only generated file that needs the dom root is `expo/dom/entry.js`
    !filePath.match(/expo\/dom\/entry\.js$/)) {
        // Clear the dom root option if we aren't transforming the magic entry file, this ensures
        // that cached artifacts from other DOM component bundles can be reused.
        transformOptions.customTransformOptions.dom = 'true';
    }
    const routerRoot = (_transformOptions_customTransformOptions1 = transformOptions.customTransformOptions) == null ? void 0 : _transformOptions_customTransformOptions1.routerRoot;
    if (typeof routerRoot === 'string') {
        const isRouterEntry = /\/expo-router\/_ctx/.test(filePath);
        // The router root is used all over expo-router (`process.env.EXPO_ROUTER_ABS_APP_ROOT`, `process.env.EXPO_ROUTER_APP_ROOT`) so we'll just ignore the entire package.
        const isRouterModule = /\/expo-router\/build\//.test(filePath);
        // Any page/router inside the expo-router app folder may access the `routerRoot` option to determine whether it's in the app folder
        const resolvedRouterRoot = _path().default.resolve(projectRoot, routerRoot).split(_path().default.sep).join('/');
        const isRouterRoute = _path().default.isAbsolute(filePath) && filePath.startsWith(resolvedRouterRoot);
        // In any other file than the above, we enforce that we mustn't use `routerRoot`, and set it to an arbitrary value here (the default)
        // to ensure that the cache never invalidates when this value is changed
        if (!isRouterEntry && !isRouterModule && !isRouterRoute) {
            transformOptions.customTransformOptions.routerRoot = 'app';
        }
    }
    if (((_transformOptions_customTransformOptions2 = transformOptions.customTransformOptions) == null ? void 0 : _transformOptions_customTransformOptions2.asyncRoutes) && // The async routes settings are also used in `expo-router/_ctx.ios.js` (and other platform variants) via `process.env.EXPO_ROUTER_IMPORT_MODE`
    !(filePath.match(/\/expo-router\/_ctx/) || filePath.match(/\/expo-router\/build\//))) {
        delete transformOptions.customTransformOptions.asyncRoutes;
    }
    if (((_transformOptions_customTransformOptions3 = transformOptions.customTransformOptions) == null ? void 0 : _transformOptions_customTransformOptions3.clientBoundaries) && // The client boundaries are only used in `expo/virtual/rsc.js` for production RSC exports.
    !filePath.match(/\/expo\/virtual\/rsc\.js$/)) {
        delete transformOptions.customTransformOptions.clientBoundaries;
    }
    return transformOptions;
}
function isWatchEnabled() {
    if (_env.env.CI) {
        _log.Log.log((0, _chalk().default)`Metro is running in CI mode, reloads are disabled. Remove {bold CI=true} to enable watch mode.`);
    }
    return !_env.env.CI;
}

//# sourceMappingURL=instantiateMetro.js.map