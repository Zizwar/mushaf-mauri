import { Dimensions } from "react-native";
// @ts-ignore
import { coordinateMadina } from "../data/coordinateMadina";
// @ts-ignore
import { coordinateMuhammadi } from "../data/coordinateMuhammadi";
// @ts-ignore
import indexMadina from "../data/indexMadina";
import { getWarshIndex } from "./warshAudioDB";
import type { AyahPosition } from "../types";
import type { Quira } from "../store/useAppStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ==================== MADINA (Hafs) ====================

const MARGIN_PAGE = 48;
const SCREEN_DEFAULT_WIDTH = 456;
const WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH - MARGIN_PAGE / 2.15;
const LEFT_OFFSET = -10;
const TOP_OFFSET = -20;

function scaleMadina(value: number): number {
  return (SCREEN_WIDTH / WIDTH_SCREEN_RENDER) * value;
}

function hlDrawMadina(
  id: string, top: number, left: number, width: number, height: number,
  wino: AyahPosition["wino"]
): AyahPosition {
  return {
    width: scaleMadina(width),
    height: scaleMadina(height),
    left: scaleMadina(left) + LEFT_OFFSET,
    top: scaleMadina(top) + TOP_OFFSET,
    wino,
    id: wino.id,
  };
}

function getPageCoordinatesMadina(page: number): AyahPosition[] {
  const coordinatePage = coordinateMadina[page];
  if (!coordinatePage) return [];

  let prevTop: number | null = null;
  let prevLeft: number | null = null;
  let height = 30, mgWidth = 40, tWidth = 416, ofWidth = 10, ofHeight = 15;
  const faselSura = 110, pageTop = 37, pageSuraTop = 80;

  if (page === 1 || page === 2) {
    height = 20; mgWidth = 80; tWidth = 376; ofWidth = 15; ofHeight = 20;
  }

  let count = 1;
  const allPositions: AyahPosition[] = [];

  for (const [sura, aya, rawTop, rawLeft] of coordinatePage) {
    const top = rawTop - ofHeight;
    const left = rawLeft - ofWidth;
    const wino = { aya, sura, page, id: `s${sura}a${aya}z` };
    const hlId = `s${sura}a${aya}z`;

    if (count === 1) {
      prevLeft = tWidth;
      prevTop = (page === 1 || page === 2) ? 270 : (aya === 1 ? pageSuraTop : pageTop);
    } else if (aya === 1) {
      prevTop! += faselSura;
      prevLeft = tWidth;
    }

    const diff = top - prevTop!;

    if (diff > height * 1.6) {
      allPositions.push(hlDrawMadina(hlId + "_1", prevTop!, mgWidth, prevLeft! - mgWidth, height, wino));
      allPositions.push(hlDrawMadina(hlId + "_2", top, left, tWidth - left, height, wino));
      allPositions.push(hlDrawMadina(hlId + "_3", prevTop! + height, mgWidth, tWidth - mgWidth, diff - height, wino));
    } else if (diff > height * 0.6) {
      allPositions.push(hlDrawMadina(hlId + "_1", prevTop!, mgWidth, prevLeft! - mgWidth, height, wino));
      allPositions.push(hlDrawMadina(hlId + "_2", top, left, tWidth - left, height, wino));
    } else {
      allPositions.push(hlDrawMadina(hlId + "_1", top, left, prevLeft! - left, height, wino));
    }

    count++;
    prevTop = top;
    prevLeft = left;
  }
  return allPositions;
}

// ==================== MUHAMMADI (Warsh) ====================

const MARGIN_LEFT_AYA = 15;
const MARGIN_PAGE_TOP_M = 4.2;
const MARGIN_HEIGHT_AYA = 0.3;
const MARGIN_WIDTH_M = 25;
const ORIGIN_PAGE_TOP = 985.8;
const ORIGINAL_WH = { width: 456, height: ORIGIN_PAGE_TOP + MARGIN_PAGE_TOP_M };
const HEIGHT_SCALA = SCREEN_WIDTH * 1.471676300578035 - MARGIN_WIDTH_M;
const DEVICE_WH = { width: SCREEN_WIDTH, height: HEIGHT_SCALA };
const NUMBER_LINE = 15;
const HEIGHT_LINE = HEIGHT_SCALA / NUMBER_LINE + MARGIN_HEIGHT_AYA;

