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
    get DOM_COMPONENTS_BUNDLE_DIR () {
        return DOM_COMPONENTS_BUNDLE_DIR;
    },
    get createDomComponentsMiddleware () {
        return createDomComponentsMiddleware;
    },
    get getDomComponentHtml () {
        return getDomComponentHtml;
    }
});
function _paths() {
    const data = require("@expo/config/paths");
    _paths = function() {
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
function _resolvefrom() {
    const data = /*#__PURE__*/ _interop_require_default(require("resolve-from"));
    _resolvefrom = function() {
        return data;
    };
    return data;
}
const _domPolyfills = require("./domPolyfills");
const _metroOptions = require("./metroOptions");
const _filePath = require("../../../utils/filePath");
const _createServerComponentsMiddleware = require("../metro/createServerComponentsMiddleware");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const DOM_COMPONENTS_BUNDLE_DIR = 'www.bundle';
function createDomComponentsMiddleware({ projectRoot }, instanceMetroOptions) {
    return (req, res, next)=>{
        if (!req.url) return next();
        const url = coerceUrl(req.url);
        // Match `/_expo/@dom`.
        // This URL can contain additional paths like `/_expo/@dom/foo.js?file=...` to help the Safari dev tools.
        if (!url.pathname.startsWith('/_expo/@dom')) {
            return next();
        }
        const file = url.searchParams.get('file');
        if (!file || !file.startsWith('file://')) {
            res.statusCode = 400;
            res.statusMessage = 'Invalid file path: ' + file;
            return res.end();
        }
        // NOTE(@kitten): Keep in sync with `src/export/exportDomComponents.ts`
        // Generate a unique entry file for the webview.
        const virtualEntry = (0, _resolvefrom().default)(projectRoot, 'expo/dom/entry.js');
        const generatedEntryPath = _path().default.resolve(file.startsWith('file://') ? (0, _createServerComponentsMiddleware.fileURLToFilePath)(file) : file);
        // The relative import path will be used like URI so it must be POSIX.
        const relativeImport = './' + (0, _filePath.toPosixPath)(_path().default.relative(_path().default.dirname(virtualEntry), generatedEntryPath));
        // Create the script URL
        const requestUrlBase = `http://${req.headers.host}`;
        // NOTE(@kitten): Keep in sync with `src/export/exportDomComponents.ts`
        const metroUrl = new URL((0, _metroOptions.createBundleUrlPath)({
            ...instanceMetroOptions,
            domRoot: encodeURI(relativeImport),
            baseUrl: '/',
            mainModuleName: (0, _paths().convertEntryPointToRelative)(projectRoot, virtualEntry),
            bytecode: false,
            platform: 'web',
            isExporting: false,
            engine: 'hermes',
            // Required for ensuring bundler errors are caught in the root entry / async boundary and can be recovered from automatically.
            lazy: true
        }), requestUrlBase).toString();
        res.statusCode = 200;
        // Return HTML file
        res.setHeader('Content-Type', 'text/html');
        res.end(// Create the entry HTML file.
        getDomComponentHtml(metroUrl, {
            title: _path().default.basename(file)
        }));
    };
}
function coerceUrl(url) {
    try {
        return new URL(url);
    } catch  {
        return new URL(url, 'https://localhost:0');
    }
}
function getDomComponentHtml(src, { title } = {}) {
    // This HTML is not optimized for `react-native-web` since DOM Components are meant for general React DOM web development.
    return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        ${title ? `<title>${title}</title>` : ''}
        <style id="expo-dom-component-style">
        /* These styles make the body full-height */
        html,
        body {
          -webkit-overflow-scrolling: touch; /* Enables smooth momentum scrolling */
        }
        /* These styles make the root element full-height */
        #root {
          display: flex;
          flex: 1;
        }
        </style>
    </head>
    <body>
    <noscript>DOM Components require <code>javaScriptEnabled</code></noscript>
        <!-- Root element for the DOM component. -->
        <div id="root"></div>
        <script>${_domPolyfills.DOM_POLYFILLS_SCRIPT}</script>
        <script>
          var injectedObject = {};
          try {
            injectedObject = JSON.parse(window.ReactNativeWebView.injectedObjectJson());
          } catch (e) {
            throw new Error('Failed to parse injectedObjectJson: ' + e.message);
          }
          window.$$EXPO_DOM_HOST_OS = injectedObject.EXPO_DOM_HOST_OS;
          window.$$EXPO_INITIAL_PROPS = injectedObject.initialProps;
        </script>
        ${src ? `<script crossorigin src="${src.replace(/^https?:/, '')}"></script>` : ''}
    </body>
</html>`;
}

//# sourceMappingURL=DomComponentsMiddleware.js.map