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
    get getLastDeveloperCodeSigningIdAsync () {
        return getLastDeveloperCodeSigningIdAsync;
    },
    get setLastDeveloperCodeSigningIdAsync () {
        return setLastDeveloperCodeSigningIdAsync;
    }
});
const _UserSettings = require("../../../api/user/UserSettings");
async function getLastDeveloperCodeSigningIdAsync() {
    return await (0, _UserSettings.getSettings)().getAsync('developmentCodeSigningId', null);
}
async function setLastDeveloperCodeSigningIdAsync(id) {
    await (0, _UserSettings.getSettings)().setAsync('developmentCodeSigningId', id).catch(()=>{});
}

//# sourceMappingURL=settings.js.map