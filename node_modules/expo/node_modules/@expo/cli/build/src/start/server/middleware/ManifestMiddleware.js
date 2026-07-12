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
    get DEVELOPER_TOOL () {
        return DEVELOPER_TOOL;
    },
    get ManifestMiddleware () {
        return ManifestMiddleware;
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
function _nodestream() {
    const data = require("node:stream");
    _nodestream = function() {
        return data;
    };
    return data;
}
function _promises() {
    const data = require("node:stream/promises");
    _promises = function() {
        return data;
    };
    return data;
}
function _url() {
    const data = require("url");
    _url = function() {
        return data;
    };
    return data;
}
const _ExpoMiddleware = require("./ExpoMiddleware");
const _metroOptions = require("./metroOptions");
const _resolveAssets = require("./resolveAssets");
const _resolvePlatform = require("./resolvePlatform");
const _user = require("../../../api/user/user");
const _exportHermes = require("../../../export/exportHermes");
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../../log"));
const _env = require("../../../utils/env");
const _devices = /*#__PURE__*/ _interop_require_wildcard(require("../../project/devices"));
const _router = require("../metro/router");
const _platformBundlers = require("../platformBundlers");
const _webTemplate = require("../webTemplate");
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
const debug = require('debug')('expo:start:server:middleware:manifest');
const DEVELOPER_TOOL = 'expo-cli';
class ManifestMiddleware extends _ExpoMiddleware.ExpoMiddleware {
    constructor(projectRoot, options){
        super(projectRoot, /**
       * Only support `/`, `/manifest`, `/index.exp` for the manifest middleware.
       */ [
            '/',
            '/manifest',
            '/index.exp'
        ]), this.projectRoot = projectRoot, this.options = options;
        this.initialProjectConfig = (0, _config().getConfig)(projectRoot);
        this.platformBundlers = (0, _platformBundlers.getPlatformBundlers)(projectRoot, this.initialProjectConfig.exp);
    }
    /** Exposed for testing. */ async _resolveProjectSettingsAsync({ platform, hostname, protocol }) {
        var _projectConfig_exp_experiments;
        // Read the config
        const projectConfig = (0, _config().getConfig)(this.projectRoot);
        // Read from headers
        const mainModuleName = this.resolveMainModuleName({
            pkg: projectConfig.pkg,
            platform
        });
        const isHermesEnabled = (0, _exportHermes.isEnableHermesManaged)(projectConfig.exp, platform);
        // Resolve the signed-in CLI user to pass through the manifest
        const user = await (0, _user.getUserAsync)();
        const username = (0, _user.getActorDisplayName)(user);
        // Create the manifest and set fields within it
        const expoGoConfig = this.getExpoGoConfig({
            mainModuleName,
            hostname,
            username: username !== 'anonymous' ? username : undefined
        });
        const hostUri = this.options.constructUrl({
            scheme: '',
            hostname
        });
        const bundleUrl = this._getBundleUrl({
            platform,
            mainModuleName,
            hostname,
            engine: isHermesEnabled ? 'hermes' : undefined,
            baseUrl: (0, _metroOptions.getBaseUrlFromExpoConfig)(projectConfig.exp),
            asyncRoutes: (0, _metroOptions.getAsyncRoutesFromExpoConfig)(projectConfig.exp, this.options.mode ?? 'development', platform),
            routerRoot: (0, _router.getRouterDirectoryModuleIdWithManifest)(this.projectRoot, projectConfig.exp),
            protocol,
            reactCompiler: !!((_projectConfig_exp_experiments = projectConfig.exp.experiments) == null ? void 0 : _projectConfig_exp_experiments.reactCompiler)
        });
        // Resolve all assets and set them on the manifest as URLs
        await this.mutateManifestWithAssetsAsync(projectConfig.exp, bundleUrl);
        return {
            expoGoConfig,
            hostUri,
            bundleUrl,
            exp: projectConfig.exp
        };
    }
    /** Get the main entry module ID (file) relative to the project root. */ resolveMainModuleName(props) {
        // NOTE(Bacon): Webpack is currently hardcoded to index.bundle on native
        // in the future (TODO) we should move this logic into a Webpack plugin and use
        // a generated file name like we do on web.
        // const server = getDefaultDevServer();
        // // TODO: Move this into BundlerDevServer and read this info from self.
        // const isNativeWebpack = server instanceof WebpackBundlerDevServer && server.isTargetingNative();
        if (this.options.isNativeWebpack) {
            return 'index';
        }
        const entry = (0, _paths().resolveRelativeEntryPoint)(this.projectRoot, props);
        debug(`Resolved entry point: ${entry} (project root: ${this.projectRoot})`);
        return entry;
    }
    /** Store device IDs that were sent in the request headers. */ async saveDevicesAsync(req) {
        var _req_headers;
        const deviceIds = (_req_headers = req.headers) == null ? void 0 : _req_headers['expo-dev-client-id'];
        if (deviceIds) {
            await _devices.saveDevicesAsync(this.projectRoot, deviceIds).catch((e)=>_log.exception(e));
        }
    }
    /** Create the bundle URL (points to the single JS entry file). Exposed for testing. */ _getBundleUrl({ platform, mainModuleName, hostname, engine, baseUrl, isExporting, asyncRoutes, routerRoot, protocol, reactCompiler }) {
        const path = (0, _metroOptions.createBundleUrlPath)({
            mode: this.options.mode ?? 'development',
            minify: this.options.minify,
            platform,
            mainModuleName,
            lazy: !_env.env.EXPO_NO_METRO_LAZY,
            engine,
            bytecode: engine === 'hermes',
            baseUrl,
            isExporting: !!isExporting,
            asyncRoutes,
            routerRoot,
            reactCompiler
        });
        return this.options.constructUrl({
            scheme: protocol ?? 'http',
            // hostType: this.options.location.hostType,
            hostname
        }) + path;
    }
    getExpoGoConfig({ mainModuleName, hostname, username }) {
        return {
            // localhost:8081
            debuggerHost: this.options.constructUrl({
                scheme: '',
                hostname
            }),
            // Required for Expo Go to function.
            developer: {
                tool: DEVELOPER_TOOL,
                projectRoot: this.projectRoot
            },
            packagerOpts: {
                // Required for dev client.
                dev: this.options.mode !== 'production'
            },
            // Indicates the name of the main bundle.
            mainModuleName,
            // The signed-in CLI username, used by Expo Go to verify account match.
            ...username ? {
                username
            } : undefined
        };
    }
    /** Resolve all assets and set them on the manifest as URLs */ async mutateManifestWithAssetsAsync(manifest, bundleUrl) {
        await (0, _resolveAssets.resolveManifestAssets)(this.projectRoot, {
            manifest,
            resolver: async (path)=>{
                if (this.options.isNativeWebpack) {
                    // When using our custom dev server, just do assets normally
                    // without the `assets/` subpath redirect.
                    return (0, _url().resolve)(bundleUrl.match(/^https?:\/\/.*?\//)[0], path);
                }
                return bundleUrl.match(/^https?:\/\/.*?\//)[0] + 'assets/' + path;
            }
        });
        // The server normally inserts this but if we're offline we'll do it here
        await (0, _resolveAssets.resolveGoogleServicesFile)(this.projectRoot, manifest);
    }
    getWebBundleUrl() {
        const platform = 'web';
        // Read from headers
        const mainModuleName = this.resolveMainModuleName({
            pkg: this.initialProjectConfig.pkg,
            platform
        });
        return (0, _metroOptions.createBundleUrlPathFromExpoConfig)(this.projectRoot, this.initialProjectConfig.exp, {
            platform,
            mainModuleName,
            minify: this.options.minify,
            lazy: !_env.env.EXPO_NO_METRO_LAZY,
            mode: this.options.mode ?? 'development',
            // Hermes doesn't support more modern JS features than most, if not all, modern browser.
            engine: 'hermes',
            isExporting: false,
            bytecode: false
        });
    }
    /**
   * Web platforms should create an index.html response using the same script resolution as native.
   *
   * Instead of adding a `bundleUrl` to a `manifest.json` (native) we'll add a `<script src="">`
   * to an `index.html`, this enables the web platform to load JavaScript from the server.
   */ async handleWebRequestAsync(req, res) {
        res.setHeader('Content-Type', 'text/html');
        res.end(await this.getSingleHtmlTemplateAsync());
    }
    getSingleHtmlTemplateAsync() {
        // Read from headers
        const bundleUrl = this.getWebBundleUrl();
        return (0, _webTemplate.createTemplateHtmlFromExpoConfigAsync)(this.projectRoot, {
            exp: this.initialProjectConfig.exp,
            scripts: [
                bundleUrl
            ]
        });
    }
    /** Exposed for testing. */ async checkBrowserRequestAsync(req, res, next) {
        var _this_initialProjectConfig_exp_platforms;
        if (this.platformBundlers.web === 'metro' && ((_this_initialProjectConfig_exp_platforms = this.initialProjectConfig.exp.platforms) == null ? void 0 : _this_initialProjectConfig_exp_platforms.includes('web'))) {
            // NOTE(EvanBacon): This effectively disables the safety check we do on custom runtimes to ensure
            // the `expo-platform` header is included. When `web.bundler=web`, if the user has non-standard Expo
            // code loading then they'll get a web bundle without a clear assertion of platform support.
            const platform = (0, _resolvePlatform.parsePlatformHeader)(req);
            // On web, serve the public folder
            if (!platform || platform === 'web') {
                var _this_initialProjectConfig_exp_web;
                if ([
                    'static',
                    'server'
                ].includes(((_this_initialProjectConfig_exp_web = this.initialProjectConfig.exp.web) == null ? void 0 : _this_initialProjectConfig_exp_web.output) ?? '')) {
                    // Skip the spa-styled index.html when static generation is enabled.
                    next();
                    return true;
                } else {
                    await this.handleWebRequestAsync(req, res);
                    return true;
                }
            }
        }
        return false;
    }
    async handleRequestAsync(req, res, next) {
        // First check for standard JavaScript runtimes (aka legacy browsers like Chrome).
        if (await this.checkBrowserRequestAsync(req, res, next)) {
            return;
        }
        // Save device IDs for dev client.
        await this.saveDevicesAsync(req);
        // Read from headers
        const options = this.getParsedHeaders(req);
        const response = await this._getManifestResponseAsync(options);
        // Convert `Response` to node:http response
        if (typeof res.setHeaders === 'function') {
            res.setHeaders(response.headers);
        } else {
            for (const [key, value] of response.headers.entries()){
                res.appendHeader(key, value);
            }
        }
        if (response.body) {
            await (0, _promises().pipeline)(_nodestream().Readable.fromWeb(response.body), res);
        } else {
            res.end();
        }
    }
}

//# sourceMappingURL=ManifestMiddleware.js.map