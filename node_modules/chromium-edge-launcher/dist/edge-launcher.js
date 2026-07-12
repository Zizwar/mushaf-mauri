/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
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
exports.killAll = exports.launch = exports.Launcher = void 0;
const childProcess = require("child_process");
const fs = require("fs");
const net = require("net");
const edgeFinder = require("./edge-finder");
const random_port_1 = require("./random-port");
const flags_1 = require("./flags");
const utils_1 = require("./utils");
const log = require('lighthouse-logger');
const spawn = childProcess.spawn;
const execSync = childProcess.execSync;
const isWsl = (0, utils_1.getPlatform)() === 'wsl';
const isWindows = (0, utils_1.getPlatform)() === 'win32';
const _SIGINT = 'SIGINT';
const _SIGINT_EXIT_CODE = 130;
const _SUPPORTED_PLATFORMS = new Set(['darwin', 'linux', 'win32', 'wsl']);
const instances = new Set();
const sigintListener = () => __awaiter(void 0, void 0, void 0, function* () {
    yield killAll();
    process.exit(_SIGINT_EXIT_CODE);
});
function launch() {
    return __awaiter(this, arguments, void 0, function* (opts = {}) {
        opts.handleSIGINT = (0, utils_1.defaults)(opts.handleSIGINT, true);
        const instance = new Launcher(opts);
        // Kill spawned Edge process in case of ctrl-C.
        if (opts.handleSIGINT && instances.size === 0) {
            process.on(_SIGINT, sigintListener);
        }
        instances.add(instance);
        yield instance.launch();
        const kill = () => __awaiter(this, void 0, void 0, function* () {
            instances.delete(instance);
            if (instances.size === 0) {
                process.removeListener(_SIGINT, sigintListener);
            }
            return instance.kill();
        });
        return { pid: instance.pid, port: instance.port, kill, process: instance.edge };
    });
}
exports.launch = launch;
function killAll() {
    return __awaiter(this, void 0, void 0, function* () {
        let errors = [];
        for (const instance of instances) {
            try {
                yield instance.kill();
                // only delete if kill did not error
                // this means erroring instances remain in the Set
                instances.delete(instance);
            }
            catch (err) {
                errors.push(err);
            }
        }
        return errors;
    });
}
exports.killAll = killAll;
class Launcher {
    constructor(opts = {}, moduleOverrides = {}) {
        this.opts = opts;
        this.tmpDirandPidFileReady = false;
        this.fs = moduleOverrides.fs || fs;
        this.spawn = moduleOverrides.spawn || spawn;
        log.setLevel((0, utils_1.defaults)(this.opts.logLevel, 'silent'));
        // choose the first one (default)
        this.startingUrl = (0, utils_1.defaults)(this.opts.startingUrl, 'about:blank');
        this.edgeFlags = (0, utils_1.defaults)(this.opts.edgeFlags, []);
        this.requestedPort = (0, utils_1.defaults)(this.opts.port, 0);
        this.edgePath = this.opts.edgePath;
        this.ignoreDefaultFlags = (0, utils_1.defaults)(this.opts.ignoreDefaultFlags, false);
        this.connectionPollInterval = (0, utils_1.defaults)(this.opts.connectionPollInterval, 500);
        this.maxConnectionRetries = (0, utils_1.defaults)(this.opts.maxConnectionRetries, 50);
        this.envVars = (0, utils_1.defaults)(opts.envVars, Object.assign({}, process.env));
        if (typeof this.opts.userDataDir === 'boolean') {
            if (!this.opts.userDataDir) {
                this.useDefaultProfile = true;
                this.userDataDir = undefined;
            }
            else {
                throw new utils_1.InvalidUserDataDirectoryError();
            }
        }
        else {
            this.useDefaultProfile = false;
            this.userDataDir = this.opts.userDataDir;
        }
    }
    get flags() {
        const flags = this.ignoreDefaultFlags ? [] : flags_1.DEFAULT_FLAGS.slice();
        flags.push(`--remote-debugging-port=${this.port}`);
        if (!this.ignoreDefaultFlags && (0, utils_1.getPlatform)() === 'linux') {
            flags.push('--disable-setuid-sandbox');
        }
        if (!this.useDefaultProfile) {
            // Place Edge profile in a custom location we'll rm -rf later
            // If in WSL, we need to use the Windows format
            flags.push(`--user-data-dir=${isWsl ? (0, utils_1.toWinDirFormat)(this.userDataDir) : this.userDataDir}`);
        }
        flags.push(...this.edgeFlags);
        flags.push(this.startingUrl);
        return flags;
    }
    static defaultFlags() {
        return flags_1.DEFAULT_FLAGS.slice();
    }
    /** Returns the highest priority edge installation. */
    static getFirstInstallation() {
        if ((0, utils_1.getPlatform)() === 'darwin')
            return edgeFinder.darwinFast();
        return edgeFinder[(0, utils_1.getPlatform)()]()[0];
    }
    // Wrapper function to enable easy testing.
    makeTmpDir() {
        return (0, utils_1.makeTmpDir)();
    }
    prepare() {
        const platform = (0, utils_1.getPlatform)();
        if (!_SUPPORTED_PLATFORMS.has(platform)) {
            throw new utils_1.UnsupportedPlatformError();
        }
        this.userDataDir = this.userDataDir || this.makeTmpDir();
        this.outFile = this.fs.openSync(`${this.userDataDir}/edge-out.log`, 'a');
        this.errFile = this.fs.openSync(`${this.userDataDir}/edge-err.log`, 'a');
        // fix for Node4
        // you can't pass a fd to fs.writeFileSync
        this.pidFile = `${this.userDataDir}/edge.pid`;
        log.verbose('EdgeLauncher', `created ${this.userDataDir}`);
        this.tmpDirandPidFileReady = true;
    }
    launch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.requestedPort !== 0) {
                this.port = this.requestedPort;
                // If an explict port is passed first look for an open connection...
                try {
                    return yield this.isDebuggerReady();
                }
                catch (err) {
                    log.log('EdgeLauncher', `No debugging port found on port ${this.port}, launching a new Edge.`);
                }
            }
            if (this.edgePath === undefined) {
                const installation = Launcher.getFirstInstallation();
                if (!installation) {
                    throw new utils_1.EdgeNotInstalledError();
                }
                this.edgePath = installation;
            }
            if (!this.tmpDirandPidFileReady) {
                this.prepare();
            }
            this.pid = yield this.spawnProcess(this.edgePath);
            return Promise.resolve();
        });
    }
    spawnProcess(execPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const spawnPromise = (() => __awaiter(this, void 0, void 0, function* () {
                if (this.edge) {
                    log.log('EdgeLauncher', `Edge already running with pid ${this.edge.pid}.`);
                    return this.edge.pid;
                }
                // If a zero value port is set, it means the launcher
                // is responsible for generating the port number.
                // We do this here so that we can know the port before
                // we pass it into edge.
                if (this.requestedPort === 0) {
                    this.port = yield (0, random_port_1.getRandomPort)();
                }
                log.verbose('EdgeLauncher', `Launching with command:\n"${execPath}" ${this.flags.join(' ')}`);
                const edge = this.spawn(execPath, this.flags, { detached: true, stdio: ['ignore', this.outFile, this.errFile], env: this.envVars });
                this.edge = edge;
                this.fs.writeFileSync(this.pidFile, edge.pid.toString());
                log.verbose('EdgeLauncher', `Edge running with pid ${edge.pid} on port ${this.port}.`);
                return edge.pid;
            }))();
            const pid = yield spawnPromise;
            yield this.waitUntilReady();
            return pid;
        });
    }
    cleanup(client) {
        if (client) {
            client.removeAllListeners();
            client.end();
            client.destroy();
            client.unref();
        }
    }
    // resolves if ready, rejects otherwise
    isDebuggerReady() {
        return new Promise((resolve, reject) => {
            const client = net.createConnection(this.port);
            client.once('error', err => {
                this.cleanup(client);
                reject(err);
            });
            client.once('connect', () => {
                this.cleanup(client);
                resolve();
            });
        });
    }
    // resolves when debugger is ready, rejects after 10 polls
    waitUntilReady() {
        const launcher = this;
        return new Promise((resolve, reject) => {
            let retries = 0;
            let waitStatus = 'Waiting for browser.';
            const poll = () => {
                if (retries === 0) {
                    log.log('EdgeLauncher', waitStatus);
                }
                retries++;
                waitStatus += '..';
                log.log('EdgeLauncher', waitStatus);
                launcher.isDebuggerReady()
                    .then(() => {
                    log.log('EdgeLauncher', waitStatus + `${log.greenify(log.tick)}`);
                    resolve();
                })
                    .catch(err => {
                    if (retries > launcher.maxConnectionRetries) {
                        log.error('EdgeLauncher', err.message);
                        const stderr = this.fs.readFileSync(`${this.userDataDir}/edge-err.log`, { encoding: 'utf-8' });
                        log.error('EdgeLauncher', `Logging contents of ${this.userDataDir}/edge-err.log`);
                        log.error('EdgeLauncher', stderr);
                        return reject(err);
                    }
                    (0, utils_1.delay)(launcher.connectionPollInterval).then(poll);
                });
            };
            poll();
        });
    }
    kill() {
        return new Promise((resolve, reject) => {
            if (this.edge) {
                this.edge.on('close', () => {
                    delete this.edge;
                    this.destroyTmp().then(resolve);
                });
                log.log('EdgeLauncher', `Killing Edge instance ${this.edge.pid}`);
                try {
                    if (isWindows) {
                        // While pipe is the default, stderr also gets printed to process.stderr
                        // if you don't explicitly set `stdio`
                        execSync(`taskkill /pid ${this.edge.pid} /T /F`, { stdio: 'pipe' });
                    }
                    else {
                        process.kill(-this.edge.pid);
                    }
                }
                catch (err) {
                    const message = `Edge could not be killed ${err.message}`;
                    log.warn('EdgeLauncher', message);
                    reject(new Error(message));
                }
            }
            else {
                // fail silently as we did not start edge
                resolve();
            }
        });
    }
    destroyTmp() {
        return new Promise(resolve => {
            // Only clean up the tmp dir if we created it.
            if (this.userDataDir === undefined || this.opts.userDataDir !== undefined) {
                return resolve();
            }
            if (this.outFile) {
                this.fs.closeSync(this.outFile);
                delete this.outFile;
            }
            if (this.errFile) {
                this.fs.closeSync(this.errFile);
                delete this.errFile;
            }
            this.fs.rmdir(this.userDataDir, { recursive: true }, () => resolve());
        });
    }
}
exports.Launcher = Launcher;
;
exports.default = Launcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZS1sYXVuY2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lZGdlLWxhdW5jaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7QUFDSCxZQUFZLENBQUM7Ozs7Ozs7Ozs7OztBQUViLDhDQUE4QztBQUM5Qyx5QkFBeUI7QUFDekIsMkJBQTJCO0FBQzNCLDRDQUE0QztBQUM1QywrQ0FBNEM7QUFDNUMsbUNBQXNDO0FBQ3RDLG1DQUFpSztBQUVqSyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUN6QyxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUM7QUFDdkMsTUFBTSxLQUFLLEdBQUcsSUFBQSxtQkFBVyxHQUFFLEtBQUssS0FBSyxDQUFDO0FBQ3RDLE1BQU0sU0FBUyxHQUFHLElBQUEsbUJBQVcsR0FBRSxLQUFLLE9BQU8sQ0FBQztBQUM1QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUM7QUFDekIsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7QUFDOUIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFJMUUsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVksQ0FBQztBQTRCdEMsTUFBTSxjQUFjLEdBQUcsR0FBUyxFQUFFO0lBQ2hDLE1BQU0sT0FBTyxFQUFFLENBQUM7SUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQSxDQUFDO0FBRUYsU0FBZSxNQUFNO3lEQUFDLE9BQWdCLEVBQUU7UUFDdEMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV0RCxNQUFNLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVwQywrQ0FBK0M7UUFDL0MsSUFBSSxJQUFJLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFeEIsTUFBTSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFeEIsTUFBTSxJQUFJLEdBQUcsR0FBUyxFQUFFO1lBQ3RCLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0IsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QixPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekIsQ0FBQyxDQUFBLENBQUM7UUFFRixPQUFPLEVBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsSUFBSyxFQUFDLENBQUM7SUFDbkYsQ0FBQztDQUFBO0FBeVNpQix3QkFBTTtBQXZTeEIsU0FBZSxPQUFPOztRQUNwQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3RCLG9DQUFvQztnQkFDcEMsa0RBQWtEO2dCQUNsRCxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdCLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkIsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQUE7QUEwUnlCLDBCQUFPO0FBeFJqQyxNQUFNLFFBQVE7SUFzQlosWUFBb0IsT0FBZ0IsRUFBRSxFQUFFLGtCQUFtQyxFQUFFO1FBQXpELFNBQUksR0FBSixJQUFJLENBQWM7UUFyQjlCLDBCQUFxQixHQUFHLEtBQUssQ0FBQztRQXNCcEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxlQUFlLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDO1FBRTVDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFckQsaUNBQWlDO1FBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDbkMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUEsZ0JBQVEsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV0RSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQy9CLENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLElBQUkscUNBQTZCLEVBQUUsQ0FBQztZQUM1QyxDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQy9CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDM0MsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFZLEtBQUs7UUFDZixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuRSxLQUFLLENBQUMsSUFBSSxDQUFDLDJCQUEyQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVuRCxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUEsbUJBQVcsR0FBRSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQzFELEtBQUssQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzVCLDZEQUE2RDtZQUM3RCwrQ0FBK0M7WUFDL0MsS0FBSyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFBLHNCQUFjLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUU3QixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxNQUFNLENBQUMsWUFBWTtRQUNqQixPQUFPLHFCQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELHNEQUFzRDtJQUN0RCxNQUFNLENBQUMsb0JBQW9CO1FBQ3pCLElBQUksSUFBQSxtQkFBVyxHQUFFLEtBQUssUUFBUTtZQUFFLE9BQU8sVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQy9ELE9BQU8sVUFBVSxDQUFDLElBQUEsbUJBQVcsR0FBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELDJDQUEyQztJQUMzQyxVQUFVO1FBQ1IsT0FBTyxJQUFBLGtCQUFVLEdBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsT0FBTztRQUNMLE1BQU0sUUFBUSxHQUFHLElBQUEsbUJBQVcsR0FBd0IsQ0FBQztRQUNyRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDeEMsTUFBTSxJQUFJLGdDQUF3QixFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDekQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLGVBQWUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXpFLGdCQUFnQjtRQUNoQiwwQ0FBMEM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLFdBQVcsQ0FBQztRQUU5QyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxXQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBRTNELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7SUFDcEMsQ0FBQztJQUVLLE1BQU07O1lBQ1YsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7Z0JBRS9CLG9FQUFvRTtnQkFDcEUsSUFBSSxDQUFDO29CQUNILE9BQU8sTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RDLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDYixHQUFHLENBQUMsR0FBRyxDQUNILGNBQWMsRUFBRSxtQ0FBbUMsSUFBSSxDQUFDLElBQUkseUJBQXlCLENBQUMsQ0FBQztnQkFDN0YsQ0FBQztZQUNILENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ2xCLE1BQU0sSUFBSSw2QkFBcUIsRUFBRSxDQUFDO2dCQUNwQyxDQUFDO2dCQUVELElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDO1lBQy9CLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQixDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7S0FBQTtJQUVhLFlBQVksQ0FBQyxRQUFnQjs7WUFDekMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFTLEVBQUU7Z0JBQy9CLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNkLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGlDQUFpQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7b0JBQzNFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBR0QscURBQXFEO2dCQUNyRCxpREFBaUQ7Z0JBQ2pELHNEQUFzRDtnQkFDdEQsd0JBQXdCO2dCQUN4QixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxJQUFBLDJCQUFhLEdBQUUsQ0FBQztnQkFDcEMsQ0FBQztnQkFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSw2QkFBNkIsUUFBUSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUYsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQ3BCLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO2dCQUN4RixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFFakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBRTFELEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLHlCQUF5QixJQUFJLENBQUMsR0FBRyxZQUFZLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDbEIsQ0FBQyxDQUFBLENBQUMsRUFBRSxDQUFDO1lBRUwsTUFBTSxHQUFHLEdBQUcsTUFBTSxZQUFZLENBQUM7WUFDL0IsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDNUIsT0FBTyxHQUFHLENBQUM7UUFDYixDQUFDO0tBQUE7SUFFTyxPQUFPLENBQUMsTUFBbUI7UUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNYLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNiLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDakIsQ0FBQztJQUNILENBQUM7SUFFRCx1Q0FBdUM7SUFDL0IsZUFBZTtRQUNyQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO2dCQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQixPQUFPLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMERBQTBEO0lBQzFELGNBQWM7UUFDWixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFFdEIsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUMzQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDaEIsSUFBSSxVQUFVLEdBQUcsc0JBQXNCLENBQUM7WUFFeEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxFQUFFO2dCQUNoQixJQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7Z0JBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsVUFBVSxJQUFJLElBQUksQ0FBQztnQkFDbkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXBDLFFBQVEsQ0FBQyxlQUFlLEVBQUU7cUJBQ3JCLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ1QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsVUFBVSxHQUFHLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNsRSxPQUFPLEVBQUUsQ0FBQztnQkFDWixDQUFDLENBQUM7cUJBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNYLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO3dCQUM1QyxHQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3ZDLE1BQU0sTUFBTSxHQUNSLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsZUFBZSxFQUFFLEVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7d0JBQ2xGLEdBQUcsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLHVCQUF1QixJQUFJLENBQUMsV0FBVyxlQUFlLENBQUMsQ0FBQzt3QkFDbEYsR0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQ2xDLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyQixDQUFDO29CQUNELElBQUEsYUFBSyxFQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsQ0FBQyxDQUFDLENBQUM7WUFDVCxDQUFDLENBQUM7WUFDRixJQUFJLEVBQUUsQ0FBQztRQUNULENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUk7UUFDRixPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzNDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ3pCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDakIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEMsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUseUJBQXlCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxDQUFDO29CQUNILElBQUksU0FBUyxFQUFFLENBQUM7d0JBQ2Qsd0VBQXdFO3dCQUN4RSxzQ0FBc0M7d0JBQ3RDLFFBQVEsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO29CQUNwRSxDQUFDO3lCQUFNLENBQUM7d0JBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBSSxDQUFDLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0gsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLE1BQU0sT0FBTyxHQUFHLDRCQUE0QixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzFELEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNsQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDTix5Q0FBeUM7Z0JBQ3pDLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELFVBQVU7UUFDUixPQUFPLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFO1lBQ2pDLDhDQUE4QztZQUM5QyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMxRSxPQUFPLE9BQU8sRUFBRSxDQUFDO1lBQ25CLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDdEIsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUN0QixDQUFDO1lBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBR08sNEJBQVE7QUFIZixDQUFDO0FBRUYsa0JBQWUsUUFBUSxDQUFDIn0=