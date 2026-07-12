"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _AbstractWatcher = require("./AbstractWatcher");
var _common = require("./common");
var _fs = require("fs");
var _os = require("os");
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
const debug = require("debug")("Metro:NativeWatcher");
const TOUCH_EVENT = "touch";
const DELETE_EVENT = "delete";
const RECRAWL_EVENT = "recrawl";
class NativeWatcher extends _AbstractWatcher.AbstractWatcher {
  #fsWatcher;
  static isSupported() {
    return (0, _os.platform)() === "darwin";
  }
  constructor(dir, opts) {
    if (!NativeWatcher.isSupported) {
      throw new Error("This watcher can only be used on macOS");
    }
    super(dir, opts);
  }
  async startWatching() {
    this.#fsWatcher = (0, _fs.watch)(
      this.root,
      {
        persistent: false,
        recursive: true,
      },
      (event, relativePath) => {
        this._handleEvent(event, relativePath).catch((error) => {
          this.emitError(error);
        });
      },
    );
    debug("Watching %s", this.root);
  }
  async stopWatching() {
    await super.stopWatching();
    if (this.#fsWatcher) {
      this.#fsWatcher.close();
    }
  }
  async _handleEvent(event, relativePath) {
    const absolutePath = path.resolve(this.root, relativePath);
    if (this.doIgnore(relativePath)) {
      debug(
        'Ignoring event "%s" on %s (root: %s)',
        event,
        relativePath,
        this.root,
      );
      return;
    }
    debug(
      'Handling event "%s" on %s (root: %s)',
      event,
      relativePath,
      this.root,
    );
    try {
      const stat = await _fs.promises.lstat(absolutePath);
      const type = (0, _common.typeFromStat)(stat);
      if (!type) {
        return;
      }
      if (
        !(0, _common.includedByGlob)(type, this.globs, this.dot, relativePath)
      ) {
        return;
      }
      if (type === "d" && event === "rename") {
        debug(
          "Directory rename detected on %s, requesting recrawl",
          relativePath,
        );
        this.emitFileEvent({
          event: RECRAWL_EVENT,
          relativePath,
        });
        return;
      }
      this.emitFileEvent({
        event: TOUCH_EVENT,
        relativePath,
        metadata: {
          type,
          modifiedTime: stat.mtime.getTime(),
          size: stat.size,
        },
      });
    } catch (error) {
      if (error?.code !== "ENOENT") {
        this.emitError(error);
        return;
      }
      this.emitFileEvent({
        event: DELETE_EVENT,
        relativePath,
      });
    }
  }
}
exports.default = NativeWatcher;
