// @ts-ignore
import { ayatJson } from "../data/ayatJson";
// @ts-ignore
import { textwarsh } from "../data/textWarsh";
// @ts-ignore
import indexMuhammadi from "../data/indexMuhammadi";
// @ts-ignore
import indexMadina from "../data/indexMadina";
// @ts-ignore
import { QuranData } from "../data/quranData";
import type { Quira } from "../store/useAppStore";

/**
 * Get all 114 surahs as { value, label } for pickers.
 */
export function allSuwar(): { value: number; label: string }[] {
  const list: { value: number; label: string }[] = [];
  for (let i = 1; i <= 114; i++) {
    const s = QuranData.Sura[i];
    if (s) list.push({ value: i, label: `${i}. ${s[0]}` });
  }
  return list;
}

/**
 * Get sura name in Arabic by sura number.
 */
export function getSuraName(sura: number): string {
  return QuranData.Sura[sura]?.[0] ?? "";
}

/**
 * Get the number of ayahs in a sura.
 */
export function getAyahCount(sura: number): number {
  const index = indexMadina as number[][];
  const ayahs = index.filter(([, , s]: number[]) => s === sura);
  return ayahs.length;
}

/**
 * Get list of ayah numbers for a given sura (for picker).
 */
export function getAyahsForSura(sura: number): { value: number; label: string }[] {
  const count = getAyahCount(sura);
  const list: { value: number; label: string }[] = [];
  for (let i = 1; i <= count; i++) {
    list.push({ value: i, label: String(i) });
  }
  return list;
}

export interface SearchResult {
  sura: number;
  aya: number;
  page: number;
  text: string;
}

/**
 * Search ayat by text (without tashkeel) and return results with tashkeel text.
 */
export function searchAyatByText(query: string, quira: Quira = "madina"): SearchResult[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = normalizeArabic(query);
  const results: SearchResult[] = [];

  if (quira === "warsh") {
    const idx = indexMuhammadi as number[][];
    for (let i = 0; i < idx.length && results.length < 100; i++) {
      const [id, page, sura, aya] = idx[i];
      const tw = textwarsh[id - 1];
      if (!tw) continue;
      const plain = normalizeArabic(String(tw[1] ?? tw[0]));
      if (plain.includes(normalizedQuery)) {
        results.push({ sura, aya, page, text: String(tw[0]) });
      }
    }
  } else {
    for (let i = 0; i < ayatJson.length && results.length < 100; i++) {
      const entry = ayatJson[i] as any[];
      const plain = normalizeArabic(String(entry[4] ?? entry[3]));
      if (plain.includes(normalizedQuery)) {
        results.push({
          sura: Number(entry[1]),
          aya: Number(entry[2]),
          page: Number(entry[5]),
          text: String(entry[3]),
        });
      }
    }
  }

  return results;
}

/**
 * Normalize Arabic text by removing diacritics/tashkeel for comparison.
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

/**
 * Get the first ayah on a given page.
 */
export function getFirstAyahOnPage(
  page: number,
  quira: Quira = "madina"
): { sura: number; aya: number } | null {
  const index = quira === "warsh" ? indexMuhammadi : indexMadina;
  const entry = (index as number[][]).find(([, p]: number[]) => p === page);
  if (!entry) return null;
  return quira === "warsh"
    ? { sura: entry[2], aya: entry[3] }
    : { sura: entry[2], aya: entry[3] };
}

/**
 * Calculate khitma (Quran completion schedule).
 */
export function calcKhitma(
  juz: number,
  day: number
): {
  startRob3: number;
  endRob3: number;
  rob3Day: number;
  juzPortion: number;
  rob3Portion: number;
} {
  const rob3Total = 240 - (juz - 1) * 8;
  const rob3Day = Math.max(1, Math.floor(rob3Total / day));
  const juzPortion = Math.floor(rob3Day / 8);
  const rob3Portion = rob3Day % 8;
  const startRob3 = (juz - 1) * 8;
  const endRob3 = Math.min(startRob3 + rob3Day, 240);
  return { startRob3, endRob3, rob3Day, juzPortion, rob3Portion };
}

/**
 * Get the sura and aya for a given HizbQuarter index (0-239).
 */
export function getHizbQuarterPosition(
  index: number
): { sura: number; aya: number } | null {
  const hq = QuranData.HizbQaurter;
  if (!hq || index < 0 || index >= hq.length) return null;
  const entry = hq[index];
  return entry ? { sura: entry[0], aya: entry[1] } : null;
}

/**
 * Get page number by sura and aya.
 */
export function getPageBySuraAya(
  sura: number,
  aya: number,
  quira: Quira = "madina"
): number {
  const index = quira === "warsh" ? indexMuhammadi : indexMadina;
  const entry = (index as number[][]).find(
    ([, , s, a]: number[]) => s === sura && a === aya
  );
  return entry ? entry[1] : 1;
}
