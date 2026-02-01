//export * from './warsh';
//
export * from "./muhammadi/coordinateMuhammadi";
//export * from "./muhammadi/indexMuhammadi";

export * from "./madina/coordinateMadina";
//export * from "./madina/indexMadina";

import madina from "./madina/indexMadina";
import warsh from "./muhammadi/indexMuhammadi";
export * from "./quran-data";
export * from "./ayatJson";
export * from "./listAuthor";
export * from "./tarajemMuyassar";

export * from "./textWarsh";
export * from "./requirePage";
//console.log("####+++madina",{madina})
export const currentIndex = { madina, warsh };
