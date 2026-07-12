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
    get getDirectoryOfProcessById () {
        return getDirectoryOfProcessById;
    },
    get getPID () {
        return getPID;
    },
    get getProcessCommand () {
        return getProcessCommand;
    },
    get getRunningProcess () {
        return getRunningProcess;
    }
});
function _spawnasync() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/spawn-async"));
    _spawnasync = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("path"));
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
const debug = require('debug')('expo:utils:getRunningProcess');
/** Timeout applied to shell commands */ const timeout = 350;
async function getPID(port) {
    try {
        const { stdout } = await (0, _spawnasync().default)('lsof', [
            `-i:${port}`,
            '-P',
            '-t',
            '-sTCP:LISTEN'
        ], {
            timeout
        });
        const pid = Number(stdout.split('\n', 1)[0].trim());
        debug(`pid: ${pid} for port: ${port}`);
        return Number.isSafeInteger(pid) ? pid : null;
    } catch (error) {
        debug(`No pid found for port: ${port}. Error: ${error}`);
        return null;
    }
}
/** Get `package.json` `name` field for a given directory. Returns `null` if none exist. */ function getPackageName(packageRoot) {
    try {
        const packageJson = _path().resolve(packageRoot, 'package.json');
        return require(packageJson).name || null;
    } catch (error) {
        return null;
    }
}
async function getProcessCommand(pid, procDirectory) {
    let name = getPackageName(procDirectory);
    if (!name) {
        // ps
        // -o args=: Output argv without header
        // -p [pid]: For process of PID
        const { stdout } = await (0, _spawnasync().default)('ps', [
            '-o',
            'args=',
            '-p',
            `${pid}`
        ], {
            timeout
        });
        name = stdout.trim();
    }
    return name || null;
}
async function getDirectoryOfProcessById(pid) {
    try {
        var _stdout_split_find;
        // lsof
        // -F n: ask for machine readable output
        // -a: apply conditions as logical AND
        // -d cwd: Filter by cwd fd
        // -p [pid]: Filter by input process id
        const { stdout } = await (0, _spawnasync().default)('lsof', [
            '-F',
            'n',
            '-a',
            '-d',
            'cwd',
            '-p',
            `${pid}`
        ], {
            timeout
        });
        const processCWD = (_stdout_split_find = stdout.split('\n').find((output)=>output.startsWith('n'))) == null ? void 0 : _stdout_split_find.slice(1);
        return processCWD && _path().isAbsolute(processCWD) ? _path().normalize(processCWD) : null;
    } catch  {
        return null;
    }
}
async function getRunningProcess(port) {
    // Don't even try on Windows, since `lsof` and `ps` are not available there
    if (process.platform === 'win32') {
        return null;
    }
    const pid = await getPID(port);
    if (!pid) {
        return null;
    }
    try {
        const directory = await getDirectoryOfProcessById(pid);
        if (directory) {
            const command = await getProcessCommand(pid, directory);
            if (command) {
                return {
                    pid,
                    directory,
                    command
                };
            }
        }
    } catch  {}
    return null;
}

//# sourceMappingURL=getRunningProcess.js.map