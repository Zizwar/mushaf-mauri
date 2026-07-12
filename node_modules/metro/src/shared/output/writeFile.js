"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = writeFile;
var _fs = _interopRequireDefault(require("fs"));
var _throat = _interopRequireDefault(require("throat"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const writeFileWithThroat = (0, _throat.default)(
  128,
  _fs.default.promises.writeFile,
);
function writeFile(filePath, data, encoding) {
  return writeFileWithThroat(filePath, data, encoding);
}
