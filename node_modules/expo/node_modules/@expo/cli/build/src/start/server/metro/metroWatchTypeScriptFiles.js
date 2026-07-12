"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "metroWatchTypeScriptFiles", {
    enumerable: true,
    get: function() {
        return metroWatchTypeScriptFiles;
    }
});
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
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
const debug = require('debug')('expo:start:server:metro:metroWatchTypeScriptFiles');
function metroWatchTypeScriptFiles({ metro, server, projectRoot, callback, tsconfig = false, throttle = false, eventTypes = [
    'add',
    'change',
    'delete'
] }) {
    // TODO(@kitten): Having both this and `./waitForMetroToObserveTypeScriptFile.ts` is pointless
    // These are both too specialised. This is also an overeager abstraction over a specific pattern
    // rather than generically wrapping the watcher's own listener with a constant interface
    // TODO(@kitten): This is highly inefficient. We shouldn't watch all changes to determine this
    // and instead use startup heuristic and do a pre-bundling check
    const watcher = metro.getBundler().getBundler().getWatcher();
    // TODO(@kitten): This is incorrect since it won't cover everything and also duplicates `configWatcher`
    // in `./withMetroMultiPlatform.ts`
    const tsconfigPath = _path().default.join(projectRoot, 'tsconfig.json');
    const watchAdd = eventTypes.includes('add');
    const watchChange = eventTypes.includes('change');
    const watchDelete = eventTypes.includes('delete');
    const listener = ({ changes })=>{
        const isQualifiedChange = (change)=>{
            if (/node_modules/.test(change[0])) {
                return false;
            } else if (/\.d\.ts$/.test(change[0])) {
                return false;
            } else if (// If the user adds a TypeScript file to the observable files in their project.
            /\.tsx?$/.test(change[0]) || // Or if the user adds a tsconfig.json file to the project root.
            tsconfig && change[0] === tsconfigPath) {
                return true;
            } else {
                return false;
            }
        };
        if (watchAdd) {
            for (const change of changes.addedFiles){
                if (isQualifiedChange(change)) {
                    debug('Detected TypeScript file changed in the project: ', change[0]);
                    callback(change[0], 'add');
                    if (throttle) return;
                }
            }
        }
        if (watchChange) {
            for (const change of changes.modifiedFiles){
                if (isQualifiedChange(change)) {
                    debug('Detected TypeScript file changed in the project: ', change[0]);
                    callback(change[0], 'change');
                    if (throttle) return;
                }
            }
        }
        if (watchDelete) {
            for (const change of changes.removedFiles){
                if (isQualifiedChange(change)) {
                    debug('Detected TypeScript file changed in the project: ', change[0]);
                    callback(change[0], 'delete');
                    if (throttle) return;
                }
            }
        }
    };
    debug('Waiting for TypeScript files to be added to the project...');
    watcher.addListener('change', listener);
    watcher.addListener('add', listener);
    const off = ()=>{
        watcher.removeListener('change', listener);
        watcher.removeListener('add', listener);
    };
    server.addListener == null ? void 0 : server.addListener.call(server, 'close', off);
    return off;
}

//# sourceMappingURL=metroWatchTypeScriptFiles.js.map