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
    get _dependenciesToRegex () {
        return _dependenciesToRegex;
    },
    get createAutolinkingModuleResolver () {
        return createAutolinkingModuleResolver;
    },
    get createAutolinkingModuleResolverInput () {
        return createAutolinkingModuleResolverInput;
    }
});
const debug = require('debug')('expo:start:server:metro:autolinking-resolver');
// This is a list of known modules we want to always include in sticky resolution
// Specifying these skips platform- and module-specific checks and always includes them in the output
const KNOWN_STICKY_DEPENDENCIES = [
    // NOTE: react and react-dom aren't native modules, but must also be deduplicated in bundles
    'react',
    'react-dom',
    // NOTE: react-native won't be in autolinking output, since it's special
    // We include it here manually, since we know it should be an unduplicated direct dependency
    'react-native',
    // NOTE: We may redirect dependencies from react-native to react-native-web. This fails if
    // a sub-dependency cannot access react-native-web, so we define it here
    'react-native-web',
    // Peer dependencies from expo
    'react-native-webview',
    '@expo/dom-webview',
    // Dependencies from expo
    'expo-asset',
    'expo-constants',
    'expo-file-system',
    'expo-font',
    'expo-keep-awake',
    'expo-modules-core',
    // Peer dependencies from expo-router
    'react-native-gesture-handler',
    'react-native-reanimated',
    // Has a context that needs to be deduplicated
    '@react-navigation/core',
    '@react-navigation/native'
];
const AUTOLINKING_PLATFORMS = [
    'android',
    'ios',
    'web',
    'tvos',
    'macos'
];
const escapeDependencyName = (dependency)=>dependency.replace(/[*.?()[\]]/g, (x)=>`\\${x}`);
const _dependenciesToRegex = (dependencies)=>new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);
const getAutolinkingExports = ()=>require('expo/internal/unstable-autolinking-exports');
const toPlatformModuleDescription = (dependencies, platform, supportPackage)=>{
    const resolvedModulePaths = {};
    const resolvedModuleNames = [];
    for(const dependencyName in dependencies){
        const dependency = dependencies[dependencyName];
        if (dependency) {
            resolvedModuleNames.push(dependency.name);
            resolvedModulePaths[dependency.name] = dependency.path;
        }
    }
    // Redirect `react-native` to the platform's support package
    const moduleNameRewrites = {};
    if (supportPackage && supportPackage !== 'react-native' && resolvedModulePaths[supportPackage]) {
        moduleNameRewrites['react-native'] = supportPackage;
    }
    debug(`Sticky resolution for ${platform} registered ${resolvedModuleNames.length} resolutions:`, resolvedModuleNames);
    return {
        platform,
        moduleTestRe: _dependenciesToRegex(resolvedModuleNames),
        resolvedModulePaths,
        moduleNameRewrites
    };
};
async function createAutolinkingModuleResolverInput({ platforms, projectRoot }) {
    const autolinking = getAutolinkingExports();
    const linker = autolinking.makeCachedDependenciesLinker({
        projectRoot
    });
    return Object.fromEntries(await Promise.all(platforms.filter((platform)=>{
        return AUTOLINKING_PLATFORMS.includes(platform);
    }).map(async (platform)=>{
        const dependencies = await autolinking.scanDependencyResolutionsForPlatform(linker, platform, KNOWN_STICKY_DEPENDENCIES);
        const supportPackage = autolinking.getSupportPackageForPlatform(platform);
        const moduleDescription = toPlatformModuleDescription(dependencies, platform, supportPackage);
        return [
            platform,
            moduleDescription
        ];
    })));
}
function createAutolinkingModuleResolver(input, { getStrictResolver }) {
    if (!input) {
        return undefined;
    }
    const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
    const isAutolinkingPlatform = (platform)=>!!platform && input[platform] != null;
    return function requestStickyModule(immutableContext, moduleName, platform) {
        // NOTE(@kitten): We currently don't include Web. The `expo-doctor` check already warns
        // about duplicates, and we can try to add Web later on. We should expand expo-modules-autolinking
        // properly to support web first however
        if (!isAutolinkingPlatform(platform)) {
            return null;
        } else if (fileSpecifierRe.test(moduleName)) {
            return null;
        }
        const moduleDescription = input[platform];
        const moduleMatch = moduleDescription.moduleTestRe.exec(moduleName);
        if (moduleMatch) {
            var _moduleDescription_moduleNameRewrites;
            const matchedName = moduleMatch[1];
            const rewriteTarget = (_moduleDescription_moduleNameRewrites = moduleDescription.moduleNameRewrites) == null ? void 0 : _moduleDescription_moduleNameRewrites[matchedName];
            const resolvedModuleName = rewriteTarget != null ? rewriteTarget + moduleMatch[2] : moduleName;
            const resolvedModulePath = moduleDescription.resolvedModulePaths[rewriteTarget ?? matchedName] || resolvedModuleName;
            // We instead resolve as if it was a dependency from within the (target) module
            const context = {
                ...immutableContext,
                nodeModulesPaths: [],
                originModulePath: resolvedModulePath
            };
            const res = getStrictResolver(context, platform)(resolvedModuleName);
            debug(`Sticky resolution for ${platform}: ${moduleName} -> ${resolvedModuleName} (from: ${resolvedModulePath})`);
            return res;
        }
        return null;
    };
}

//# sourceMappingURL=createExpoAutolinkingResolver.js.map