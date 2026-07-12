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
    get prependMiddleware () {
        return prependMiddleware;
    },
    get replaceMiddlewareWith () {
        return replaceMiddlewareWith;
    }
});
function prependMiddleware(app, middleware) {
    app.use(middleware);
    app.stack.unshift(app.stack.pop());
}
function replaceMiddlewareWith(app, sourceMiddleware, targetMiddleware) {
    const item = app.stack.find((middleware)=>{
        const handlerCode = middleware.handle.toString();
        return !handlerCode.includes('[native code]') && handlerCode === sourceMiddleware.toString();
    });
    if (item) {
        item.handle = targetMiddleware;
    }
}

//# sourceMappingURL=mutations.js.map