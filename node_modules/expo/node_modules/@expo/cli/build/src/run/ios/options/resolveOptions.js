"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveOptionsAsync", {
    enumerable: true,
    get: function() {
        return resolveOptionsAsync;
    }
});
function _config() {
    const data = require("@expo/config");
    _config = function() {
        return data;
    };
    return data;
}
const _resolveDevice = require("./resolveDevice");
const _resolveNativeScheme = require("./resolveNativeScheme");
const _resolveXcodeProject = require("./resolveXcodeProject");
const _simctl = require("../../../start/platforms/ios/simctl");
const _buildcacheproviders = require("../../../utils/build-cache-providers");
const _profile = require("../../../utils/profile");
const _resolveBundlerProps = require("../../resolveBundlerProps");
async function resolveOptionsAsync(projectRoot, options) {
    var _projectConfig_exp, _projectConfig_exp_experiments;
    const xcodeProject = (0, _resolveXcodeProject.resolveXcodeProject)(projectRoot);
    const bundlerProps = await (0, _resolveBundlerProps.resolveBundlerPropsAsync)(projectRoot, options);
    // Resolve the scheme before the device so we can filter devices based on
    // whichever scheme is selected (i.e. don't present TV devices if the scheme cannot be run on a TV).
    const { osType: schemeOsType, name: scheme } = await (0, _resolveNativeScheme.resolveNativeSchemePropsAsync)(projectRoot, options, xcodeProject);
    // Use the configuration or `Debug` if none is provided.
    const configuration = options.configuration || 'Debug';
    // Normalize the osType from the scheme, defaulting to iOS if not recognized.
    const osType = (0, _simctl.isOSType)(schemeOsType) ? schemeOsType : 'iOS';
    // Resolve the device based on the provided device id or prompt
    // from a list of devices (connected or simulated) that are filtered by the scheme.
    // Returns null when device is "generic" for build-only workflows.
    const device = await (0, _profile.profile)(_resolveDevice.resolveDeviceAsync)(options.device, {
        osType,
        xcodeProject,
        scheme,
        configuration
    });
    // Generic builds (device=null) are always simulator builds.
    // Otherwise check if the resolved device is a simulator.
    const isSimulator = device ? (0, _resolveDevice.isSimulatorDevice)(device) : true;
    const projectConfig = (0, _config().getConfig)(projectRoot);
    const buildCacheProvider = await (0, _buildcacheproviders.resolveBuildCacheProvider)(((_projectConfig_exp = projectConfig.exp) == null ? void 0 : _projectConfig_exp.buildCacheProvider) ?? ((_projectConfig_exp_experiments = projectConfig.exp.experiments) == null ? void 0 : _projectConfig_exp_experiments.buildCacheProvider), projectRoot);
    // This optimization skips resetting the Metro cache needlessly.
    // The cache is reset in `../node_modules/react-native/scripts/react-native-xcode.sh` when the
    // project is running in Debug and built onto a physical device. It seems that this is done because
    // the script is run from Xcode and unaware of the CLI instance.
    const shouldSkipInitialBundling = configuration === 'Debug' && !isSimulator;
    return {
        ...bundlerProps,
        shouldStartBundler: options.configuration === 'Debug' || bundlerProps.shouldStartBundler,
        projectRoot,
        isSimulator,
        xcodeProject,
        device,
        osType,
        configuration,
        shouldSkipInitialBundling,
        buildCache: options.buildCache !== false,
        scheme,
        buildCacheProvider
    };
}

//# sourceMappingURL=resolveOptions.js.map