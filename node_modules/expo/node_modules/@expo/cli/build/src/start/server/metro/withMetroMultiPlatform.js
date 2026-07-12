/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
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
    get getNodejsExtensions () {
        return getNodejsExtensions;
    },
    get shouldAliasModule () {
        return shouldAliasModule;
    },
    get withExtendedResolver () {
        return withExtendedResolver;
    },
    get withMetroMultiPlatformAsync () {
        return withMetroMultiPlatformAsync;
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
function _metroresolver() {
    const data = require("@expo/metro/metro-resolver");
    _metroresolver = function() {
        return data;
    };
    return data;
}
function _requireutils() {
    const data = require("@expo/require-utils");
    _requireutils = function() {
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
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
const _createExpoAutolinkingResolver = require("./createExpoAutolinkingResolver");
const _createExpoFallbackResolver = require("./createExpoFallbackResolver");
const _FailedToResolveNativeOnlyModuleError = require("./errors/FailedToResolveNativeOnlyModuleError");
const _externals = require("./externals");
const _metroErrors = require("./metroErrors");
const _metroVirtualModules = require("./metroVirtualModules");
const _withMetroErrorReportingResolver = require("./withMetroErrorReportingResolver");
const _withMetroResolvers = require("./withMetroResolvers");
const _withMetroSupervisingTransformWorker = require("./withMetroSupervisingTransformWorker");
const _log = require("../../../log");
const _env = require("../../../utils/env");
const _metroOptions = require("../middleware/metroOptions");
const _createTypescriptResolver = require("./createTypescriptResolver");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ASSET_REGISTRY_SRC = `const assets=[];module.exports={registerAsset:s=>assets.push(s),getAssetByID:s=>assets[s-1]};`;
function constructPlatformExtensions(config) {
    var _config_resolver;
    const platformExtensions = Object.create(null);
    // TODO(@kitten): Temporary internal override config for per-platform extensions
    let unstable_platformExtensions;
    if (config.resolver && 'unstable_platformExtensions' in config.resolver && config.resolver.unstable_platformExtensions && typeof config.resolver.unstable_platformExtensions === 'object') {
        unstable_platformExtensions = config.resolver.unstable_platformExtensions;
    }
    for (const platform of ((_config_resolver = config.resolver) == null ? void 0 : _config_resolver.platforms) ?? []){
        const customPlatformExtensions = unstable_platformExtensions == null ? void 0 : unstable_platformExtensions[platform];
        const sourceExts = (0, _paths().getPlatformExtensions)(platform, config.resolver.sourceExts, customPlatformExtensions);
        // Platform-less resolution drops the platform's package-exports conditions, so fold them in.
        const unstable_conditionNames = [
            ...config.resolver.unstable_conditionNames,
            ...config.resolver.unstable_conditionsByPlatform[platform] ?? []
        ];
        if (sourceExts) {
            platformExtensions[platform] = {
                sourceExts,
                unstable_conditionNames
            };
        }
    }
    return platformExtensions;
}
function resolveWithPlatformExtensions(platformExtensions, context, moduleName) {
    const platformContext = asWritable(context);
    platformContext.preferNativePlatform = false;
    platformContext.sourceExts = platformExtensions.sourceExts;
    platformContext.unstable_conditionNames = platformExtensions.unstable_conditionNames;
    return (0, _metroresolver().resolve)(platformContext, moduleName, null);
}
const debug = require('debug')('expo:start:server:metro:multi-platform');
function asWritable(input) {
    return input;
}
const _reactNativeHostPackages = new Map();
const _reactNativeHostPathPatterns = new Map();
function getReactNativeHostPackage(platform) {
    if (!platform) {
        return null;
    }
    let supportPackage = _reactNativeHostPackages.get(platform);
    if (supportPackage === undefined) {
        const { getSupportPackageForPlatform } = require('expo/internal/unstable-autolinking-exports');
        supportPackage = getSupportPackageForPlatform(platform);
        _reactNativeHostPackages.set(platform, supportPackage);
    }
    return supportPackage;
}
function getReactNativeHostPathPattern(platform) {
    if (!platform) {
        return null;
    }
    let pattern = _reactNativeHostPathPatterns.get(platform);
    if (pattern === undefined) {
        const supportPackage = getReactNativeHostPackage(platform);
        pattern = supportPackage ? new RegExp(`[\\\\/]node_modules[\\\\/]${supportPackage}[\\\\/]`) : null;
        _reactNativeHostPathPatterns.set(platform, pattern);
    }
    return pattern;
}
function withWebPolyfills(config, { getMetroBundler }) {
    const originalGetPolyfills = config.serializer.getPolyfills ? config.serializer.getPolyfills.bind(config.serializer) : ()=>[];
    const getPolyfills = (ctx)=>{
        const virtualEnvVarId = `\0polyfill:environment-variables`;
        (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler()).setVirtualModule(virtualEnvVarId, (()=>{
            return `//`;
        })());
        const virtualModuleId = `\0polyfill:external-require`;
        (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler()).setVirtualModule(virtualModuleId, (()=>{
            if (ctx.platform === 'web') {
                // NOTE(@hassankhan): We need to wrap require in an arrow function rather than assigning
                // it directly because `workerd` loses its `this` context when `require` is dereferenced
                // and called later.
                return `global.$$require_external = typeof require !== "undefined" ? (m) => require(m) : () => null;`;
            } else {
                // Wrap in try/catch to support Android.
                return 'try { global.$$require_external = typeof expo === "undefined" ? require : (moduleId) => { throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);} } catch { global.$$require_external = (moduleId) => { throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);} }';
            }
        })());
        const virtualModulesPolyfills = [
            virtualModuleId,
            virtualEnvVarId
        ];
        if (ctx.platform === 'web') {
            try {
                const rnGetPolyfills = require('react-native/rn-get-polyfills');
                return [
                    ...virtualModulesPolyfills,
                    // Ensure that the error-guard polyfill is included in the web polyfills to
                    // make metro-runtime work correctly.
                    // TODO: This module is pretty big for a function that simply re-throws an error that doesn't need to be caught.
                    // NOTE(@kitten): This is technically the public API to get polyfills rather than resolving directly into
                    // `@react-native/js-polyfills`. We should really just start vendoring these, but for now, this exclusion works
                    ...rnGetPolyfills().filter((x)=>!x.includes('/console'))
                ];
            } catch (error) {
                if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
                    // If react-native is not installed, because we're targeting web, we still continue
                    // This should be rare, but we add it so we don't unnecessarily have a fixed peer dependency on react-native
                    debug('Skipping react-native/rn-get-polyfills from getPolyfills. react-native is not installed.');
                    return virtualModulesPolyfills;
                } else {
                    throw error;
                }
            }
        }
        // Generally uses `@expo/metro-config`'s `getPolyfills` function, unless overridden
        const polyfills = originalGetPolyfills(ctx);
        return [
            ...polyfills,
            ...virtualModulesPolyfills,
            // Removed on server platforms during the transform.
            require.resolve('expo/virtual/streams.js')
        ];
    };
    return {
        ...config,
        serializer: {
            ...config.serializer,
            getPolyfills
        }
    };
}
function normalizeSlashes(p) {
    return p.replace(/\\/g, '/');
}
function getNodejsExtensions(srcExts) {
    const mjsExts = srcExts.filter((ext)=>/mjs$/.test(ext));
    const nodejsSourceExtensions = srcExts.filter((ext)=>!/mjs$/.test(ext));
    // find index of last `*.js` extension
    const jsIndex = nodejsSourceExtensions.reduce((index, ext, i)=>{
        return /jsx?$/.test(ext) ? i : index;
    }, -1);
    // insert `*.mjs` extensions after `*.js` extensions
    nodejsSourceExtensions.splice(jsIndex + 1, 0, ...mjsExts);
    return nodejsSourceExtensions;
}
function withExtendedResolver(config, { autolinkingModuleResolverInput, isTsconfigPathsEnabled, isExporting, isReactServerComponentsEnabled, getMetroBundler }) {
    var _config_serializer_createModuleIdFactory, _config_serializer;
    if (isReactServerComponentsEnabled) {
        _log.Log.warn(`React Server Components (beta) is enabled.`);
    }
    const aliases = {
        web: {
            'react-native': 'react-native-web',
            'react-native/index': 'react-native-web',
            'react-native/Libraries/Image/resolveAssetSource': 'expo-asset/build/resolveAssetSource'
        }
    };
    const isExpoRouterInstalled = hasExpoRouterModule(config.projectRoot, autolinkingModuleResolverInput);
    let _universalAliases;
    function getUniversalAliases() {
        if (_universalAliases) {
            return _universalAliases;
        }
        _universalAliases = [];
        // This package is currently always installed as it is included in the `expo` package.
        if ((0, _requireutils().resolveFrom)(config.projectRoot, '@expo/vector-icons/package.json')) {
            debug('Enabling alias: react-native-vector-icons -> @expo/vector-icons');
            _universalAliases.push([
                /^react-native-vector-icons(\/.*)?/,
                '@expo/vector-icons$1'
            ]);
        }
        if (isReactServerComponentsEnabled) {
            if ((0, _requireutils().resolveFrom)(config.projectRoot, 'expo-router/rsc')) {
                debug('Enabling bridge alias: expo-router -> expo-router/rsc');
                _universalAliases.push([
                    /^expo-router$/,
                    'expo-router/rsc'
                ]);
                // Bridge the internal entry point which is a standalone import to ensure package.json resolution works as expected.
                _universalAliases.push([
                    /^expo-router\/entry-classic$/,
                    'expo-router/rsc/entry'
                ]);
            }
        }
        return _universalAliases;
    }
    // used to resolve externals in `requestCustomExternals` from the project root
    const projectRootOriginPath = _path().default.join(config.projectRoot, 'package.json');
    const preferredMainFields = {
        // Defaults from Expo Webpack. Most packages using `react-native` don't support web
        // in the `react-native` field, so we should prefer the `browser` field.
        // https://github.com/expo/router/issues/37
        web: [
            'browser',
            'module',
            'main'
        ]
    };
    let nodejsSourceExtensions = null;
    const platformExtensions = constructPlatformExtensions(config);
    const getStrictResolver = ({ resolveRequest, ...context }, platform)=>{
        return function doResolve(moduleName) {
            if (platform != null && platformExtensions[platform]) {
                return resolveWithPlatformExtensions(platformExtensions[platform], context, moduleName);
            } else {
                return (0, _metroresolver().resolve)(context, moduleName, platform);
            }
        };
    };
    function getOptionalResolver(context, platform) {
        const doResolve = getStrictResolver(context, platform);
        return function optionalResolve(moduleName) {
            try {
                return doResolve(moduleName);
            } catch (error) {
                // If the error is directly related to a resolver not being able to resolve a module, then
                // we can ignore the error and try the next resolver. Otherwise, we should throw the error.
                const isResolutionError = (0, _metroErrors.isFailedToResolveNameError)(error) || (0, _metroErrors.isFailedToResolvePathError)(error);
                if (!isResolutionError) {
                    throw error;
                }
            }
            return null;
        };
    }
    // TODO: This is a hack to get resolveWeak working.
    const idFactory = ((_config_serializer = config.serializer) == null ? void 0 : (_config_serializer_createModuleIdFactory = _config_serializer.createModuleIdFactory) == null ? void 0 : _config_serializer_createModuleIdFactory.call(_config_serializer)) ?? ((id, context)=>id);
    // We're manually resolving the `asyncRequireModulePath` since it's a module request
    // However, in isolated installations it might not resolve from all paths, so we're resolving
    // it from the project root manually
    let _asyncRequireModuleResolvedPath;
    const getAsyncRequireModule = ()=>{
        if (_asyncRequireModuleResolvedPath === undefined) {
            _asyncRequireModuleResolvedPath = (0, _requireutils().resolveFrom)(config.projectRoot, config.transformer.asyncRequireModulePath) ?? null;
        }
        return _asyncRequireModuleResolvedPath ? {
            type: 'sourceFile',
            filePath: _asyncRequireModuleResolvedPath
        } : null;
    };
    const getAssetRegistryModule = ()=>{
        const virtualModuleId = `\0polyfill:assets-registry`;
        (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler()).setVirtualModule(virtualModuleId, ASSET_REGISTRY_SRC);
        return {
            type: 'sourceFile',
            filePath: virtualModuleId
        };
    };
    // If Node.js pass-through, then remap to a module like `module.exports = $$require_external(<module>)`.
    // If module should be shimmed, remap to an empty module.
    const externals = [
        {
            match: (context, moduleName)=>{
                var _context_customResolverOptions, _context_customResolverOptions1;
                if (// Disable internal externals when exporting for production.
                context.customResolverOptions.exporting || // These externals are only for Node.js environments.
                !(0, _metroOptions.isServerEnvironment)((_context_customResolverOptions = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions.environment)) {
                    return false;
                }
                if (((_context_customResolverOptions1 = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions1.environment) === 'react-server') {
                    // Ensure these non-react-server modules are excluded when bundling for React Server Components in development.
                    return /^(@babel\/runtime\/.+|debug|metro-runtime\/src\/modules\/HMRClient|metro|acorn-loose|acorn|chalk|ws|ansi-styles|supports-color|color-convert|has-flag|utf-8-validate|color-name|react-refresh\/runtime|@remix-run\/node\/.+)$/.test(moduleName);
                }
                // TODO: Windows doesn't support externals somehow.
                if (process.platform === 'win32') {
                    return false;
                }
                // Extern these modules in standard Node.js environments in development to prevent API routes side-effects
                // from leaking into the dev server process.
                return /^(react|@radix-ui\/.+|@babel\/runtime\/.+|react-dom(\/.+)?|debug|acorn-loose|acorn|css-in-js-utils\/lib\/.+|hyphenate-style-name|color|color-string|color-convert|color-name|fontfaceobserver|fast-deep-equal|query-string|escape-string-regexp|invariant|postcss-value-parser|memoize-one|nullthrows|strict-uri-encode|decode-uri-component|split-on-first|filter-obj|warn-once|simple-swizzle|is-arrayish|inline-style-prefixer\/.+)$/.test(moduleName);
            },
            replace: 'node'
        },
        // Externals to speed up async split chunks by extern-ing common packages that appear in the root client chunk.
        {
            match: (context, moduleName, platform)=>{
                var _context_customResolverOptions;
                if (// Disable internal externals when exporting for production.
                context.customResolverOptions.exporting || // These externals are only for client environments.
                (0, _metroOptions.isServerEnvironment)((_context_customResolverOptions = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions.environment) || // Only enable for client boundaries
                !context.customResolverOptions.clientboundary) {
                    return false;
                }
                // We don't support this in the resolver at the moment.
                if (moduleName.endsWith('/package.json')) {
                    return false;
                }
                const isExternal = /^(deprecated-react-native-prop-types|react|react\/jsx-dev-runtime|scheduler|react-native|react-dom(\/.+)?|metro-runtime(\/.+)?)$/.test(moduleName) || // TODO: Add more
                /^@babel\/runtime\/helpers\/(wrapNativeSuper)$/.test(moduleName);
                return isExternal;
            },
            replace: 'weak'
        }
    ];
    const skipMetroMainFieldOverride = _env.env.EXPO_METRO_NO_MAIN_FIELD_OVERRIDE;
    const useExpoUnstableWebModule = _env.env.EXPO_UNSTABLE_WEB_MODAL;
    const useExpoUnstableLogBox = _env.env.EXPO_UNSTABLE_LOG_BOX;
    const disableReactNavigationCheck = _env.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK;
    const disableNativeTabsMaterialSymbols = _env.env.EXPO_ROUTER_DISABLE_NATIVE_TABS_MD;
    const metroConfigWithCustomResolver = (0, _withMetroResolvers.withMetroResolvers)(config, [
        // Mock out production react imports in development.
        function requestDevMockProdReact(context, moduleName, platform) {
            var _getReactNativeHostPathPattern;
            // This resolution is dev-only to prevent bundling the production React packages in development.
            if (!context.dev) return null;
            if (// Match react-native renderers (in the platform's react-native host package).
            platform !== 'web' && ((_getReactNativeHostPathPattern = getReactNativeHostPathPattern(platform)) == null ? void 0 : _getReactNativeHostPathPattern.test(context.originModulePath)) && moduleName.match(/([\\/]ReactFabric|ReactNativeRenderer)-prod/) || // Match react production imports.
            moduleName.match(/\.production(\.min)?\.js$/) && // Match if the import originated from a react package.
            context.originModulePath.match(/[\\/]node_modules[\\/](react[-\\/]|scheduler[\\/])/)) {
                debug(`Skipping production module: ${moduleName}`);
                // /Users/path/to/expo/node_modules/react/index.js ./cjs/react.production.min.js
                // /Users/path/to/expo/node_modules/react/jsx-dev-runtime.js ./cjs/react-jsx-dev-runtime.production.min.js
                // /Users/path/to/expo/node_modules/react-is/index.js ./cjs/react-is.production.min.js
                // /Users/path/to/expo/node_modules/react-refresh/runtime.js ./cjs/react-refresh-runtime.production.min.js
                // /Users/path/to/expo/node_modules/react-native/node_modules/scheduler/index.native.js ./cjs/scheduler.native.production.min.js
                // /Users/path/to/expo/node_modules/react-native/node_modules/react-is/index.js ./cjs/react-is.production.min.js
                return {
                    type: 'empty'
                };
            }
            return null;
        },
        isTsconfigPathsEnabled ? (0, _createTypescriptResolver.createTypescriptResolver)({
            getStrictResolver,
            projectRoot: config.projectRoot,
            getMetroBundler,
            watch: !isExporting && !_env.env.CI
        }) : undefined,
        // Node.js externals support
        function requestNodeExternals(context, moduleName, platform) {
            var _context_customResolverOptions, _context_customResolverOptions1;
            const isServer = ((_context_customResolverOptions = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions.environment) === 'node' || ((_context_customResolverOptions1 = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions1.environment) === 'react-server';
            const moduleId = (0, _externals.isNodeExternal)(moduleName);
            if (!moduleId) {
                return null;
            }
            if (// In browser runtimes, we want to either resolve a local node module by the same name, or shim the module to
            // prevent crashing when Node.js built-ins are imported.
            !isServer) {
                // Perform optional resolve first. If the module doesn't exist (no module in the node_modules)
                // then we can mock the file to use an empty module.
                const result = getOptionalResolver(context, platform)(moduleName);
                if (!result && platform !== 'web') {
                    // Preserve previous behavior where native throws an error on node.js internals.
                    return null;
                }
                return result ?? {
                    // In this case, mock the file to use an empty module.
                    type: 'empty'
                };
            }
            const contents = `module.exports=$$require_external('node:${moduleId}');`;
            debug(`Virtualizing Node.js "${moduleId}"`);
            const virtualModuleId = `\0node:${moduleId}`;
            (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler()).setVirtualModule(virtualModuleId, contents);
            return {
                type: 'sourceFile',
                filePath: virtualModuleId
            };
        },
        // Custom externals support
        function requestCustomExternals(context, moduleName, platform) {
            // We don't support this in the resolver at the moment.
            if (moduleName.endsWith('/package.json')) {
                return null;
            }
            // Skip applying JS externals for CSS files.
            if (/\.(s?css|sass)$/.test(context.originModulePath)) {
                return null;
            }
            for (const external of externals){
                if (external.match(context, moduleName, platform)) {
                    if (external.replace === 'empty') {
                        debug(`Redirecting external "${moduleName}" to "${external.replace}"`);
                        return {
                            type: external.replace
                        };
                    } else if (external.replace === 'weak') {
                        var _context_customResolverOptions;
                        // TODO: Make this use require.resolveWeak again. Previously this was just resolving to the same path.
                        const realModule = getStrictResolver(context, platform)(moduleName);
                        const realPath = realModule.type === 'sourceFile' ? realModule.filePath : moduleName;
                        const opaqueId = idFactory(realPath, {
                            platform: platform,
                            environment: (_context_customResolverOptions = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions.environment
                        });
                        const contents = typeof opaqueId === 'number' ? `module.exports=/*${moduleName}*/__r(${opaqueId})` : `module.exports=/*${moduleName}*/__r(${JSON.stringify(opaqueId)})`;
                        // const contents = `module.exports=/*${moduleName}*/__r(require.resolveWeak('${moduleName}'))`;
                        // const generatedModuleId = fastHashMemoized(contents);
                        const virtualModuleId = `\0weak:${opaqueId}`;
                        debug('Virtualizing module:', moduleName, '->', virtualModuleId);
                        (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler()).setVirtualModule(virtualModuleId, contents);
                        return {
                            type: 'sourceFile',
                            filePath: virtualModuleId
                        };
                    } else if (external.replace === 'node') {
                        // TODO(@kitten): Temporary workaround. Our externals logic here isn't generic and only works
                        // for development and not exports. We never intend to use it in exported production bundles,
                        // however, this is still a dangerous implementation. To protect us from externalizing modules
                        // that aren't available to the app, we force any resolution to happen via the project root
                        const projectRootContext = {
                            ...context,
                            nodeModulesPaths: [],
                            originModulePath: projectRootOriginPath,
                            disableHierarchicalLookup: false
                        };
                        const externModule = getStrictResolver(projectRootContext, platform)(moduleName);
                        if (externModule.type !== 'sourceFile') {
                            return null;
                        }
                        const contents = `module.exports=$$require_external('${moduleName}')`;
                        const virtualModuleId = `\0node:${moduleName}`;
                        debug('Virtualizing Node.js (custom):', moduleName, '->', virtualModuleId);
                        (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler()).setVirtualModule(virtualModuleId, contents);
                        return {
                            type: 'sourceFile',
                            filePath: virtualModuleId
                        };
                    } else {
                        external.replace;
                    }
                }
            }
            return null;
        },
        // Basic moduleId aliases
        function requestAlias(context, moduleName, platform) {
            // Conditionally remap `react-native` to `react-native-web` on web in
            // a way that doesn't require Babel to resolve the alias.
            if (platform && platform in aliases && aliases[platform][moduleName]) {
                const redirectedModuleName = aliases[platform][moduleName];
                return getStrictResolver(context, platform)(redirectedModuleName);
            }
            for (const [matcher, alias] of getUniversalAliases()){
                const match = moduleName.match(matcher);
                if (match) {
                    const aliasedModule = alias.replace(/\$(\d+)/g, (_, index)=>match[parseInt(index, 10)] ?? '');
                    const doResolve = getStrictResolver(context, platform);
                    debug(`Alias "${moduleName}" to "${aliasedModule}"`);
                    return doResolve(aliasedModule);
                }
            }
            return null;
        },
        // Polyfill for asset registry (assetRegistryPath) and async require module (asyncRequireModulePath)
        function requestStableConfigModules(context, moduleName, platform) {
            if (moduleName === config.transformer.asyncRequireModulePath) {
                return getAsyncRequireModule();
            }
            // TODO(@kitten): Compare against `config.transformer.assetRegistryPath`
            if (/^@react-native\/assets-registry\/registry(\.js)?$/.test(moduleName)) {
                return getAssetRegistryModule();
            }
            if (platform === 'web' && context.originModulePath.match(/node_modules[\\/]react-native-web[\\/]/) && moduleName.includes('/modules/AssetRegistry')) {
                return getAssetRegistryModule();
            }
            return null;
        },
        (0, _createExpoAutolinkingResolver.createAutolinkingModuleResolver)(autolinkingModuleResolverInput, {
            getStrictResolver
        }),
        // TODO: Reduce these as much as possible in the future.
        // Complex post-resolution rewrites.
        function requestPostRewrites(context, moduleName, platform) {
            // TODO(@kitten): replace and abstract doResolve logic, since it's unsafe and inefficient
            function doResolve(moduleName) {
                const projectRootContext = {
                    ...context,
                    nodeModulesPaths: [],
                    originModulePath: projectRootOriginPath,
                    disableHierarchicalLookup: false
                };
                return getStrictResolver(projectRootContext, platform)(moduleName);
            }
            const result = getStrictResolver(context, platform)(moduleName);
            if (result.type !== 'sourceFile') {
                return result;
            }
            const normalizedPath = normalizeSlashes(result.filePath);
            const doReplace = (from, to, options)=>doReplaceHelper(from, to, {
                    normalizedPath,
                    doResolve,
                    ...options
                });
            const doReplaceStrict = (from, to)=>doReplace(from, to, {
                    throws: true
                });
            if (useExpoUnstableWebModule) {
                const webModalModule = doReplace('expo-router/build/layouts/_web-modal.js', 'expo-router/build/layouts/ExperimentalModalStack.js');
                if (webModalModule) {
                    debug('Using `_unstable-web-modal` implementation.');
                    return webModalModule;
                }
            }
            if (disableNativeTabsMaterialSymbols && platform === 'android') {
                const materialIconConverterModule = doReplace('expo-router/build/native-tabs/utils/materialIconConverter.android.js', 'expo-router/build/native-tabs/utils/materialIconConverter-not-implemented.js');
                if (materialIconConverterModule) {
                    debug('Disabling md support in NativeTabs to tree-shake `expo-symbols` from the Android bundle.');
                    return materialIconConverterModule;
                }
            }
            if (!disableReactNavigationCheck) {
                // TODO(@ubax): Remove this rewrite once we published migration guide for library authors
                if (isExpoRouterInstalled && moduleName.startsWith('@react-navigation/')) {
                    const filePath = context.originModulePath;
                    if (!filePath.includes('node_modules')) {
                        if (moduleName === '@react-navigation/native-stack' || moduleName === '@react-navigation/drawer') {
                            throw new Error([
                                'As of SDK 56, expo-router is no longer compatible with react-navigation.',
                                '',
                                `Instead of ${moduleName}, use Stack or Drawer from expo-router instead:`,
                                '',
                                "  import { Stack } from 'expo-router';",
                                "  import { Drawer } from 'expo-router/drawer';",
                                '',
                                'For more information, see https://docs.expo.dev/router/migrate/sdk-55-to-56/.',
                                'You can disable this check by setting the environment variable EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1.'
                            ].join('\n'));
                        }
                        throw new Error('As of SDK 56, expo-router is no longer compatible with react-navigation. For more information, see https://docs.expo.dev/router/migrate/sdk-55-to-56/. You can disable this check by setting the environment variable EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1.');
                    }
                    if (moduleName === '@react-navigation/core') {
                        // We already checked if expo-router resolves
                        return doResolve('expo-router/react-navigation');
                    }
                }
            }
            if (platform === 'web') {
                if (result.filePath.includes('node_modules')) {
                    // Disallow importing confusing native modules on web
                    if ([
                        'react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore',
                        'react-native/Libraries/Utilities/codegenNativeCommands',
                        'react-native/Libraries/Utilities/codegenNativeComponent'
                    ].some((matcher)=>// Support absolute and modules with .js extensions.
                        moduleName.includes(matcher))) {
                        throw new _FailedToResolveNativeOnlyModuleError.FailedToResolveNativeOnlyModuleError(moduleName, _path().default.relative(config.projectRoot, context.originModulePath));
                    }
                    // Replace with static shims
                    // Drop everything up until the `node_modules` folder.
                    const normalName = normalizedPath.replace(/.*node_modules\//, '');
                    const shimFile = (0, _externals.shouldCreateVirtualShim)(normalName);
                    if (shimFile) {
                        const virtualId = `\0shim:${normalName}`;
                        const bundler = (0, _metroVirtualModules.getMetroBundlerWithVirtualModules)(getMetroBundler());
                        if (!bundler.hasVirtualModule(virtualId)) {
                            bundler.setVirtualModule(virtualId, _fs().default.readFileSync(shimFile, 'utf8'));
                        }
                        debug(`Redirecting module "${result.filePath}" to shim`);
                        return {
                            ...result,
                            filePath: virtualId
                        };
                    }
                }
            } else {
                var _context_customResolverOptions, _context_customResolverOptions1;
                const isServer = ((_context_customResolverOptions = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions.environment) === 'node' || ((_context_customResolverOptions1 = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions1.environment) === 'react-server';
                const hostPackage = getReactNativeHostPackage(platform) ?? 'react-native';
                // Shim out React Native native runtime globals in server mode for native.
                if (isServer) {
                    const emptyModule = doReplace(`${hostPackage}/Libraries/Core/InitializeCore.js`, undefined);
                    if (emptyModule) {
                        debug('Shimming out InitializeCore for React Native in native SSR bundle');
                        return emptyModule;
                    }
                }
                const hmrModule = doReplaceStrict(`${hostPackage}/Libraries/Utilities/HMRClient.js`, 'expo/src/async-require/hmr.ts');
                if (hmrModule) return hmrModule;
                if (useExpoUnstableLogBox) {
                    // TODO(@kitten): This can never resolve with isolated dependencies
                    const logBoxModule = doReplace(`${hostPackage}/Libraries/LogBox/LogBoxInspectorContainer.js`, '@expo/log-box/swap-rn-logbox.js');
                    if (logBoxModule) return logBoxModule;
                    const logBoxParserModule = doReplace(`${hostPackage}/Libraries/LogBox/Data/parseLogBoxLog.js`, '@expo/log-box/swap-rn-logbox-parser.js');
                    if (logBoxParserModule) return logBoxParserModule;
                }
            }
            return result;
        },
        // If at this point, we haven't resolved a module yet, if it's a module specifier for a known dependency
        // of either `expo` or `expo-router`, attempt to resolve it from these origin modules instead
        (0, _createExpoFallbackResolver.createFallbackModuleResolver)({
            projectRoot: config.projectRoot,
            originModuleNames: [
                'expo',
                'expo-router'
            ],
            getStrictResolver
        })
    ]);
    // Ensure we mutate the resolution context to include the custom resolver options for server and web.
    const metroConfigWithCustomContext = (0, _withMetroResolvers.withMetroMutatedResolverContext)(metroConfigWithCustomResolver, (immutableContext, moduleName, platform)=>{
        var _context_customResolverOptions;
        const context = asWritable({
            ...immutableContext,
            preferNativePlatform: platform !== 'web'
        });
        if ((0, _metroOptions.isServerEnvironment)((_context_customResolverOptions = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions.environment)) {
            var _context_customResolverOptions1, _context_customResolverOptions2;
            // Adjust nodejs source extensions to sort mjs after js, including platform variants.
            if (nodejsSourceExtensions === null) {
                nodejsSourceExtensions = getNodejsExtensions(context.sourceExts);
            }
            context.sourceExts = nodejsSourceExtensions;
            context.unstable_enablePackageExports = true;
            context.unstable_conditionsByPlatform = {};
            const isReactServerComponents = ((_context_customResolverOptions1 = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions1.environment) === 'react-server';
            if (isReactServerComponents) {
                // NOTE: Align the behavior across server and client. This is a breaking change so we'll just roll it out with React Server Components.
                // This ensures that react-server and client code both resolve `module` and `main` in the same order.
                if (platform === 'web') {
                    // Node.js runtimes should only be importing main at the moment.
                    // This is a temporary fix until we can support the package.json exports.
                    context.mainFields = [
                        'module',
                        'main'
                    ];
                } else {
                    // In Node.js + native, use the standard main fields.
                    context.mainFields = [
                        'react-native',
                        'module',
                        'main'
                    ];
                }
            } else {
                if (platform === 'web') {
                    // Node.js runtimes should only be importing main at the moment.
                    // This is a temporary fix until we can support the package.json exports.
                    context.mainFields = [
                        'main',
                        'module'
                    ];
                } else {
                    // In Node.js + native, use the standard main fields.
                    context.mainFields = [
                        'react-native',
                        'main',
                        'module'
                    ];
                }
            }
            // Enable react-server import conditions.
            if (((_context_customResolverOptions2 = context.customResolverOptions) == null ? void 0 : _context_customResolverOptions2.environment) === 'react-server') {
                context.unstable_conditionNames = [
                    'node',
                    'react-server',
                    'workerd'
                ];
            } else {
                context.unstable_conditionNames = [
                    'node'
                ];
            }
        } else {
            // Non-server changes
            if (!skipMetroMainFieldOverride && platform && platform in preferredMainFields) {
                context.mainFields = preferredMainFields[platform];
            }
        }
        return context;
    });
    return (0, _withMetroErrorReportingResolver.withMetroErrorReportingResolver)((0, _withMetroSupervisingTransformWorker.withMetroSupervisingTransformWorker)(metroConfigWithCustomContext));
}
function doReplaceHelper(from, to, { throws = false, normalizedPath, doResolve }) {
    if (!normalizedPath.endsWith(from)) {
        return undefined;
    }
    if (to === undefined) {
        return {
            type: 'empty'
        };
    }
    try {
        const hmrModule = doResolve(to);
        if (hmrModule.type === 'sourceFile') {
            debug(`Using \`${to}\` implementation.`);
            return hmrModule;
        }
    } catch (resolutionError) {
        if (throws) {
            throw new Error(`Failed to replace ${from} with ${to}. Resolution of ${to} failed.`, {
                cause: resolutionError
            });
        }
        debug(`Failed to resolve ${to} when swapping from ${from}: ${resolutionError}`);
    }
    return undefined;
}
function shouldAliasModule(input, alias) {
    var _input_result, _input_result1;
    return input.platform === alias.platform && ((_input_result = input.result) == null ? void 0 : _input_result.type) === 'sourceFile' && typeof ((_input_result1 = input.result) == null ? void 0 : _input_result1.filePath) === 'string' && normalizeSlashes(input.result.filePath).endsWith(alias.output);
}
async function withMetroMultiPlatformAsync(projectRoot, { config, exp, platformBundlers, isTsconfigPathsEnabled, isAutolinkingResolverEnabled, isExporting, isReactServerComponentsEnabled, getMetroBundler }) {
    const watchFolders = config.watchFolders || [];
    asWritable(config).watchFolders = watchFolders;
    // NOTE(@kitten): If the on-demand filesystem is enabled, we can aggressively cut down the `watchFolders`
    // to a minimum, since the files will be read lazily. This almost always speeds up exports
    if (isExporting && !!config.resolver.unstable_onDemandFilesystem) {
        watchFolders.length = 0;
        watchFolders.push(projectRoot);
    }
    // Change the default metro-runtime to a custom one that supports bundle splitting.
    // NOTE(@kitten): This is now always active and EXPO_USE_METRO_REQUIRE / isNamedRequiresEnabled is disregarded
    const metroDefaults = require('@expo/metro/metro-config/defaults/defaults');
    const metroRequirePolyfill = require.resolve('@expo/cli/build/metro-require/require');
    asWritable(metroDefaults).moduleSystem = metroRequirePolyfill;
    watchFolders.push(_path().default.dirname(metroRequirePolyfill));
    // Required for @expo/metro-runtime to format paths in the web LogBox.
    process.env.EXPO_PUBLIC_PROJECT_ROOT = process.env.EXPO_PUBLIC_PROJECT_ROOT ?? projectRoot;
    const configPlatforms = (0, _config().getPlatformsFromConfig)(projectRoot, exp);
    let expoConfigPlatforms = Object.entries(platformBundlers).filter(([platform, bundler])=>bundler === 'metro' && configPlatforms.includes(platform)).map(([platform])=>platform);
    if (Array.isArray(config.resolver.platforms)) {
        expoConfigPlatforms = [
            ...new Set(expoConfigPlatforms.concat(config.resolver.platforms))
        ];
    }
    asWritable(config.resolver).platforms = expoConfigPlatforms;
    config = withWebPolyfills(config, {
        getMetroBundler
    });
    let autolinkingModuleResolverInput;
    if (isAutolinkingResolverEnabled) {
        autolinkingModuleResolverInput = await (0, _createExpoAutolinkingResolver.createAutolinkingModuleResolverInput)({
            platforms: expoConfigPlatforms,
            projectRoot
        });
    }
    return withExtendedResolver(config, {
        autolinkingModuleResolverInput,
        isTsconfigPathsEnabled,
        isExporting,
        isReactServerComponentsEnabled,
        getMetroBundler
    });
}
function hasExpoRouterModule(projectRoot, autolinkingModuleResolverInput) {
    if (autolinkingModuleResolverInput) {
        var _autolinkingModuleResolverInput_platform;
        // If we have autolinking enabled, we can skip resolution
        const platform = Object.keys(autolinkingModuleResolverInput)[0];
        return !!((_autolinkingModuleResolverInput_platform = autolinkingModuleResolverInput[platform]) == null ? void 0 : _autolinkingModuleResolverInput_platform.resolvedModulePaths['expo-router']);
    } else {
        return !!(0, _requireutils().resolveFrom)(projectRoot, 'expo-router/package.json', {
            skipNodePath: true
        });
    }
}

//# sourceMappingURL=withMetroMultiPlatform.js.map