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
    get downloadAndExtractNpmModuleAsync () {
        return downloadAndExtractNpmModuleAsync;
    },
    get extractLocalNpmTarballAsync () {
        return extractLocalNpmTarballAsync;
    },
    get extractNpmTarballAsync () {
        return extractNpmTarballAsync;
    },
    get extractNpmTarballFromUrlAsync () {
        return extractNpmTarballFromUrlAsync;
    },
    get getNpmUrlAsync () {
        return getNpmUrlAsync;
    },
    get npmViewAsync () {
        return npmViewAsync;
    },
    get packNpmTarballAsync () {
        return packNpmTarballAsync;
    },
    get sanitizeNpmPackageName () {
        return sanitizeNpmPackageName;
    }
});
function _configplugins() {
    const data = require("@expo/config-plugins");
    _configplugins = function() {
        return data;
    };
    return data;
}
function _spawnasync() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/spawn-async"));
    _spawnasync = function() {
        return data;
    };
    return data;
}
function _multitars() {
    const data = require("multitars");
    _multitars = function() {
        return data;
    };
    return data;
}
function _nodeassert() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:assert"));
    _nodeassert = function() {
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
function _slugify() {
    const data = /*#__PURE__*/ _interop_require_default(require("slugify"));
    _slugify = function() {
        return data;
    };
    return data;
}
function _stream() {
    const data = require("stream");
    _stream = function() {
        return data;
    };
    return data;
}
const _errors = require("./errors");
const _tar = require("./tar");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:utils:npm');
function sanitizeNpmPackageName(name) {
    // https://github.com/npm/validate-npm-package-name/#naming-rules
    return applyKnownNpmPackageNameRules(name) || applyKnownNpmPackageNameRules((0, _slugify().default)(name)) || // If nothing is left use 'app' like we do in Xcode projects.
    'app';
}
function applyKnownNpmPackageNameRules(name) {
    // https://github.com/npm/validate-npm-package-name/#naming-rules
    // package name cannot start with '.' or '_'.
    while(/^(\.|_)/.test(name)){
        name = name.substring(1);
    }
    name = name.toLowerCase().replace(/[^a-zA-Z._\-/@]/g, '');
    return name// .replace(/![a-z0-9-._~]+/g, '')
    // Remove special characters
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || null;
}
async function npmViewAsync(...props) {
    var _stdout;
    const cmd = [
        'view',
        ...props,
        '--json'
    ];
    const results = (_stdout = (await (0, _spawnasync().default)('npm', cmd)).stdout) == null ? void 0 : _stdout.trim();
    const cmdString = `npm ${cmd.join(' ')}`;
    debug('Run:', cmdString);
    if (!results) {
        return null;
    }
    try {
        return JSON.parse(results);
    } catch (error) {
        throw new Error(`Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`);
    }
}
async function getNpmUrlAsync(packageName) {
    const results = await npmViewAsync(packageName, 'dist');
    (0, _nodeassert().default)(results, `Could not get npm url for package "${packageName}"`);
    // Fully qualified url returns an object.
    // Example:
    // 𝝠 npm view expo-template-bare-minimum@sdk-33 dist --json
    if (typeof results === 'object' && !Array.isArray(results)) {
        return results.tarball;
    }
    // When the tag is arbitrary, the tarball is an array, return the last value as it's the most recent.
    // Example:
    // 𝝠 npm view expo-template-bare-minimum@33 dist --json
    if (Array.isArray(results)) {
        const lastResult = results[results.length - 1];
        if (lastResult && typeof lastResult === 'object' && !Array.isArray(lastResult)) {
            return lastResult.tarball;
        }
    }
    throw new _errors.CommandError('Expected results of `npm view ...` to be an array or string. Instead found: ' + results);
}
function renameNpmTarballEntries(expName) {
    const renameConfigs = (input, typeflag)=>{
        if (typeflag === _multitars().TarTypeFlag.FILE && _nodepath().default.basename(input) === 'gitignore') {
            // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
            // See: https://github.com/npm/npm/issues/1862
            return input.replace(/gitignore$/, '.gitignore');
        } else {
            return input;
        }
    };
    if (expName) {
        const androidName = _configplugins().IOSConfig.XcodeUtils.sanitizedName(expName.toLowerCase());
        const iosName = _configplugins().IOSConfig.XcodeUtils.sanitizedName(expName);
        const lowerCaseName = iosName.toLowerCase();
        return (input, typeflag)=>{
            input = input.replace(/HelloWorld/g, input.includes('android') ? androidName : iosName).replace(/helloworld/g, lowerCaseName);
            return renameConfigs(input, typeflag);
        };
    } else {
        return renameConfigs;
    }
}
async function extractNpmTarballAsync(stream, output, props) {
    return await (0, _tar.extractStream)(stream, output, {
        filter: props.filter,
        rename: renameNpmTarballEntries(props.expName),
        strip: props.strip ?? 1
    });
}
async function extractNpmTarballFromUrlAsync(url, output, props) {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new Error(`Unexpected response: ${response.statusText}. From url: ${url}`);
    }
    return await extractNpmTarballAsync(response.body, output, props);
}
async function downloadAndExtractNpmModuleAsync(npmName, output, props) {
    const url = await getNpmUrlAsync(npmName);
    debug('Fetch from URL:', url);
    return await extractNpmTarballFromUrlAsync(url, output, props);
}
async function extractLocalNpmTarballAsync(tarFilePath, output, props) {
    return await extractNpmTarballAsync(_stream().Readable.toWeb(_nodefs().default.createReadStream(tarFilePath)), output, props);
}
async function packNpmTarballAsync(packageDir) {
    var _stdout;
    const cmdArgs = [
        'pack',
        '--json',
        '--foreground-scripts=false'
    ];
    const results = (_stdout = (await (0, _spawnasync().default)('npm', cmdArgs, {
        env: {
            ...process.env
        },
        cwd: packageDir
    })).stdout) == null ? void 0 : _stdout.trim();
    try {
        const [json] = JSON.parse(results);
        (0, _nodeassert().default)(typeof (json == null ? void 0 : json.filename) === 'string', 'Expected filename property on JSON array of type "string"');
        return _nodepath().default.resolve(packageDir, json.filename);
    } catch (error) {
        const cmdString = `npm ${cmdArgs.join(' ')}`;
        throw new Error(`Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`);
    }
}

//# sourceMappingURL=npm.js.map