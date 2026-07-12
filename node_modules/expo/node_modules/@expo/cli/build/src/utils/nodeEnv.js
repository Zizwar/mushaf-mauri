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
    get event () {
        return event;
    },
    get getEnvFiles () {
        return getEnvFiles;
    },
    get loadEnvFiles () {
        return loadEnvFiles;
    },
    get reloadEnvFiles () {
        return reloadEnvFiles;
    },
    get setNodeEnv () {
        return setNodeEnv;
    }
});
function _env() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("@expo/env"));
    _env = function() {
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
const _events = require("../events");
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
const event = (0, _events.events)('env', (t)=>[
        t.event(),
        t.event()
    ]);
function setNodeEnv(mode) {
    process.env.NODE_ENV = process.env.NODE_ENV || mode;
    process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;
    globalThis.__DEV__ = process.env.NODE_ENV !== 'production';
    event('mode', {
        nodeEnv: process.env.NODE_ENV,
        babelEnv: process.env.BABEL_ENV,
        mode
    });
}
let prevEnvKeys;
function loadEnvFiles(projectRoot, options) {
    const params = {
        ...options,
        silent: !!(options == null ? void 0 : options.silent) || (0, _events.shouldReduceLogs)(),
        force: !!(options == null ? void 0 : options.force),
        mode: process.env.NODE_ENV,
        systemEnv: process.env
    };
    const envInfo = _env().loadProjectEnv(projectRoot, params);
    const envOutput = {};
    if (envInfo.result === 'loaded') {
        prevEnvKeys = new Set();
        for (const key of envInfo.loaded){
            envOutput[key] = envInfo.env[key] ?? undefined;
            prevEnvKeys.add(key);
        }
    }
    if (envInfo.result === 'loaded') {
        event('load', {
            mode: params.mode,
            files: envInfo.files.map((file)=>event.path(file)),
            env: envOutput
        });
    }
    if (!params.silent) {
        _env().logLoadedEnv(envInfo, params);
    }
    return process.env;
}
function getEnvFiles(projectRoot) {
    return _env().getEnvFiles({
        mode: process.env.NODE_ENV
    }).map((fileName)=>_nodepath().default.join(projectRoot, fileName));
}
function reloadEnvFiles(projectRoot) {
    const isEnabled = _env().isEnabled();
    if (isEnabled) {
        const params = {
            force: true,
            silent: true,
            mode: process.env.NODE_ENV,
            systemEnv: process.env
        };
        // We use a global tracker to allow overwrites of env vars we set ourselves
        const envInfo = _env().parseProjectEnv(projectRoot, params);
        const envOutput = {};
        for(const key in envInfo.env){
            const value = envInfo.env[key];
            if (process.env[key] !== value) {
                if (typeof process.env[key] === 'undefined' || (!prevEnvKeys || prevEnvKeys.has(key)) && process.env[key] !== value) {
                    (prevEnvKeys ||= new Set()).add(key);
                    process.env[key] = envInfo.env[key];
                    envOutput[key] = value ?? undefined;
                }
            }
        }
        event('load', {
            mode: params.mode,
            files: envInfo.files.map((file)=>event.path(file)),
            env: envOutput
        });
    }
}

//# sourceMappingURL=nodeEnv.js.map