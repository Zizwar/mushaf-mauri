/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.win32 = exports.wsl = exports.linux = exports.darwin = exports.darwinFast = void 0;
const fs = require("fs");
const path = require("path");
const os_1 = require("os");
const child_process_1 = require("child_process");
const escapeRegExp = require("escape-string-regexp");
const log = require('lighthouse-logger');
const utils_1 = require("./utils");
const newLineRegex = /\r?\n/;
/**
 * check for MacOS default app paths first to avoid waiting for the slow lsregister command
 */
function darwinFast() {
    const priorityOptions = [
        process.env.EDGE_PATH,
        process.env.LIGHTHOUSE_CHROMIUM_PATH,
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    for (const edgePath of priorityOptions) {
        if (edgePath && canAccess(edgePath))
            return edgePath;
    }
    return darwin()[0];
}
exports.darwinFast = darwinFast;
function darwin() {
    const suffixes = ['/Contents/MacOS/Google Edge'];
    const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
        '/Versions/A/Frameworks/LaunchServices.framework' +
        '/Versions/A/Support/lsregister';
    const installations = [];
    const customEdgePath = resolveEdgePath();
    if (customEdgePath) {
        installations.push(customEdgePath);
    }
    (0, child_process_1.execSync)(`${LSREGISTER} -dump` +
        ' | grep -i \'microsoft edge\\?\\.app\'' +
        ' | awk \'{$1=""; print $0}\'')
        .toString()
        .split(newLineRegex)
        .forEach((inst) => {
        suffixes.forEach(suffix => {
            const execPath = path.join(inst.substring(0, inst.indexOf('.app') + 4).trim(), suffix);
            if (canAccess(execPath) && installations.indexOf(execPath) === -1) {
                installations.push(execPath);
            }
        });
    });
    // Retains one per line to maintain readability.
    // clang-format off
    const home = escapeRegExp(process.env.HOME || (0, os_1.homedir)());
    const priorities = [
        { regex: new RegExp(`^${home}/Applications/.*Edge\\.app`), weight: 50 },
        { regex: /^\/Applications\/.*Edge.app/, weight: 100 },
        { regex: /^\/Volumes\/.*Edge.app/, weight: -2 },
    ];
    if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH)), weight: 150 });
    }
    if (process.env.EDGE_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.EDGE_PATH)), weight: 151 });
    }
    // clang-format on
    return sort(installations, priorities);
}
exports.darwin = darwin;
function resolveEdgePath() {
    if (canAccess(process.env.EDGE_PATH)) {
        return process.env.EDGE_PATH;
    }
    if (canAccess(process.env.LIGHTHOUSE_CHROMIUM_PATH)) {
        log.warn('EdgeLauncher', 'LIGHTHOUSE_CHROMIUM_PATH is deprecated, use EDGE_PATH env variable instead.');
        return process.env.LIGHTHOUSE_CHROMIUM_PATH;
    }
    return undefined;
}
/**
 * Look for linux executables in 3 ways
 * 1. Look into EDGE_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for microsoft-edge-stable & microsoft-edge executables by using the which command
 */
