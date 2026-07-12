"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "addMcpCapabilities", {
    enumerable: true,
    get: function() {
        return addMcpCapabilities;
    }
});
const _DevToolsPluginschema = require("./DevToolsPlugin.schema");
const _DevToolsPluginCliExtensionExecutor = require("./DevToolsPluginCliExtensionExecutor");
const _createMCPDevToolsExtensionSchema = require("./createMCPDevToolsExtensionSchema");
const _log = require("../../log");
const debug = require('debug')('expo:start:server:devtools:mcp');
async function addMcpCapabilities(mcpServer, devServerManager) {
    const plugins = await devServerManager.devtoolsPluginManager.queryPluginsAsync();
    for (const plugin of plugins){
        if (plugin.cliExtensions) {
            const mcpCommands = (plugin.cliExtensions.commands ?? []).filter((p)=>{
                var _p_environments;
                return (_p_environments = p.environments) == null ? void 0 : _p_environments.includes('mcp');
            });
            if (mcpCommands.length === 0) {
                continue;
            }
            // Build an MCP-scoped descriptor so the schema enum and the executor's
            // existence check both reject commands that were not declared MCP-enabled.
            const mcpPlugin = {
                packageName: plugin.packageName,
                packageRoot: plugin.packageRoot,
                cliExtensions: {
                    ...plugin.cliExtensions,
                    commands: mcpCommands
                }
            };
            const schema = (0, _createMCPDevToolsExtensionSchema.createMCPDevToolsExtensionSchema)(mcpPlugin);
            debug(`Installing MCP CLI extension for plugin: ${plugin.packageName} - found ${mcpCommands.length} commands`);
            mcpServer.registerTool(plugin.packageName, {
                title: plugin.packageName,
                description: plugin.description,
                inputSchema: {
                    parameters: schema
                }
            }, async ({ parameters })=>{
                try {
                    const { command, ...args } = parameters;
                    const metroServerOrigin = devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
                    const results = await new _DevToolsPluginCliExtensionExecutor.DevToolsPluginCliExtensionExecutor(mcpPlugin, devServerManager.projectRoot).execute({
                        command,
                        args,
                        metroServerOrigin
                    });
                    const parsedResults = _DevToolsPluginschema.DevToolsPluginOutputSchema.safeParse(results);
                    if (parsedResults.success === false) {
                        throw new Error(`Invalid output from CLI command: ${parsedResults.error.issues.map((issue)=>issue.message).join(', ')}`);
                    }
                    return {
                        content: parsedResults.data.map((line)=>{
                            const { type } = line;
                            if (type === 'text') {
                                return {
                                    type,
                                    text: line.text,
                                    level: line.level,
                                    url: line.url
                                };
                            } else if (line.type === 'image' || line.type === 'audio') {
                                // We could present this as a resource_link, but it seems not to be well supported in MCP clients,
                                // so we'll return a text with the link instead.
                                return {
                                    type: 'text',
                                    text: `${type} resource: ${line.url}${line.text ? ' (' + line.text + ')' : ''}`
                                };
                            }
                            return null;
                        }).filter((line)=>line !== null)
                    };
                } catch (e) {
                    _log.Log.error('Error executing MCP CLI command:', e);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error executing command: ${e.toString()}`
                            }
                        ],
                        isError: true
                    };
                }
            });
        }
    }
}

//# sourceMappingURL=MCPDevToolsPluginCLIExtensions.js.map