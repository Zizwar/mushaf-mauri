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
    get defaultRenameConfig () {
        return defaultRenameConfig;
    },
    get getTemplateFilesToRenameAsync () {
        return getTemplateFilesToRenameAsync;
    },
    get renameTemplateAppNameAsync () {
        return renameTemplateAppNameAsync;
    }
});
function _configplugins() {
    const data = require("@expo/config-plugins");
    _configplugins = function() {
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
function _glob() {
    const data = require("glob");
    _glob = function() {
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
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:prebuild:copyTemplateFiles');
function escapeXMLCharacters(original) {
    const noAmps = original.replace('&', '&amp;');
    const noLt = noAmps.replace('<', '&lt;');
    const noGt = noLt.replace('>', '&gt;');
    const noApos = noGt.replace('"', '\\"');
    return noApos.replace("'", "\\'");
}
const defaultRenameConfig = [
    // Common
    '!**/node_modules',
    'app.json',
    // Android
    'android/**/*.gradle',
    'android/app/BUCK',
    'android/app/src/**/*.java',
    'android/app/src/**/*.kt',
    'android/app/src/**/*.xml',
    // iOS
    'ios/Podfile',
    'ios/**/*.xcodeproj/project.pbxproj',
    'ios/**/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
    'ios/**/*.xcworkspace/contents.xcworkspacedata',
    // macOS
    'macos/Podfile',
    'macos/**/*.xcodeproj/project.pbxproj',
    'macos/**/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
    'macos/**/*.xcworkspace/contents.xcworkspacedata'
];
async function getTemplateFilesToRenameAsync(cwd, { renameConfig: userConfig } = {}) {
    let config = userConfig ?? defaultRenameConfig;
    // Strip comments, trim whitespace, and remove empty lines.
    config = config.map((line)=>{
        var _line_split_;
        return (_line_split_ = line.split(/(?<!\\)#/, 3)[0]) == null ? void 0 : _line_split_.trim();
    }).filter((line)=>!!line);
    return await (0, _glob().glob)(config, {
        cwd,
        // `true` is consistent with .gitignore. Allows `*.xml` to match .xml files
        // in all subdirs.
        matchBase: true,
        dot: true,
        // Prevent climbing out of the template directory in case a template
        // includes a symlink to an external directory.
        follow: false,
        // Do not match on directories, only files
        // Without this patterns like `android/**/*.gradle` actually match the folder `android/.gradle`
        nodir: true
    });
}
async function renameTemplateAppNameAsync(cwd, { expName: name, files }) {
    debug(`Got files to transform: ${JSON.stringify(files)}`);
    await Promise.all(files.map(async (file)=>{
        const absoluteFilePath = _path().default.resolve(cwd, file);
        let contents;
        try {
            contents = await _fs().default.promises.readFile(absoluteFilePath, {
                encoding: 'utf-8'
            });
        } catch (error) {
            throw new Error(`Failed to read template file: "${absoluteFilePath}". Was it removed mid-operation?`, {
                cause: error
            });
        }
        debug(`Renaming app name in file: ${absoluteFilePath}`);
        const safeName = [
            '.xml',
            '.plist'
        ].includes(_path().default.extname(file)) ? escapeXMLCharacters(name) : name;
        try {
            const replacement = contents.replace(/Hello App Display Name/g, safeName).replace(/HelloWorld/g, _configplugins().IOSConfig.XcodeUtils.sanitizedName(safeName)).replace(/helloworld/g, _configplugins().IOSConfig.XcodeUtils.sanitizedName(safeName.toLowerCase()));
            if (replacement === contents) {
                return;
            }
            await _fs().default.promises.writeFile(absoluteFilePath, replacement);
        } catch (error) {
            throw new Error(`Failed to overwrite template file: "${absoluteFilePath}". Was it removed mid-operation?`, {
                cause: error
            });
        }
    }));
}

//# sourceMappingURL=renameTemplateAppName.js.map