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
    get UnexpectedServerData () {
        return _client.UnexpectedServerData;
    },
    get UnexpectedServerError () {
        return _client.UnexpectedServerError;
    },
    get graphql () {
        return graphql;
    },
    get mutate () {
        return mutate;
    },
    get query () {
        return query;
    }
});
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../log"));
const _fetch = require("../../utils/fetch");
const _endpoint = require("../endpoint");
const _client = require("../rest/client");
const _wrapFetchWithOffline = require("../rest/wrapFetchWithOffline");
const _wrapFetchWithUserAgent = require("../rest/wrapFetchWithUserAgent");
const _UserSettings = require("../user/UserSettings");
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
function graphql(query) {
    return query.trim();
}
const { query, mutate } = (()=>{
    const url = (0, _endpoint.getExpoApiBaseUrl)() + '/graphql';
    let _fetch1;
    const wrappedFetch = (...args)=>{
        if (!_fetch1) {
            _fetch1 = (0, _wrapFetchWithOffline.wrapFetchWithOffline)((0, _wrapFetchWithUserAgent.wrapFetchWithUserAgent)(_fetch.fetch));
        }
        return _fetch1(...args);
    };
    const randomDelay = (attemptCount)=>new Promise((resolve)=>{
            setTimeout(resolve, Math.min(500 + Math.random() * 1000 * attemptCount, 4000));
        });
    const getFetchHeaders = ()=>{
        var _getSession;
        const token = (0, _UserSettings.getAccessToken)();
        const headers = {
            'content-type': 'application/json',
            accept: 'application/graphql-response+json, application/graphql+json, application/json'
        };
        let sessionSecret;
        if (token) {
            headers.authorization = `Bearer ${token}`;
        } else if (sessionSecret = (_getSession = (0, _UserSettings.getSession)()) == null ? void 0 : _getSession.sessionSecret) {
            headers['expo-session'] = sessionSecret;
        }
        return headers;
    };
    // NOTE(@kitten): This only sorted keys one level deep since this is sufficient for most cases
    const stringifySorted = (variables)=>JSON.stringify(Object.keys(variables).sort().reduce((acc, key)=>{
            acc[key] = variables[key];
            return acc;
        }, {}));
    let cache = {};
    let cacheKey;
    function resetCache() {
        cache = {};
    }
    async function request(query, variables, options, // Mutations must never be served from (or written to) the in-memory cache.
    useCache) {
        let isTransient = false;
        let response;
        let data;
        let error;
        // Pre-instantiate headers and reset the cache if they've changed
        const headers = {
            ...getFetchHeaders(),
            ...options == null ? void 0 : options.headers
        };
        const headersKey = stringifySorted(headers);
        if (!cacheKey || cacheKey !== headersKey) {
            resetCache();
            cacheKey = headersKey;
        }
        // Retrieve a cached result, if we have any via a `query => variables => Result` cache key
        const variablesKey = stringifySorted(variables);
        const queryCache = cache[query] || (cache[query] = new Map());
        if (useCache && queryCache.has(variablesKey)) {
            data = queryCache.get(variablesKey);
        }
        // Retry the query if it fails due to an unknown or transient error
        for(let attemptCount = 0; attemptCount < 3 && !data; attemptCount++){
            // Add a random delay on each subsequent attempt
            if (attemptCount > 0) {
                await randomDelay(attemptCount);
            }
            try {
                response = await wrappedFetch(url, {
                    ...options,
                    method: 'POST',
                    body: JSON.stringify({
                        query,
                        variables
                    }),
                    headers
                });
            } catch (networkError) {
                error = networkError || error;
                continue;
            }
            const json = await response.json();
            if (typeof json === 'object' && json) {
                // If we have a transient error, we retry immediately and discard the data
                // Otherwise, we store the first available error and get the data
                if ('errors' in json && Array.isArray(json.errors)) {
                    isTransient = json.errors.some((e)=>{
                        var _e_extensions;
                        return e == null ? void 0 : (_e_extensions = e.extensions) == null ? void 0 : _e_extensions.isTransient;
                    });
                    if (isTransient) {
                        data = undefined;
                        continue;
                    } else {
                        error = json.errors[0] || error;
                    }
                }
                try {
                    data = (0, _client.getResponseDataOrThrow)(json);
                } catch (dataError) {
                    // We only use the data error, if we don't have an error already
                    if (!error) {
                        error = dataError || error;
                    }
                    continue;
                }
            }
        }
        // Store the data in the cache, and only return a result if we have any values
        if (data) {
            if (useCache) {
                queryCache.set(variablesKey, data);
            }
            const keys = Object.keys(data);
            if (keys.length > 0 && keys.some((key)=>data[key] != null)) {
                return data;
            }
        }
        // If we have an error, rethrow it wrapped in our custom errors
        if (error) {
            if (isTransient) {
                _log.error(`We've encountered a transient error, please try again shortly.`);
            }
            const wrappedError = new _client.UnexpectedServerError('' + error.message);
            wrappedError.cause = error;
            throw wrappedError;
        } else if (response && !response.ok) {
            throw new _client.UnexpectedServerError(`Unexpected server error: ${response.statusText}`);
        } else {
            throw new _client.UnexpectedServerData('Unexpected server error: No returned query result');
        }
    }
    return {
        /** Run a GraphQL query, served from the in-memory cache when possible. */ query (document, variables, options) {
            return request(document, variables, options, /* useCache */ true);
        },
        /** Run a GraphQL mutation, always hitting the network and never touching the cache. */ mutate (document, variables, options) {
            return request(document, variables, options, /* useCache */ false);
        }
    };
})();

//# sourceMappingURL=client.js.map