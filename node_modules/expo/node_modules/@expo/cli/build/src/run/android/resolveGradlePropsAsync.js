"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveGradlePropsAsync", {
    enumerable: true,
    get: function() {
        return resolveGradlePropsAsync;
    }
});
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
const _adb = require("../../start/platforms/android/adb");
const _errors = require("../../utils/errors");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// Supported ABIs for Android. see https://developer.android.com/ndk/guides/abis
const VALID_ARCHITECTURES = [
    'armeabi-v7a',
    'arm64-v8a',
    'x86',
    'x86_64'
];
function assertVariant(variant) {
    if (variant && typeof variant !== 'string') {
        throw new _errors.CommandError('BAD_ARGS', '--variant must be a string');
    }
    return variant ?? 'debug';
}
async function resolveGradlePropsAsync(projectRoot, options, device) {
    const variant = assertVariant(options.variant);
    // NOTE(EvanBacon): Why would this be different? Can we get the different name?
    const appName = 'app';
    const apkDirectory = _path().default.join(projectRoot, 'android', appName, 'build', 'outputs', 'apk');
    // buildDeveloperTrust -> buildtype: trust, flavors: buildDeveloper
    // developmentDebug -> buildType: debug, flavors: development
    // productionRelease -> buildType: release, flavors: production
    // previewDebugOptimized -> buildType: debugOptimized, flavors: preview
    const parts = variant.split(/(?=[A-Z])/);
    // Special case: merge 'Optimized' suffix with preceding part, e.g. into 'debugOptimized'
    let buildType = parts.pop() ?? 'debug';
    if (parts.length > 0 && buildType === 'Optimized') {
        buildType = parts.pop().toLowerCase() + buildType;
    } else {
        buildType = buildType.toLowerCase();
    }
    let apkVariantDirectory;
    if (parts.length > 0) {
        const flavorPath = parts[0].toLowerCase() + parts.slice(1).join('');
        apkVariantDirectory = _path().default.join(apkDirectory, flavorPath, buildType);
    } else {
        apkVariantDirectory = _path().default.join(apkDirectory, buildType);
    }
    return {
        appName,
        buildType,
        flavors: parts.map((v)=>v.toLowerCase()),
        apkVariantDirectory,
        architectures: await getConnectedDeviceABI(buildType, device, options.allArch)
    };
}
async function getConnectedDeviceABI(buildType, device, allArch) {
    // Follow the same behavior as iOS, only enable this for debug builds
    // Support both 'debug' and 'debugOptimized' build types
    const isDebugBuild = buildType === 'debug' || buildType === 'debugOptimized';
    if (allArch || !isDebugBuild) {
        return '';
    }
    const abis = await (0, _adb.getDeviceABIsAsync)(device);
    return abis.find((abi)=>VALID_ARCHITECTURES.includes(abi)) ?? '';
}

//# sourceMappingURL=resolveGradlePropsAsync.js.map