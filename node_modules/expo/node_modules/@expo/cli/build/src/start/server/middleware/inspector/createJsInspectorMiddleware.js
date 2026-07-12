"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createJsInspectorMiddleware", {
    enumerable: true,
    get: function() {
        return createJsInspectorMiddleware;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
function _url() {
    const data = require("url");
    _url = function() {
        return data;
    };
    return data;
}
const _JsInspector = require("./JsInspector");
const _net = require("../../../../utils/net");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createJsInspectorMiddleware({ serverBaseUrl }) {
    return async function(req, res, next) {
        if (!(0, _net.isMatchingOrigin)(req, serverBaseUrl)) {
            res.writeHead(403).end();
            return;
        }
        // `req.url` may be absolute-form (HTTP/1.1) — only take search params from it.
        const { searchParams } = new (_url()).URL(req.url ?? '/', serverBaseUrl);
        const appId = searchParams.get('appId') || searchParams.get('applicationId');
        if (!appId) {
            res.writeHead(400).end('Missing application identifier ("?appId=...")');
            return;
        }
        const app = await (0, _JsInspector.queryInspectorAppAsync)(serverBaseUrl, appId);
        if (!app) {
            res.writeHead(404).end('Unable to find inspector target from @react-native/dev-middleware');
            console.warn(_chalk().default.yellow('No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine.'));
            return;
        }
        if (req.method === 'GET') {
            const data = JSON.stringify(app);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=UTF-8',
                'Cache-Control': 'no-cache',
                'Content-Length': data.length.toString()
            });
            res.end(data);
        } else if (req.method === 'POST' || req.method === 'PUT') {
            if ((0, _net.shouldThrottleRemoteDevCall)()) {
                res.writeHead(429).end();
                return;
            }
            try {
                await (0, _JsInspector.openJsInspector)(serverBaseUrl, app);
            } catch (error) {
                // abort(Error: Command failed: osascript -e POSIX path of (path to application "google chrome")
                // 15:50: execution error: Google Chrome got an error: Application isn’t running. (-600)
                console.error(_chalk().default.red('Error launching JS inspector: ' + ((error == null ? void 0 : error.message) ?? 'Unknown error occurred')));
                res.writeHead(500);
                res.end();
                return;
            }
            res.end();
        } else {
            res.writeHead(405);
        }
    };
}

//# sourceMappingURL=createJsInspectorMiddleware.js.map