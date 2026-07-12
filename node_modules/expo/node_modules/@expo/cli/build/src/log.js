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
    get Log () {
        return Log;
    },
    get clear () {
        return clear;
    },
    get debug () {
        return debug;
    },
    get error () {
        return error;
    },
    get exception () {
        return exception;
    },
    get exit () {
        return exit;
    },
    get log () {
        return log;
    },
    get time () {
        return time;
    },
    get timeEnd () {
        return timeEnd;
    },
    get warn () {
        return warn;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// NOTE(@kitten): LogRespectingTerminal in instantiateMetro regressed on fatal errors and
// logs may be swallowed before exiting. We redirect them to a direct write when we're about to exit
let isExiting = false;
function time(label) {
    console.time(label);
}
function timeEnd(label) {
    console.timeEnd(label);
}
function error(...message) {
    if (isExiting) {
        // `console.error` may be patched to route through an async stderr queue
        // (see LogRespectingTerminal in instantiateMetro.ts). On the exit path
        // that queue has no chance to drain before `process.exit`, so write
        // synchronously to bypass it.
        process.stderr.write(message.join(' ') + '\n');
        return;
    }
    console.error(...message);
}
function exception(e) {
    const { env } = require('./utils/env');
    error(_chalk().default.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + _chalk().default.gray(e.stack) : ''));
}
function warn(...message) {
    if (isExiting) {
        process.stderr.write(message.map((value)=>_chalk().default.yellow(value)).join(' ') + '\n');
        return;
    }
    console.warn(...message.map((value)=>_chalk().default.yellow(value)));
}
function log(...message) {
    if (isExiting) {
        process.stdout.write(message.join(' ') + '\n');
        return;
    }
    console.log(...message);
}
function debug(...message) {
    if (require('./utils/env').env.EXPO_DEBUG) console.log(...message);
}
function clear() {
    process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}
function exit(message, code = 1) {
    isExiting = true;
    if (message instanceof Error) {
        exception(message);
    } else if (message) {
        if (code === 0) {
            log(message);
        } else {
            error(message);
        }
    }
    process.exit(code);
}
const Log = {
    time,
    timeEnd,
    error,
    exception,
    warn,
    log,
    debug,
    clear,
    exit
};

//# sourceMappingURL=log.js.map