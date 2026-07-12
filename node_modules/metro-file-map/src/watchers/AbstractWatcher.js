"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.AbstractWatcher = void 0;
var _common = require("./common");
var _events = _interopRequireDefault(require("events"));
var path = _interopRequireWildcard(require("path"));
function _interopRequireWildcard(e, t) {
  if ("function" == typeof WeakMap)
    var r = new WeakMap(),
      n = new WeakMap();
  return (_interopRequireWildcard = function (e, t) {
    if (!t && e && e.__esModule) return e;
    var o,
      i,
      f = { __proto__: null, default: e };
    if (null === e || ("object" != typeof e && "function" != typeof e))
      return f;
    if ((o = t ? n : r)) {
      if (o.has(e)) return o.get(e);
      o.set(e, f);
    }
    for (const t in e)
      "default" !== t &&
        {}.hasOwnProperty.call(e, t) &&
        ((i =
          (o = Object.defineProperty) &&
          Object.getOwnPropertyDescriptor(e, t)) &&
        (i.get || i.set)
          ? o(f, t, i)
          : (f[t] = e[t]));
    return f;
  })(e, t);
}
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
class AbstractWatcher {
  #emitter = new _events.default();
  constructor(dir, opts) {
    const { ignored, globs, dot } = opts;
    this.dot = dot || false;
    this.ignored = ignored;
    this.globs = globs;
    this.doIgnore = ignored
      ? (filePath) => (0, _common.posixPathMatchesPattern)(ignored, filePath)
      : () => false;
    this.root = path.resolve(dir);
  }
  onFileEvent(listener) {
    this.#emitter.on("fileevent", listener);
    return () => {
      this.#emitter.removeListener("fileevent", listener);
    };
  }
  onError(listener) {
    this.#emitter.on("error", listener);
    return () => {
      this.#emitter.removeListener("error", listener);
    };
  }
  async startWatching() {}
  async stopWatching() {
    this.#emitter.removeAllListeners();
  }
  emitFileEvent(event) {
    this.#emitter.emit("fileevent", {
      ...event,
      root: this.root,
    });
  }
  emitError(error) {
    this.#emitter.emit("error", error);
  }
  getPauseReason() {
    return null;
  }
}
exports.AbstractWatcher = AbstractWatcher;
