"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.logError = logError;
exports.logInfo = logInfo;
exports.logWarning = logWarning;
exports.nullReporter = void 0;
var _tty = _interopRequireDefault(require("tty"));
var _util = _interopRequireDefault(require("util"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const supportsColor = () =>
  process.stdout instanceof _tty.default.WriteStream &&
  process.stdout.hasColors();
function logWarning(terminal, format, ...args) {
  const str = _util.default.format(format, ...args);
  terminal.log(
    "%s %s",
    _util.default.styleText(["yellow", "inverse", "bold"], " WARN "),
    str,
  );
}
function logError(terminal, format, ...args) {
  terminal.log(
    "%s %s",
    _util.default.styleText(["red", "inverse", "bold"], " ERROR "),
    _util.default.format(
      supportsColor() ? format : _util.default.stripVTControlCharacters(format),
      ...args,
    ),
  );
}
function logInfo(terminal, format, ...args) {
  const str = _util.default.format(format, ...args);
  terminal.log(
    "%s %s",
    _util.default.styleText(["cyan", "inverse", "bold"], " INFO "),
    str,
  );
}
const nullReporter = (exports.nullReporter = {
  update() {},
});
