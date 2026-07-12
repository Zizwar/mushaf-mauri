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
    get copyPublicFolderAsync () {
        return copyPublicFolderAsync;
    },
    get getPublicFolderPath () {
        return getPublicFolderPath;
    },
    get getUserDefinedFile () {
        return getUserDefinedFile;
    }
});
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
const _dir = require("../utils/dir");
const _env = require("../utils/env");
const _errors = require("../utils/errors");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:public-folder');
const maybeRealpath = (target)=>{
    try {
        return _fs().default.realpathSync(target);
    } catch  {
        return target;
    }
};
function getPublicFolderPath(projectRoot) {
    const publicPath = maybeRealpath(_path().default.resolve(projectRoot, _env.env.EXPO_PUBLIC_FOLDER));
    if (!(0, _dir.isPathInside)(publicPath, projectRoot)) {
        throw new _errors.CommandError('EXPO_PUBLIC_FOLDER', `EXPO_PUBLIC_FOLDER ("${_env.env.EXPO_PUBLIC_FOLDER}") resolves to "${publicPath}", which is outside the project root "${projectRoot}". Set EXPO_PUBLIC_FOLDER to a path inside your project (e.g. "public").`);
    }
    return publicPath;
}
function getUserDefinedFile(projectRoot, possiblePaths) {
    const publicPath = getPublicFolderPath(projectRoot);
    for (const possiblePath of possiblePaths){
        const fullPath = _path().default.join(publicPath, possiblePath);
        if (_fs().default.existsSync(fullPath)) {
            debug(`Found user-defined public file: ` + possiblePath);
            return fullPath;
        }
    }
    return null;
}
async function copyPublicFolderAsync(publicFolder, outputFolder) {
    if (_fs().default.existsSync(publicFolder)) {
        await _fs().default.promises.mkdir(outputFolder, {
            recursive: true
        });
        await (0, _dir.copyAsync)(publicFolder, outputFolder);
    }
}

//# sourceMappingURL=publicFolder.js.map