function renderLineMuhammadi(
  left: number, line: number, width: number, wino: AyahPosition["wino"]
): AyahPosition {
  const top = +(HEIGHT_LINE * line).toFixed(2) + MARGIN_PAGE_TOP_M;
  const height = +HEIGHT_LINE.toFixed(2);
  return {
    left: +left.toFixed(2),
    width: +width.toFixed(2),
    top,
    height,
    id: wino.id,
    wino,
  };
}

function getPageCoordinatesMuhammadi(page: number): AyahPosition[] {
  if (!coordinateMuhammadi[page]) return [];

  let oldLine = 0;
  let oldLeft = DEVICE_WH.width;
  const allPosition: AyahPosition[] = [];

  const [nextPageSura = null, nextAya] = coordinateMuhammadi[page + 1]
    ? coordinateMuhammadi[page + 1][0]
    : [];

  const coordinatePage = nextPageSura
    ? [...coordinateMuhammadi[page], [nextPageSura, nextAya, 0, ORIGIN_PAGE_TOP]]
    : coordinateMuhammadi[page];

  for (let [sura, aya, rawLeft, rawTop] of coordinatePage) {
    const left = (rawLeft / ORIGINAL_WH.width) * DEVICE_WH.width - MARGIN_LEFT_AYA;
    const line = Math.floor(((rawTop / ORIGINAL_WH.height) * DEVICE_WH.height) / HEIGHT_LINE);
    const lineNumber = line - oldLine;
    const wino = { aya, sura, page, id: `s${sura}a${aya}z` };

    if (!lineNumber) {
      allPosition.push(renderLineMuhammadi(left, line, oldLeft - left, wino));
    } else if (lineNumber === 1) {
      allPosition.push(renderLineMuhammadi(left, line, DEVICE_WH.width - left, wino));
      allPosition.push(renderLineMuhammadi(0, oldLine, oldLeft, wino));
    } else if (lineNumber > 1) {
      allPosition.push(renderLineMuhammadi(left, line, DEVICE_WH.width - left, wino));
      allPosition.push(renderLineMuhammadi(0, oldLine, oldLeft, wino));
      for (let ii = oldLine + 1; ii < line; ii++) {
        allPosition.push(renderLineMuhammadi(0, ii, DEVICE_WH.width, wino));
      }
    }

    oldLine = line;
    oldLeft = left;
  }
  return allPosition;
}

// ==================== UNIFIED API ====================

export function getPageCoordinates(page: number, quira: Quira = "madina"): AyahPosition[] {
  return quira === "warsh"
    ? getPageCoordinatesMuhammadi(page)
    : getPageCoordinatesMadina(page);
}

function getIndex(quira: Quira) {
  return quira === "warsh" ? getWarshIndex() : indexMadina;
}

// indexMuhammadi pages start at 2 while app pages start at 1 → offset -1 for warsh
function adjustPage(page: number, quira: Quira): number {
  return quira === "warsh" ? page - 1 : page;
}

export function getPageBySuraAya(sura: number, aya: number, quira: Quira = "madina"): number {
  const index = getIndex(quira);
  const entry = index.find(([, , s, a]: number[]) => s === sura && a === aya);
  return entry ? adjustPage(entry[1], quira) : 1;
}

export function getNextAya(
  sura: number, aya: number, quira: Quira = "madina"
): { sura: number; aya: number; page: number } | null {
  const index = getIndex(quira);
  const currentIdx = index.findIndex(([, , s, a]: number[]) => s === sura && a === aya);
  if (currentIdx === -1 || currentIdx >= index.length - 1) return null;
  const next = index[currentIdx + 1];
  return { sura: next[2], aya: next[3], page: adjustPage(next[1], quira) };
}

export function getPrevAya(
  sura: number, aya: number, quira: Quira = "madina"
): { sura: number; aya: number; page: number } | null {
  const index = getIndex(quira);
  const currentIdx = index.findIndex(([, , s, a]: number[]) => s === sura && a === aya);
  if (currentIdx <= 0) return null;
  const prev = index[currentIdx - 1];
  return { sura: prev[2], aya: prev[3], page: adjustPage(prev[1], quira) };
}

export function getTotalPages(quira: Quira = "madina"): number {
  return quira === "warsh" ? 638 : 604;
}
