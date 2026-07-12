#!/usr/bin/env node
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
    get expoLogin () {
        return expoLogin;
    },
    get readWordFromStdin () {
        return readWordFromStdin;
    }
});
const _args = require("../utils/args");
const _errors = require("../utils/errors");
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
const expoLogin = async (argv)=>{
    const args = (0, _args.assertArgs)({
        // Types
        '--help': Boolean,
        '--username': String,
        '--password': String,
        '--otp': String,
        '--sso': Boolean,
        '--browser': Boolean,
        // Aliases
        '-h': '--help',
        '-u': '--username',
        '-p': '--password',
        '-s': '--sso',
        '-b': '--browser'
    }, argv);
    if (args['--help']) {
        (0, _args.printHelp)(`Log in to an Expo account`, `npx expo login`, [
            `-u, --username <string>  Username`,
            `-p, --password <string>  Password ("-" for stdin)`,
            `--otp <string>           One-time password from your 2FA device`,
            `-s, --sso                Log in with SSO`,
            `-b, --browser            Log in with a browser`,
            `-h, --help               Usage info`
        ].join('\n'));
    }
    const password = args['--password'] === '-' ? await readWordFromStdin() : args['--password'];
    const { showLoginPromptAsync } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("../api/user/actions.js")));
    return showLoginPromptAsync({
        // Parsed options
        username: args['--username'],
        password,
        otp: args['--otp'],
        sso: !!args['--sso'],
        browser: !!args['--browser']
    }).catch(_errors.logCmdError);
};
async function readWordFromStdin() {
    let buffer = '';
    for await (const chunk of process.stdin){
        buffer += chunk;
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex !== -1) {
            return buffer.slice(0, newlineIndex).replace(/\r$/, '');
        }
    }
    return buffer;
}

//# sourceMappingURL=index.js.map