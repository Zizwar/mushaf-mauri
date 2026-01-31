import { Dimensions } from "react-native";
// @ts-ignore - JS data file
import { coordinateMadina } from "../data/coordinateMadina";
import type { AyahPosition } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MARGIN_PAGE = 48;
const SCREEN_DEFAULT_WIDTH = 456;
const WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH - MARGIN_PAGE / 2.15;
const LEFT_OFFSET = -10;
const TOP_OFFSET = -20;

function scaleDimension(value: number): number {
  return (SCREEN_WIDTH / WIDTH_SCREEN_RENDER) * value;
}

function hlDraw(
  id: string,
  top: number,
  left: number,
  width: number,
  height: number,
  wino: AyahPosition["wino"]
): AyahPosition {
  return {
    width: scaleDimension(width),
    height: scaleDimension(height),
    left: scaleDimension(left) + LEFT_OFFSET,
    top: scaleDimension(top) + TOP_OFFSET,
    wino,
    id: wino.id,
  };
}

export function getPageCoordinates(page: number): AyahPosition[] {
  const coordinatePage = coordinateMadina[page];
  if (!coordinatePage) return [];

  let prevTop: number | null = null;
  let prevLeft: number | null = null;

  // Default dimensions
  let height = 30;
  let mgWidth = 40;
  let tWidth = 416;
  let ofWidth = 10;
  let ofHeight = 15;
  const faselSura = 110;
  const pageTop = 37;
  const pageSuraTop = 80;

  // First two pages have special dimensions
  if (page === 1 || page === 2) {
    height = 20;
    mgWidth = 80;
    tWidth = 376;
    ofWidth = 15;
    ofHeight = 20;
  }

  let count = 1;
  const allPositions: AyahPosition[] = [];

  for (const [sura, aya, rawTop, rawLeft] of coordinatePage) {
    const top = rawTop - ofHeight;
    const left = rawLeft - ofWidth;

    const wino = {
      aya,
      sura,
      page,
      id: `s${sura}a${aya}z`,
    };

    const hlId = `s${sura}a${aya}z`;

    if (count === 1) {
      prevLeft = tWidth;
      if (page === 1 || page === 2) {
        prevTop = 270;
      } else {
        prevTop = aya === 1 ? pageSuraTop : pageTop;
      }
    } else {
      if (aya === 1) {
        prevTop! += faselSura;
        prevLeft = tWidth;
      }
    }

    const diff = top - prevTop!;

    if (diff > height * 1.6) {
      // Ayah spans 3+ lines
      allPositions.push(
        hlDraw(hlId + "_1", prevTop!, mgWidth, prevLeft! - mgWidth, height, wino)
      );
      allPositions.push(
        hlDraw(hlId + "_2", top, left, tWidth - left, height, wino)
      );
      allPositions.push(
        hlDraw(hlId + "_3", prevTop! + height, mgWidth, tWidth - mgWidth, diff - height, wino)
      );
    } else if (diff > height * 0.6) {
      // Ayah spans 2 lines
      allPositions.push(
        hlDraw(hlId + "_1", prevTop!, mgWidth, prevLeft! - mgWidth, height, wino)
      );
      allPositions.push(
        hlDraw(hlId + "_2", top, left, tWidth - left, height, wino)
      );
    } else {
      // Ayah on single line
      const width = prevLeft! - left;
      allPositions.push(
        hlDraw(hlId + "_1", top, left, width, height, wino)
      );
    }

    count++;
    prevTop = top;
    prevLeft = left;
  }

  return allPositions;
}

// Get sura and aya info from index data
// @ts-ignore
import indexMadina from "../data/indexMadina";

export function getPageBySuraAya(sura: number, aya: number): number {
  const entry = indexMadina.find(
    ([, , s, a]: number[]) => s === sura && a === aya
  );
  return entry ? entry[1] : 1;
}

export function pageToSuraAya(page: number): { sura: number; aya: number } {
  const entry = indexMadina.find(([, p]: number[]) => p === page);
  return entry ? { sura: entry[2], aya: entry[3] } : { sura: 1, aya: 1 };
}

export const TOTAL_PAGES = 604;
