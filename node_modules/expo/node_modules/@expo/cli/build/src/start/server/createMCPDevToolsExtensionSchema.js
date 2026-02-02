"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createMCPDevToolsExtensionSchema", {
    enumerable: true,
    get: function() {
        return createMCPDevToolsExtensionSchema;
    }
});
function _zod() {
    const data = require("zod");
    _zod = function() {
        return data;
    };
    return data;
}
function createMCPDevToolsExtensionSchema(plugin) {
    var _plugin_cliExtensions;
    if (plugin.cliExtensions == null || ((_plugin_cliExtensions = plugin.cliExtensions) == null ? void 0 : _plugin_cliExtensions.commands.length) === 0) {
        throw new Error(`Plugin ${plugin.packageName} has no commands defined. Please define at least one command.`);
    }
    const commands = plugin.cliExtensions.commands;
    // Build a rich description that explains each command and its parameters
    const commandDescriptions = commands.map((c)=>{
        var _c_parameters;
        const params = (_c_parameters = c.parameters) == null ? void 0 : _c_parameters.map((p)=>p.name).join(', ');
        return params ? `"${c.name}": ${c.title} (params: ${params})` : `"${c.name}": ${c.title}`;
    }).join('. ');
    // Create enum of command names for clear LLM selection
    const commandNames = commands.map((c)=>c.name);
    // Collect all unique parameters across all commands
    // Track which commands use each parameter for documentation
    const parameterCommandMap = {};
    const parameterDescriptions = {};
    for (const command of commands){
        if (command.parameters && command.parameters.length > 0) {
            for (const param of command.parameters){
                if (!parameterCommandMap[param.name]) {
                    parameterCommandMap[param.name] = [];
                    parameterDescriptions[param.name] = param.description || '';
                }
                parameterCommandMap[param.name].push(command.name);
            }
        }
    }
    // Build parameters with descriptions that indicate which command(s) they belong to
    const allParameters = {};
    for (const [paramName, commandList] of Object.entries(parameterCommandMap)){
        const baseDescription = parameterDescriptions[paramName];
        const commandsUsingParam = commandList.length === commands.length ? 'all commands' : commandList.map((c)=>`"${c}"`).join(', ');
        // Include command context in the description so LLMs know when to use each parameter
        const fullDescription = baseDescription ? `${baseDescription} (Used by: ${commandsUsingParam})` : `Parameter for: ${commandsUsingParam}`;
        allParameters[paramName] = _zod().z.string().optional().describe(fullDescription);
    }
    // Build the command description with clear instructions for the LLM
    const hasParameters = Object.keys(allParameters).length > 0;
    const commandDescription = hasParameters ? `Required. The command to execute. You must select exactly one command from the enum values. ` + `Each command may require specific parameters - only include parameters that belong to the selected command. ` + `Commands: ${commandDescriptions}.` : `Required. The command to execute. Select exactly one from the available options. ` + `Commands: ${commandDescriptions}.`;
    // Build the flat schema with additionalProperties: false for LLM compatibility
    const schema = _zod().z.object({
        command: _zod().z.enum(commandNames).describe(commandDescription),
        ...allParameters
    }).strict(); // .strict() adds additionalProperties: false
    return schema;
}

//# sourceMappingURL=createMCPDevToolsExtensionSchema.js.map