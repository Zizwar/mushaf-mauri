"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getSessionUsingBrowserAuthFlowAsync", {
    enumerable: true,
    get: function() {
        return getSessionUsingBrowserAuthFlowAsync;
    }
});
function _assert() {
    const data = /*#__PURE__*/ _interop_require_default(require("assert"));
    _assert = function() {
        return data;
    };
    return data;
}
function _crypto() {
    const data = /*#__PURE__*/ _interop_require_default(require("crypto"));
    _crypto = function() {
        return data;
    };
    return data;
}
function _http() {
    const data = /*#__PURE__*/ _interop_require_default(require("http"));
    _http = function() {
        return data;
    };
    return data;
}
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _errors = require("../../utils/errors");
const _open = require("../../utils/open");
const _client = require("../rest/client");
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
const CLIENT_ID = 'expo-cli';
function generateCodeVerifier() {
    return _crypto().default.randomBytes(32).toString('base64url');
}
function generateCodeChallenge(codeVerifier) {
    return _crypto().default.createHash('sha256').update(codeVerifier).digest('base64url');
}
function generateState() {
    return _crypto().default.randomBytes(32).toString('base64url');
}
async function exchangeCodeForSessionSecretAsync({ code, codeVerifier, redirectUri }) {
    const response = await (0, _client.fetchAsync)('auth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
            client_id: CLIENT_ID
        })
    });
    const { session_secret: sessionSecret } = (0, _client.getResponseDataOrThrow)(await response.json());
    if (!sessionSecret) {
        throw new _errors.CommandError('BROWSER_AUTH', 'Failed to obtain session secret from token exchange.');
    }
    return sessionSecret;
}
async function getSessionUsingBrowserAuthFlowAsync({ expoWebsiteUrl, sso = false }) {
    const scheme = 'http';
    const hostname = 'localhost';
    const callbackPath = '/auth/callback';
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    const buildRedirectUri = (port)=>`${scheme}://${hostname}:${port}${callbackPath}`;
    const buildExpoLoginUrl = (port, sso)=>{
        // Note: we avoid URLSearchParams here because better-opn calls encodeURI()
        // on the URL before passing it to AppleScript, which would double-encode
        // the percent-encoded values from URLSearchParams.toString().
        const params = [
            `client_id=${CLIENT_ID}`,
            `redirect_uri=${buildRedirectUri(port)}`,
            `response_type=code`,
            `code_challenge=${codeChallenge}`,
            `code_challenge_method=S256`,
            `state=${state}`,
            `confirm_account=true`
        ].join('&');
        return `${expoWebsiteUrl}${sso ? '/sso-login' : '/login'}?${params}`;
    };
    // Start server and begin auth flow
    const executeAuthFlow = ()=>{
        return new Promise(async (resolve, reject)=>{
            const connections = new Set();
            const server = _http().default.createServer((request, response)=>{
                const redirectAndCleanup = (result)=>{
                    const redirectUrl = `${expoWebsiteUrl}/oauth/expo-cli?result=${result}`;
                    response.writeHead(302, {
                        Location: redirectUrl
                    });
                    response.end();
                    server.close();
                    for (const connection of connections){
                        connection.destroy();
                    }
                };
                const handleRequestAsync = async ()=>{
                    var _request_url;
                    if (!(request.method === 'GET' && ((_request_url = request.url) == null ? void 0 : _request_url.includes(callbackPath)))) {
                        throw new _errors.CommandError('BROWSER_AUTH', 'Unexpected login response.');
                    }
                    const url = new URL(request.url, `http:${request.headers.host}`);
                    const code = url.searchParams.get('code');
                    const returnedState = url.searchParams.get('state');
                    if (!code) {
                        throw new _errors.CommandError('BROWSER_AUTH', 'Request missing code search parameter.');
                    }
                    if (returnedState !== state) {
                        throw new _errors.CommandError('BROWSER_AUTH', 'State mismatch. Possible CSRF attack.');
                    }
                    const address = server.address();
                    (0, _assert().default)(address !== null && typeof address === 'object');
                    const redirectUri = buildRedirectUri(address.port);
                    const sessionSecret = await exchangeCodeForSessionSecretAsync({
                        code,
                        codeVerifier,
                        redirectUri
                    });
                    resolve(sessionSecret);
                    redirectAndCleanup('success');
                };
                handleRequestAsync().catch((error)=>{
                    redirectAndCleanup('error');
                    reject(error);
                });
            });
            server.listen(0, hostname, ()=>{
                _log.log('Waiting for browser login...');
                const address = server.address();
                (0, _assert().default)(address !== null && typeof address === 'object', 'Server address and port should be set after listening has begun');
                const port = address.port;
                const authorizeUrl = buildExpoLoginUrl(port, sso);
                _log.log(`If your browser doesn't automatically open, visit this link to log in: ${authorizeUrl}`);
                (0, _open.openBrowserAsync)(authorizeUrl);
            });
            server.on('connection', (connection)=>{
                connections.add(connection);
                connection.on('close', ()=>{
                    connections.delete(connection);
                });
            });
        });
    };
    return await executeAuthFlow();
}

//# sourceMappingURL=expoSsoLauncher.js.map