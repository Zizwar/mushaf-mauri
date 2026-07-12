"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DevToolsPluginCliExtensionExecutor", {
    enumerable: true,
    get: function() {
        return DevToolsPluginCliExtensionExecutor;
    }
});
function _child_process() {
    const data = require("child_process");
    _child_process = function() {
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
const _DevToolsPluginCliExtensionResults = require("./DevToolsPluginCliExtensionResults");
const _dir = require("../../utils/dir");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
class DevToolsPluginCliExtensionExecutor {
    constructor(plugin, projectRoot, spawnFunc = _child_process().spawn, timeoutMs = DEFAULT_TIMEOUT_MS // Timeout for command execution
    ){
        var _this_plugin_cliExtensions;
        this.plugin = plugin;
        this.projectRoot = projectRoot;
        this.spawnFunc = spawnFunc;
        this.timeoutMs = timeoutMs;
        /** this function is used for testing and showing the command in UI */ this.getCommandString = ({ command, args })=>{
            return `node ${this.plugin.cliExtensions.entryPoint} ${command}${Object.keys(args ?? {}).length > 0 ? ' ' + JSON.stringify(args) : ''}`;
        };
        this.execute = async ({ command, args, metroServerOrigin, onOutput })=>{
            this.validate({
                command,
                args
            });
            return new Promise((resolve)=>{
                let finished = false;
                let timeout;
                const pluginResults = new _DevToolsPluginCliExtensionResults.DevToolsPluginCliExtensionResults(onOutput);
                // process.execPath instead of 'node' so the child can't be redirected by a PATH shim.
                let child;
                try {
                    child = this.spawnFunc(process.execPath, [
                        this.resolvedEntryPoint,
                        command,
                        `${JSON.stringify(args)}`,
                        `${metroServerOrigin}`
                    ], {
                        cwd: this.projectRoot,
                        env: {
                            ...process.env
                        }
                    });
                } catch (err) {
                    var _err_toString;
                    // spawn can throw synchronously; resolve with an error result instead of hanging.
                    pluginResults.append((err == null ? void 0 : (_err_toString = err.toString) == null ? void 0 : _err_toString.call(err)) ?? String(err), 'error');
                    resolve(pluginResults.getOutput());
                    return;
                }
                const finishOnTruncation = ()=>{
                    if (pluginResults.isTruncated() && !finished) {
                        finished = true;
                        if (timeout) clearTimeout(timeout);
                        child.kill('SIGKILL');
                        resolve(pluginResults.getOutput());
                    }
                };
                // Collect output/error data
                child.stdout.on('data', (data)=>{
                    pluginResults.append(data.toString());
                    finishOnTruncation();
                });
                child.stderr.on('data', (data)=>{
                    pluginResults.append(data.toString(), 'error');
                    finishOnTruncation();
                });
                // Setup timeout
                timeout = setTimeout(()=>{
                    if (!finished) {
                        finished = true;
                        child.kill('SIGKILL');
                        pluginResults.append('Command timed out', 'error');
                        resolve(pluginResults.getOutput());
                    }
                }, this.timeoutMs);
                child.on('close', (code)=>{
                    if (finished) return;
                    if (timeout) clearTimeout(timeout);
                    finished = true;
                    pluginResults.exit(code);
                    resolve(pluginResults.getOutput());
                });
                child.on('error', (err)=>{
                    if (finished) return;
                    if (timeout) clearTimeout(timeout);
                    finished = true;
                    pluginResults.append(err.toString(), 'error');
                    resolve(pluginResults.getOutput());
                });
            });
        };
        // Validate that this is a plugin with cli extensions
        if (!((_this_plugin_cliExtensions = this.plugin.cliExtensions) == null ? void 0 : _this_plugin_cliExtensions.entryPoint)) {
            throw new Error(`Plugin ${this.plugin.packageName} has no CLI extensions`);
        }
        // Reject entryPoints that escape packageRoot (e.g. "../../other-pkg/dist/cli.js").
        const resolved = _path().default.resolve(this.plugin.packageRoot, this.plugin.cliExtensions.entryPoint);
        if (!(0, _dir.isPathInside)(resolved, this.plugin.packageRoot)) {
            throw new Error(`Plugin ${this.plugin.packageName} entryPoint "${this.plugin.cliExtensions.entryPoint}" ` + `escapes packageRoot (${this.plugin.packageRoot}); must be a relative path inside the package.`);
        }
        this.resolvedEntryPoint = resolved;
    }
    validate({ command, args }) {
        var _this_plugin_cliExtensions, _commandElement_parameters;
        const commandElement = (_this_plugin_cliExtensions = this.plugin.cliExtensions) == null ? void 0 : _this_plugin_cliExtensions.commands.find((c)=>c.name === command);
        if (!commandElement) {
            throw new Error(`Command "${command}" not found in plugin ${this.plugin.packageName}`);
        }
        const paramLength = ((_commandElement_parameters = commandElement.parameters) == null ? void 0 : _commandElement_parameters.length) ?? 0;
        const argsLength = Object.keys(args ?? {}).length;
        if (paramLength !== argsLength) {
            // Quick check to see if the lengths match
            throw new Error(`Expected ${paramLength} parameter(s), but got ${argsLength} argument(s) for the command "${command}".`);
        }
        const argsObj = args ?? {};
        for (const param of commandElement.parameters ?? []){
            if (!Object.prototype.hasOwnProperty.call(argsObj, param.name)) {
                throw new Error(`Parameter "${param.name}" not found in command "${command}" of plugin ${this.plugin.packageName}`);
            }
            // Enforce declared parameter type; don't rely on upstream Zod validation alone.
            const expected = param.type === 'confirm' ? 'boolean' : param.type === 'number' ? 'number' : 'string';
            const actual = typeof argsObj[param.name];
            if (actual !== expected) {
                throw new Error(`Parameter "${param.name}" of "${command}" expected ${expected} (declared "${param.type}"), got ${actual}.`);
            }
        }
    }
}

//# sourceMappingURL=DevToolsPluginCliExtensionExecutor.js.map