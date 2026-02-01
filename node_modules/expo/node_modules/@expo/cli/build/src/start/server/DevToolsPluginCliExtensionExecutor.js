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
        this.getCommandString = ({ command, args })=>{
            return `node ${this.plugin.cliExtensions.entryPoint} ${command}${Object.keys(args ?? {}).length > 0 ? ' ' + JSON.stringify(args) : ''}`;
        };
        this.execute = async ({ command, args, metroServerOrigin, onOutput })=>{
            this.validate({
                command,
                args
            });
            return new Promise(async (resolve)=>{
                // Set up the command and its arguments
                const tool = _path().default.join(this.plugin.packageRoot, this.plugin.cliExtensions.entryPoint);
                const child = this.spawnFunc('node', [
                    tool,
                    command,
                    `${JSON.stringify(args)}`,
                    `${metroServerOrigin}`
                ], {
                    cwd: this.projectRoot,
                    env: {
                        ...process.env
                    }
                });
                let finished = false;
                const pluginResults = new _DevToolsPluginCliExtensionResults.DevToolsPluginCliExtensionResults(onOutput);
                // Collect output/error data
                child.stdout.on('data', (data)=>pluginResults.append(data.toString()));
                child.stderr.on('data', (data)=>pluginResults.append(data.toString(), 'error'));
                // Setup timeout
                const timeout = setTimeout(()=>{
                    if (!finished) {
                        finished = true;
                        child.kill('SIGKILL');
                        pluginResults.append('Command timed out', 'error');
                        resolve(pluginResults.getOutput());
                    }
                }, this.timeoutMs);
                child.on('close', (code)=>{
                    if (finished) return;
                    clearTimeout(timeout);
                    finished = true;
                    pluginResults.exit(code);
                    resolve(pluginResults.getOutput());
                });
                child.on('error', (err)=>{
                    if (finished) return;
                    clearTimeout(timeout);
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
        const argsKeys = Object.keys(args ?? {});
        for (const param of commandElement.parameters ?? []){
            const found = argsKeys.find((key)=>key === param.name);
            if (!found) {
                throw new Error(`Parameter "${param.name}" not found in command "${command}" of plugin ${this.plugin.packageName}`);
            }
        }
    }
}

//# sourceMappingURL=DevToolsPluginCliExtensionExecutor.js.map