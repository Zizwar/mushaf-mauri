"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.WRAP_NAME = void 0;
exports.jsonToCommonJS = jsonToCommonJS;
exports.wrapJson = wrapJson;
exports.wrapModule = wrapModule;
exports.wrapPolyfill = wrapPolyfill;
var _template = _interopRequireDefault(require("@babel/template"));
var _traverse = _interopRequireDefault(require("@babel/traverse"));
var t = _interopRequireWildcard(require("@babel/types"));
var _invariant = _interopRequireDefault(require("invariant"));
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
const WRAP_NAME = (exports.WRAP_NAME = "$$_REQUIRE");
const IIFE_PARAM = _template.default.expression(
  "typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this",
);
function wrapModule(
  fileAst,
  importDefaultName,
  importAllName,
  dependencyMapName,
  globalPrefix,
  skipRequireRename,
  { unstable_useStaticHermesModuleFactory = false } = {},
) {
  const params = buildParameters(
    importDefaultName,
    importAllName,
    dependencyMapName,
  );
  const factory = functionFromProgram(fileAst.program, params);
  const def = t.callExpression(t.identifier(`${globalPrefix}__d`), [
    unstable_useStaticHermesModuleFactory
      ? t.callExpression(
          t.memberExpression(
            t.identifier("$SHBuiltin"),
            t.identifier("moduleFactory"),
          ),
          [t.identifier("_$$_METRO_MODULE_ID"), factory],
        )
      : factory,
  ]);
  const ast = t.file(t.program([t.expressionStatement(def)]));
  const requireName = skipRequireRename ? "require" : renameRequires(ast);
  return {
    ast,
    requireName,
  };
}
function wrapPolyfill(fileAst) {
  const factory = functionFromProgram(fileAst.program, ["global"]);
  const iife = t.callExpression(factory, [IIFE_PARAM()]);
  return t.file(t.program([t.expressionStatement(iife)]));
}
function jsonToCommonJS(source) {
  return `module.exports = ${source};`;
}
function wrapJson(
  source,
  globalPrefix,
  unstable_useStaticHermesModuleFactory = false,
) {
  const moduleFactoryParameters = buildParameters(
    "_importDefaultUnused",
    "_importAllUnused",
    "_dependencyMapUnused",
  );
  const factory = [
    `function(${moduleFactoryParameters.join(", ")}) {`,
    `  ${jsonToCommonJS(source)}`,
    "}",
  ].join("\n");
  return (
    `${globalPrefix}__d(` +
    (unstable_useStaticHermesModuleFactory
      ? "$SHBuiltin.moduleFactory(_$$_METRO_MODULE_ID, " + factory + ")"
      : factory) +
    ");"
  );
}
function functionFromProgram(program, parameters) {
  return t.functionExpression(
    undefined,
    parameters.map(makeIdentifier),
    t.blockStatement(program.body, program.directives),
  );
}
function makeIdentifier(name) {
  return t.identifier(name);
}
function buildParameters(importDefaultName, importAllName, dependencyMapName) {
  return [
    "global",
    "require",
    importDefaultName,
    importAllName,
    "module",
    "exports",
    dependencyMapName,
  ];
}
function renameRequires(ast) {
  let newRequireName = WRAP_NAME;
  (0, _traverse.default)(ast, {
    Program(path) {
      const body = path.get("body.0.expression.arguments.0.body");
      (0, _invariant.default)(
        !Array.isArray(body),
        "metro: Expected `body` to be a single path.",
      );
      newRequireName = body.scope.generateUid(WRAP_NAME);
      body.scope.rename("require", newRequireName);
    },
  });
  return newRequireName;
}
