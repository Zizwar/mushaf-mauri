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
    get observeAnyFileChanges () {
        return observeAnyFileChanges;
    },
    get observeFileChanges () {
        return observeFileChanges;
    },
    get waitForMetroToObserveTypeScriptFile () {
        return waitForMetroToObserveTypeScriptFile;
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
const debug = require('debug')('expo:start:server:metro:waitForTypescript');
function waitForMetroToObserveTypeScriptFile(projectRoot, runner, callback) {
    // TODO(@kitten): This is highly inefficient. We shouldn't watch all changes to determine this
    // and instead use startup heuristic and do a pre-bundling check
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const tsconfigPath = _path().default.join(projectRoot, 'tsconfig.json');
    const listener = ({ changes })=>{
        for (const change of changes.addedFiles){
            if (/node_modules/.test(change[0])) {
                continue;
            } else if (/\.tsx?$/.test(change[0]) || change[0] === tsconfigPath) {
                // If the user adds a TypeScript file to the observable files in their project.
                debug('Detected TypeScript file added to the project: ', change[0]);
                callback();
                off();
                return;
            }
        }
    };
    debug('Waiting for TypeScript files to be added to the project...');
    watcher.addListener('change', listener);
    const off = ()=>{
        watcher.removeListener('change', listener);
    };
    runner.server.addListener == null ? void 0 : runner.server.addListener.call(runner.server, 'close', off);
    return off;
}
function observeFileChanges(runner, files, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const watchFilePaths = new Set(files);
    const listener = ({ changes })=>{
        for (const change of changes.addedFiles){
            if (/node_modules/.test(change[0])) {
                continue;
            } else if (watchFilePaths.has(change[0])) {
                debug('Observed change:', change[0]);
                callback();
                return;
            }
        }
        for (const change of changes.modifiedFiles){
            if (/node_modules/.test(change[0])) {
                continue;
            } else if (watchFilePaths.has(change[0])) {
                debug('Observed change:', change[0]);
                callback();
                return;
            }
        }
    };
    debug('Watching file changes:', files);
    watcher.addListener('change', listener);
    const off = ()=>{
        watcher.removeListener('change', listener);
    };
    runner.server.addListener == null ? void 0 : runner.server.addListener.call(runner.server, 'close', off);
    return off;
}
function observeAnyFileChanges(runner, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const listener = (event)=>{
        callback(event);
    };
    watcher.addListener('change', listener);
    const off = ()=>{
        watcher.removeListener('change', listener);
    };
    runner.server.addListener == null ? void 0 : runner.server.addListener.call(runner.server, 'close', off);
    return off;
}

//# sourceMappingURL=waitForMetroToObserveTypeScriptFile.js.map