"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DevToolsPluginCliExtensionResults", {
    enumerable: true,
    get: function() {
        return DevToolsPluginCliExtensionResults;
    }
});
const _DevToolsPluginschema = require("./DevToolsPlugin.schema");
class DevToolsPluginCliExtensionResults {
    constructor(onOutput){
        this.onOutput = onOutput;
        this._output = [];
    }
    append(output, level = 'info') {
        const results = this.parseOutputText(output, level);
        this._output.push(...results);
        this.onOutput == null ? void 0 : this.onOutput.call(this, results);
    }
    exit(code) {
        if (code === 0) return;
        this.append(`Process exited with code ${code}`, 'error');
    }
    getOutput() {
        return this._output;
    }
    parseOutputText(txt, level = 'info') {
        // Validate against schema
        try {
            const result = _DevToolsPluginschema.DevToolsPluginOutputSchema.safeParse(JSON.parse(txt));
            if (!result.success) {
                return [
                    {
                        type: 'text',
                        text: `Invalid JSON: ${result.error.issues.map((issue)=>issue.message).join(', ')}`,
                        level: 'error'
                    }
                ];
            }
            return result.data;
        } catch  {
            // Not JSON, treat as plain text
            const lines = txt.split('\n');
            const results = [];
            for (const line of lines){
                if (line) {
                    results.push({
                        type: 'text',
                        text: line,
                        level
                    });
                }
            }
            return results;
        }
    }
}

//# sourceMappingURL=DevToolsPluginCliExtensionResults.js.map