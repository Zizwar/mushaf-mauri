"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = countLines;
const newline = /\r\n?|\n|\u2028|\u2029/g;
function countLines(string) {
  return (string.match(newline) || []).length + 1;
}
