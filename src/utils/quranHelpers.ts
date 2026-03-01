// @ts-ignore
import { ayatJson } from "../data/ayatJson";
// @ts-ignore
import indexMadina from "../data/indexMadina";
import { getWarshIndex, searchWarshText, type WarshSearchResult } from "./warshAudioDB";
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
export async function searchAyatByText(query: string, quira: Quira = "madina"): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  if (quira === "warsh") {
    // SQL search — fast, no memory needed
    const dbResults = await searchWarshText(query, 100);
    // DB pages start at 2, app pages at 1 → offset -1
    return dbResults.map((r) => ({ sura: r.sura, aya: r.aya, page: r.page - 1, text: r.text }));
  }

  // Hafs: search in-memory ayatJson
  const normalizedQuery = normalizeArabic(query);
  const results: SearchResult[] = [];
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
  const index = quira === "warsh" ? getWarshIndex() : indexMadina;
  // getWarshIndex() pages start at 2 while app pages start at 1 → offset +1
  const searchPage = quira === "warsh" ? page + 1 : page;
  const entry = (index as number[][]).find(([, p]: number[]) => p === searchPage);
  if (!entry) return null;
  return { sura: entry[2], aya: entry[3] };
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
 * Get the juz number (1-30) for a given sura and aya.
 */
export function getJuzBySuraAya(sura: number, aya: number = 1): number {
  const juz = QuranData.Juz;
  const n = juz.length;
  for (let i = 1; i < n; i++) {
    if (!juz[i] || !juz[i].length) continue;
    if (
      juz[i][0] > sura ||
      (juz[i][0] === sura && juz[i][1] > aya)
    ) {
      return i - 1;
    }
    if (juz[i][0] === sura && juz[i][1] === aya) {
      return i;
    }
  }
  return 30;
}

/**
 * Get sura name and juz number for a given page using QuranData.Page.
 */
export function getPageInfo(
  page: number,
  quira: Quira = "madina"
): { suraName: string; sura: number; juz: number } {
  const pageData = quira === "warsh" ? QuranData.Page_warsh : QuranData.Page;
  const entry = pageData?.[page];
  if (!entry || !entry.length) {
    return { suraName: "", sura: 1, juz: 1 };
  }
  const sura = entry[0];
  const aya = entry[1];
  return {
    suraName: QuranData.Sura[sura]?.[0] ?? "",
    sura,
    juz: getJuzBySuraAya(sura, aya),
  };
}

/**
 * Get page number by sura and aya.
 */
export function getPageBySuraAya(
  sura: number,
  aya: number,
  quira: Quira = "madina"
): number {
  const index = quira === "warsh" ? getWarshIndex() : indexMadina;
  const entry = (index as number[][]).find(
    ([, , s, a]: number[]) => s === sura && a === aya
  );
  if (!entry) return 1;
  // getWarshIndex() pages start at 2 while app pages start at 1 → offset -1
  return quira === "warsh" ? entry[1] - 1 : entry[1];
}
