// NOTE(@kitten): These are currently only used by expo-updates (expo-updates/utols/src/createManifestForBuildAsync)
// They're re-exported via `expo/internal/cli-unstable-expo-updates-exports` to establish a valid dependency chain
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
    get createMetroServerAndBundleRequestAsync () {
        return createMetroServerAndBundleRequestAsync;
    },
    get drawableFileTypes () {
        return _metroAssetLocalPath.drawableFileTypes;
    },
    get exportEmbedAssetsAsync () {
        return _exportEmbedAsync.exportEmbedAssetsAsync;
    }
});
function _paths() {
    const data = require("@expo/config/paths");
    _paths = function() {
        return data;
    };
    return data;
}
function _nodefs() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:fs"));
    _nodefs = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
const _exportEmbedAsync = require("./export/embed/exportEmbedAsync");
const _metroAssetLocalPath = require("./export/metroAssetLocalPath");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/** Older versions of expo-updates may pass a path relative to the server root. But relative paths are expected to be relative to `projectRoot`, so we turn them into absolute paths */ function fixupServerRelativePath(projectRoot, entryFile) {
    const serverRoot = (0, _paths().getMetroServerRoot)(projectRoot);
    if (!_nodepath().default.isAbsolute(entryFile)) {
        let candidate;
        if (_nodefs().default.existsSync(candidate = _nodepath().default.resolve(serverRoot, entryFile))) {
            entryFile = candidate;
        } else if (!entryFile.endsWith('.js') && _nodefs().default.existsSync(candidate = _nodepath().default.resolve(serverRoot, entryFile + '.js'))) {
            entryFile = candidate;
        }
    }
    return entryFile;
}
const createMetroServerAndBundleRequestAsync = async (projectRoot, options)=>{
    return await (0, _exportEmbedAsync.createMetroServerAndBundleRequestAsync)(projectRoot, {
        ...options,
        entryFile: fixupServerRelativePath(projectRoot, options.entryFile)
    });
};

//# sourceMappingURL=expoUpdatesExports.js.map