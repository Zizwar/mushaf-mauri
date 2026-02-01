import { coordinatePageMadina } from "./coordinateMadina";
import { coordinatePageMuhammadi } from "./coordinateMuhammadi";
export const coordinatePage = (page, quira) => {
  return quira === "warsh"
    ? coordinatePageMuhammadi(page)
    : coordinatePageMadina(page);
};