function linux() {
    let installations = [];
    // 1. Look into EDGE_PATH env variable
    const customEdgePath = resolveEdgePath();
    if (customEdgePath) {
        installations.push(customEdgePath);
    }
    // 2. Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
        path.join((0, os_1.homedir)(), '.local/share/applications/'),
        '/usr/share/applications/',
    ];
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findEdgeExecutables(folder));
    });
    // Look for microsoft-edge(-stable) & chromium(-browser) executables by using the which command
    const executables = [
        'microsoft-edge-stable',
        'microsoft-edge',
        'chromium-browser',
        'chromium',
    ];
    executables.forEach((executable) => {
        try {
            const edgePath = (0, child_process_1.execFileSync)('which', [executable], { stdio: 'pipe' }).toString().split(newLineRegex)[0];
            if (canAccess(edgePath)) {
                installations.push(edgePath);
            }
        }
        catch (e) {
            // Not installed.
        }
    });
    if (!installations.length) {
        throw new utils_1.EdgePathNotSetError();
    }
    const priorities = [
        { regex: /edge-wrapper$/, weight: 51 },
        { regex: /microsoft-edge-stable$/, weight: 50 },
        { regex: /microsoft-edge$/, weight: 49 },
        { regex: /edge-browser$/, weight: 48 },
        { regex: /edge$/, weight: 47 },
    ];
    if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH)), weight: 100 });
    }
    if (process.env.EDGE_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.EDGE_PATH)), weight: 101 });
    }
    return sort(uniq(installations.filter(Boolean)), priorities);
}
exports.linux = linux;
function wsl() {
    // Manually populate the environment variables assuming it's the default config
    process.env.LOCALAPPDATA = (0, utils_1.getLocalAppDataPath)(`${process.env.PATH}`);
    process.env.PROGRAMFILES = '/mnt/c/Program Files';
    process.env['PROGRAMFILES(X86)'] = '/mnt/c/Program Files (x86)';
    return win32();
}
exports.wsl = wsl;
function win32() {
    const installations = [];
    const suffixes = [
        `${path.sep}Microsoft${path.sep}Edge SxS${path.sep}Application${path.sep}msedge.exe`,
        `${path.sep}Microsoft${path.sep}Edge${path.sep}Application${path.sep}msedge.exe`
    ];
    const prefixes = [
        process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']
    ].filter(Boolean);
    const customEdgePath = resolveEdgePath();
    if (customEdgePath) {
        installations.push(customEdgePath);
    }
    prefixes.forEach(prefix => suffixes.forEach(suffix => {
        const edgePath = path.join(prefix, suffix);
        if (canAccess(edgePath)) {
            installations.push(edgePath);
        }
    }));
    return installations;
}
exports.win32 = win32;
function sort(installations, priorities) {
    const defaultPriority = 10;
    return installations
        // assign priorities
        .map((inst) => {
        for (const pair of priorities) {
            if (pair.regex.test(inst)) {
                return { path: inst, weight: pair.weight };
            }
        }
        return { path: inst, weight: defaultPriority };
    })
        // sort based on priorities
        .sort((a, b) => (b.weight - a.weight))
        // remove priority flag
        .map(pair => pair.path);
}
function canAccess(file) {
    if (!file) {
        return false;
    }
    try {
        fs.accessSync(file);
        return true;
    }
    catch (e) {
        return false;
    }
}
function uniq(arr) {
    return Array.from(new Set(arr));
}
function findEdgeExecutables(folder) {
    const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
    const edgeExecRegex = '^Exec=\/.*\/(microsoft-edge|edge)-.*';
    let installations = [];
    if (canAccess(folder)) {
        // Output of the grep & print looks like:
        //    /opt/google/edge/microsoft-edge --profile-directory
        //    /home/user/Downloads/edge-linux/edge-wrapper %U
        let execPaths;
        // Some systems do not support grep -R so fallback to -r.
        // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
        try {
            execPaths = (0, child_process_1.execSync)(`grep -ER "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' });
        }
        catch (e) {
            execPaths = (0, child_process_1.execSync)(`grep -Er "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' });
        }
        execPaths = execPaths.toString()
            .split(newLineRegex)
            .map((execPath) => execPath.replace(argumentsRegex, '$1'));
        execPaths.forEach((execPath) => canAccess(execPath) && installations.push(execPath));
    }
    return installations;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZS1maW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZWRnZS1maW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUNILFlBQVksQ0FBQzs7O0FBRWIseUJBQTBCO0FBQzFCLDZCQUE4QjtBQUM5QiwyQkFBMkI7QUFDM0IsaURBQXFEO0FBQ3JELHFEQUFzRDtBQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV6QyxtQ0FBaUU7QUFFakUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBSTdCOztHQUVHO0FBQ0gsU0FBZ0IsVUFBVTtJQUN4QixNQUFNLGVBQWUsR0FBNEI7UUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO1FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCO1FBQ3BDLGdFQUFnRTtLQUNqRSxDQUFDO0lBRUYsS0FBSyxNQUFNLFFBQVEsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUN2QyxJQUFJLFFBQVEsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQUUsT0FBTyxRQUFRLENBQUM7SUFDdkQsQ0FBQztJQUVELE9BQU8sTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDcEIsQ0FBQztBQVpELGdDQVlDO0FBRUQsU0FBZ0IsTUFBTTtJQUNwQixNQUFNLFFBQVEsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFFakQsTUFBTSxVQUFVLEdBQUcsbURBQW1EO1FBQ2xFLGlEQUFpRDtRQUNqRCxnQ0FBZ0MsQ0FBQztJQUVyQyxNQUFNLGFBQWEsR0FBa0IsRUFBRSxDQUFDO0lBRXhDLE1BQU0sY0FBYyxHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQ3pDLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbkIsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsSUFBQSx3QkFBUSxFQUNKLEdBQUcsVUFBVSxRQUFRO1FBQ3JCLHdDQUF3QztRQUN4Qyw4QkFBOEIsQ0FBQztTQUM5QixRQUFRLEVBQUU7U0FDVixLQUFLLENBQUMsWUFBWSxDQUFDO1NBQ25CLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3hCLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZGLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUdQLGdEQUFnRDtJQUNoRCxtQkFBbUI7SUFDbkIsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUEsWUFBTyxHQUFFLENBQUMsQ0FBQztJQUN6RCxNQUFNLFVBQVUsR0FBZTtRQUM3QixFQUFDLEtBQUssRUFBRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksNEJBQTRCLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDO1FBQ3JFLEVBQUMsS0FBSyxFQUFFLDZCQUE2QixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUM7UUFDbkQsRUFBQyxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFDO0tBQzlDLENBQUM7SUFFRixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUN6QyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztJQUMzRyxDQUFDO0lBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFCLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBakRELHdCQWlEQztBQUVELFNBQVMsZUFBZTtJQUN0QixJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDckMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7UUFDcEQsR0FBRyxDQUFDLElBQUksQ0FDSixjQUFjLEVBQ2QsNkVBQTZFLENBQUMsQ0FBQztRQUNuRixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUM7SUFDOUMsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLEtBQUs7SUFDbkIsSUFBSSxhQUFhLEdBQWEsRUFBRSxDQUFDO0lBRWpDLHNDQUFzQztJQUN0QyxNQUFNLGNBQWMsR0FBRyxlQUFlLEVBQUUsQ0FBQztJQUN6QyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ25CLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELGdGQUFnRjtJQUNoRixNQUFNLDBCQUEwQixHQUFHO1FBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxZQUFPLEdBQUUsRUFBRSw0QkFBNEIsQ0FBQztRQUNsRCwwQkFBMEI7S0FDM0IsQ0FBQztJQUNGLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUMxQyxhQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUMsQ0FBQyxDQUFDO0lBRUgsK0ZBQStGO0lBQy9GLE1BQU0sV0FBVyxHQUFHO1FBQ2xCLHVCQUF1QjtRQUN2QixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLFVBQVU7S0FDWCxDQUFDO0lBQ0YsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQWtCLEVBQUUsRUFBRTtRQUN6QyxJQUFJLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FDVixJQUFBLDRCQUFZLEVBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0YsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWCxpQkFBaUI7UUFDbkIsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMxQixNQUFNLElBQUksMkJBQW1CLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQWU7UUFDN0IsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUM7UUFDcEMsRUFBQyxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBQztRQUM3QyxFQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDO1FBQ3RDLEVBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDO1FBQ3BDLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDO0tBQzdCLENBQUM7SUFFRixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUN6QyxVQUFVLENBQUMsT0FBTyxDQUNkLEVBQUMsS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFCLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBNURELHNCQTREQztBQUVELFNBQWdCLEdBQUc7SUFDakIsK0VBQStFO0lBQy9FLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLElBQUEsMkJBQW1CLEVBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsc0JBQXNCLENBQUM7SUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLDRCQUE0QixDQUFDO0lBRWhFLE9BQU8sS0FBSyxFQUFFLENBQUM7QUFDakIsQ0FBQztBQVBELGtCQU9DO0FBRUQsU0FBZ0IsS0FBSztJQUNuQixNQUFNLGFBQWEsR0FBa0IsRUFBRSxDQUFDO0lBQ3hDLE1BQU0sUUFBUSxHQUFHO1FBQ2YsR0FBRyxJQUFJLENBQUMsR0FBRyxZQUFZLElBQUksQ0FBQyxHQUFHLFdBQVcsSUFBSSxDQUFDLEdBQUcsY0FBYyxJQUFJLENBQUMsR0FBRyxZQUFZO1FBQ3BGLEdBQUcsSUFBSSxDQUFDLEdBQUcsWUFBWSxJQUFJLENBQUMsR0FBRyxPQUFPLElBQUksQ0FBQyxHQUFHLGNBQWMsSUFBSSxDQUFDLEdBQUcsWUFBWTtLQUNqRixDQUFDO0lBQ0YsTUFBTSxRQUFRLEdBQUc7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0tBQ3JGLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBYSxDQUFDO0lBRTlCLE1BQU0sY0FBYyxHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQ3pDLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbkIsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0MsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN4QixhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ0osT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQXRCRCxzQkFzQkM7QUFFRCxTQUFTLElBQUksQ0FBQyxhQUF1QixFQUFFLFVBQXNCO0lBQzNELE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUMzQixPQUFPLGFBQWE7UUFDaEIsb0JBQW9CO1NBQ25CLEdBQUcsQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3BCLEtBQUssTUFBTSxJQUFJLElBQUksVUFBVSxFQUFFLENBQUM7WUFDOUIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBQyxDQUFDO1lBQzNDLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBQyxDQUFDO0lBQy9DLENBQUMsQ0FBQztRQUNGLDJCQUEyQjtTQUMxQixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLHVCQUF1QjtTQUN0QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLElBQXNCO0lBQ3ZDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNWLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLElBQUksQ0FBQyxHQUFlO0lBQzNCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLE1BQWM7SUFDekMsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLENBQUMsd0NBQXdDO0lBQzdFLE1BQU0sYUFBYSxHQUFHLHNDQUFzQyxDQUFDO0lBRTdELElBQUksYUFBYSxHQUFrQixFQUFFLENBQUM7SUFDdEMsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUN0Qix5Q0FBeUM7UUFDekMseURBQXlEO1FBQ3pELHFEQUFxRDtRQUNyRCxJQUFJLFNBQVMsQ0FBQztRQUVkLHlEQUF5RDtRQUN6RCxrRkFBa0Y7UUFDbEYsSUFBSSxDQUFDO1lBQ0gsU0FBUyxHQUFHLElBQUEsd0JBQVEsRUFDaEIsYUFBYSxhQUFhLEtBQUssTUFBTSw0QkFBNEIsRUFBRSxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1gsU0FBUyxHQUFHLElBQUEsd0JBQVEsRUFDaEIsYUFBYSxhQUFhLEtBQUssTUFBTSw0QkFBNEIsRUFBRSxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRCxTQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsRUFBRTthQUNmLEtBQUssQ0FBQyxZQUFZLENBQUM7YUFDbkIsR0FBRyxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVuRixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMvRixDQUFDO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQyJ9