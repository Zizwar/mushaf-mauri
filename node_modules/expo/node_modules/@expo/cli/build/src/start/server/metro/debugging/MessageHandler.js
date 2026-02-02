"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessageHandler", {
    enumerable: true,
    get: function() {
        return MessageHandler;
    }
});
class MessageHandler {
    constructor(connection){
        this.page = connection.page;
        this.device = connection.device;
        this.debugger = connection.debugger;
    }
    /** Determine if this middleware should be enabled or disabled, based on the page capabilities */ isEnabled() {
        return true;
    }
    /** Send a message directly to the device */ sendToDevice(message) {
        this.device.sendMessage(message);
        return true;
    }
    /** Send a message directly to the debugger */ sendToDebugger(message) {
        this.debugger.sendMessage(message);
        return true;
    }
}

//# sourceMappingURL=MessageHandler.js.map