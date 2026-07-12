"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveLocalTemplateAsync", {
    enumerable: true,
    get: function() {
        return resolveLocalTemplateAsync;
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
function _resolvefrom() {
    const data = /*#__PURE__*/ _interop_require_default(require("resolve-from"));
    _resolvefrom = function() {
        return data;
    };
    return data;
}
const _npm = require("../utils/npm");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:prebuild:resolveLocalTemplate');
/** Returns the `local-template` target path, only for the `expo/expo` monorepo */ const getMonorepoTemplatePath = async ()=>{
    const cliPath = _path().default.dirname(require.resolve('@expo/cli/package.json'));
    const localTemplateOriginPath = _path().default.join(cliPath, 'local-template');
    try {
        return await _fs().default.promises.realpath(localTemplateOriginPath);
    } catch  {
        return null;
    }
};
async function resolveLocalTemplateAsync({ templateDirectory, projectRoot, exp }) {
    let templatePath;
    // In the expo/expo monorepo only, we use `templates/expo-template-bare-minimum` directly
    const monorepoTemplatePath = await getMonorepoTemplatePath();
    if (monorepoTemplatePath) {
        debug('Packing local template from expo-template-bare-minimum path:', monorepoTemplatePath);
        try {
            templatePath = await (0, _npm.packNpmTarballAsync)(monorepoTemplatePath);
            debug('Using packed local template at:', templatePath);
        } catch (error) {
            // We're vocal here about an error, since we don't expect this to fail, and it's only for our monorepo
            console.error(`Failed to pack local expo-template-bare-minimum to be used as a prebuild template:\n`, error);
            throw error;
        }
    } else {
        // The default is to use `expo/template.tgz` which exists in all published versions of it
        templatePath = (0, _resolvefrom().default)(projectRoot, 'expo/template.tgz');
        debug('Using local template from Expo package:', templatePath);
    }
    return await (0, _npm.extractLocalNpmTarballAsync)(templatePath, templateDirectory, {
        expName: exp.name
    });
}

//# sourceMappingURL=resolveLocalTemplate.js.map