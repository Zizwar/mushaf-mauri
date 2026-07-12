/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalAppDataPath = exports.toWinDirFormat = exports.makeTmpDir = exports.getPlatform = exports.EdgeNotInstalledError = exports.UnsupportedPlatformError = exports.InvalidUserDataDirectoryError = exports.EdgePathNotSetError = exports.LauncherError = exports.delay = exports.defaults = void 0;
const path_1 = require("path");
const child_process_1 = require("child_process");
const mkdirp = require("mkdirp");
const isWsl = require("is-wsl");
function defaults(val, def) {
    return typeof val === 'undefined' ? def : val;
}
exports.defaults = defaults;
function delay(time) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, time));
    });
}
exports.delay = delay;
class LauncherError extends Error {
    constructor(message = 'Unexpected error', code) {
        super();
        this.message = message;
        this.code = code;
        this.stack = new Error().stack;
        return this;
    }
}
exports.LauncherError = LauncherError;
class EdgePathNotSetError extends LauncherError {
    constructor() {
        super(...arguments);
        this.message = 'The EDGE_PATH environment variable must be set to a Edge/Chromium executable no older than Edge stable.';
        this.code = "ERR_LAUNCHER_PATH_NOT_SET" /* LaunchErrorCodes.ERR_LAUNCHER_PATH_NOT_SET */;
    }
}
exports.EdgePathNotSetError = EdgePathNotSetError;
class InvalidUserDataDirectoryError extends LauncherError {
    constructor() {
        super(...arguments);
        this.message = 'userDataDir must be false or a path.';
        this.code = "ERR_LAUNCHER_INVALID_USER_DATA_DIRECTORY" /* LaunchErrorCodes.ERR_LAUNCHER_INVALID_USER_DATA_DIRECTORY */;
    }
}
exports.InvalidUserDataDirectoryError = InvalidUserDataDirectoryError;
class UnsupportedPlatformError extends LauncherError {
    constructor() {
        super(...arguments);
        this.message = `Platform ${getPlatform()} is not supported.`;
        this.code = "ERR_LAUNCHER_UNSUPPORTED_PLATFORM" /* LaunchErrorCodes.ERR_LAUNCHER_UNSUPPORTED_PLATFORM */;
    }
}
exports.UnsupportedPlatformError = UnsupportedPlatformError;
class EdgeNotInstalledError extends LauncherError {
    constructor() {
        super(...arguments);
        this.message = 'No Edge installations found.';
        this.code = "ERR_LAUNCHER_NOT_INSTALLED" /* LaunchErrorCodes.ERR_LAUNCHER_NOT_INSTALLED */;
    }
}
exports.EdgeNotInstalledError = EdgeNotInstalledError;
function getPlatform() {
    return isWsl ? 'wsl' : process.platform;
}
exports.getPlatform = getPlatform;
function makeTmpDir() {
    switch (getPlatform()) {
        case 'darwin':
        case 'linux':
            return makeUnixTmpDir();
        case 'wsl':
            // We populate the user's Windows temp dir so the folder is correctly created later
            process.env.TEMP = getLocalAppDataPath(`${process.env.PATH}`);
        case 'win32':
            return makeWin32TmpDir();
        default:
            throw new UnsupportedPlatformError();
    }
}
exports.makeTmpDir = makeTmpDir;
function toWinDirFormat(dir = '') {
    const results = /\/mnt\/([a-z])\//.exec(dir);
    if (!results) {
        return dir;
    }
    const driveLetter = results[1];
    return dir.replace(`/mnt/${driveLetter}/`, `${driveLetter.toUpperCase()}:\\`)
        .replace(/\//g, '\\');
}
exports.toWinDirFormat = toWinDirFormat;
function getLocalAppDataPath(path) {
    const userRegExp = /\/mnt\/([a-z])\/Users\/([^\/:]+)\/AppData\//;
    const results = userRegExp.exec(path) || [];
    return `/mnt/${results[1]}/Users/${results[2]}/AppData/Local`;
}
exports.getLocalAppDataPath = getLocalAppDataPath;
function makeUnixTmpDir() {
    return (0, child_process_1.execSync)('mktemp -d -t lighthouse.XXXXXXX').toString().trim();
}
function makeWin32TmpDir() {
    const winTmpPath = process.env.TEMP || process.env.TMP ||
        (process.env.SystemRoot || process.env.windir) + '\\temp';
    const randomNumber = Math.floor(Math.random() * 9e7 + 1e7);
    const tmpdir = (0, path_1.join)(winTmpPath, 'lighthouse.' + randomNumber);
    mkdirp.sync(tmpdir);
    return tmpdir;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUNILFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0FBRWIsK0JBQTBCO0FBQzFCLGlEQUF1QztBQUN2QyxpQ0FBaUM7QUFDakMsZ0NBQWlDO0FBU2pDLFNBQWdCLFFBQVEsQ0FBSSxHQUFnQixFQUFFLEdBQU07SUFDbEQsT0FBTyxPQUFPLEdBQUcsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ2hELENBQUM7QUFGRCw0QkFFQztBQUVELFNBQXNCLEtBQUssQ0FBQyxJQUFZOztRQUN0QyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7Q0FBQTtBQUZELHNCQUVDO0FBRUQsTUFBYSxhQUFjLFNBQVEsS0FBSztJQUN0QyxZQUFtQixVQUFrQixrQkFBa0IsRUFBUyxJQUFhO1FBQzNFLEtBQUssRUFBRSxDQUFDO1FBRFMsWUFBTyxHQUFQLE9BQU8sQ0FBNkI7UUFBUyxTQUFJLEdBQUosSUFBSSxDQUFTO1FBRTNFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDL0IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFORCxzQ0FNQztBQUVELE1BQWEsbUJBQW9CLFNBQVEsYUFBYTtJQUF0RDs7UUFDRSxZQUFPLEdBQ0gseUdBQXlHLENBQUM7UUFDOUcsU0FBSSxnRkFBOEM7SUFDcEQsQ0FBQztDQUFBO0FBSkQsa0RBSUM7QUFFRCxNQUFhLDZCQUE4QixTQUFRLGFBQWE7SUFBaEU7O1FBQ0UsWUFBTyxHQUFHLHNDQUFzQyxDQUFDO1FBQ2pELFNBQUksOEdBQTZEO0lBQ25FLENBQUM7Q0FB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