import { coordinatePageMadina } from "./coordinateMadina";
import { coordinatePageMuhammadi } from "./coordinateMuhammadi";
export const coordinatePage = (page, quira) => {
  return true //quira === "warsh"
    ? coordinatePageMuhammadi(page)
    : coordinatePageMadina(page);
};
