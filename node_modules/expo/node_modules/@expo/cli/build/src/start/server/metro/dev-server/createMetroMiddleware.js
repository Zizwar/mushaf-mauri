"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createMetroMiddleware", {
    enumerable: true,
    get: function() {
        return createMetroMiddleware;
    }
});
function _paths() {
    const data = require("@expo/config/paths");
    _paths = function() {
        return data;
    };
    return data;
}
function _connect() {
    const data = /*#__PURE__*/ _interop_require_default(require("connect"));
    _connect = function() {
        return data;
    };
    return data;
}
function _fetchnodeshim() {
    const data = require("fetch-nodeshim");
    _fetchnodeshim = function() {
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
const _compression = require("./compression");
const _createEventSocket = require("./createEventSocket");
const _createMessageSocket = require("./createMessageSocket");
const _log = require("../../../../log");
const _dir = require("../../../../utils/dir");
const _editor = require("../../../../utils/editor");
const _net = require("../../../../utils/net");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createMetroMiddleware(metroConfig, options) {
    const messages = (0, _createMessageSocket.createMessagesSocket)({
        logger: _log.Log,
        serverBaseUrl: options.serverBaseUrl
    });
    const events = (0, _createEventSocket.createEventsSocket)(messages);
    const middleware = (0, _connect().default)().use(noCacheMiddleware).use(_compression.compression)// Support opening stack frames from clients directly in the editor
    .use('/open-stack-frame', createMetroOpenStackFrameMiddleware(metroConfig))// Support status check to detect if the packager needs to be started from the native side
    .use('/status', createMetroStatusMiddleware(metroConfig, options));
    return {
        middleware,
        messagesSocket: messages,
        eventsSocket: events,
        websocketEndpoints: {
            [messages.endpoint]: messages.server,
            [events.endpoint]: events.server
        }
    };
}
const noCacheMiddleware = (_req, res, next)=>{
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};
function createMetroStatusMiddleware(metroConfig, options) {
    return async (_req, res)=>{
        res.setHeader('X-React-Native-Project-Root', encodeURI(metroConfig.projectRoot));
        res.flushHeaders();
        await options.getMetroBundler().ready();
        res.end('packager-status:running');
    };
}
function createMetroOpenStackFrameMiddleware(metroConfig) {
    return async (req, res, next)=>{
        if (req.method !== 'POST') {
            return next();
        }
        let frame;
        try {
            const json = await new (_fetchnodeshim()).Body(req).json();
            if (typeof json === 'object' && json != null && typeof json.file === 'string') {
                frame = {
                    file: json.file,
                    lineNumber: typeof json.lineNumber === 'number' && Number.isSafeInteger(json.lineNumber) ? json.lineNumber : undefined
                };
            }
        } catch  {}
        if (!frame) {
            res.statusCode = 400;
            return res.end('Open stack frame requires the JSON stack frame as request body');
        }
        const root = (0, _paths().getMetroServerRoot)(metroConfig.projectRoot);
        const file = await ensureFileInRootDirectory(root, frame.file);
        if (!file) {
            res.statusCode = 400;
            return res.end('Open stack frame requires target file to be in server root');
        }
        if ((0, _net.shouldThrottleRemoteDevCall)()) {
            res.statusCode = 429;
            return res.end();
        }
        try {
            await (0, _editor.openInEditorAsync)(file, frame.lineNumber);
            return res.end('OK');
        } catch  {
            res.statusCode = 5006;
            return res.end('Open stack frame failed to open local editor');
        }
    };
}
const ensureFileInRootDirectory = async (root, file)=>{
    try {
        file = _nodepath().default.resolve(root, file);
        file = await _nodefs().default.promises.realpath(file);
        // Cannot be accessed using Metro's server API, we need to move the file
        // into the project root and try again.
        if ((0, _dir.isPathInside)(file, root)) {
            return file;
        } else {
            return null;
        }
    } catch  {
        return null;
    }
};

//# sourceMappingURL=createMetroMiddleware.js.map