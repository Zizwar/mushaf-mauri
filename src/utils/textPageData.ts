// @ts-ignore
import { ayatJson } from "../data/ayatJson";
import { getWarshIndex, getWarshAyahContent } from "./warshAudioDB";
import type { Quira } from "../store/useAppStore";

export interface PageAyah {
  sura: number;
  aya: number;
  text: string;   // text without marker
  marker: string; // ﴿٣﴾
  isFirstInSura: boolean;
}

export interface SuraSection {
  sura: number;
  ayahs: PageAyah[];
}

/** Arabic-Indic numerals for ayah number markers (Hafs only — Warsh has them embedded) */
export function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** ﴿٣﴾ style ayah marker */
export function ayahMarker(n: number): string {
  return `﴿${toArabicNum(n)}﴾`;
}

function annotate(raw: { sura: number; aya: number; text: string; marker: string }[]): PageAyah[] {
  let prev = -1;
  return raw.map((r) => {
    const isFirstInSura = r.sura !== prev;
    prev = r.sura;
    return { ...r, isFirstInSura };
  });
}

/** Group page ayahs into sura sections */
export function groupBySura(ayahs: PageAyah[]): SuraSection[] {
  const sections: SuraSection[] = [];
  for (const ayah of ayahs) {
    if (ayah.isFirstInSura) {
      sections.push({ sura: ayah.sura, ayahs: [] });
    }
    sections[sections.length - 1].ayahs.push(ayah);
  }
  return sections;
}

/**
 * Get all ayahs for a Hafs (madina) page — synchronous, ayatJson in memory.
 * ayatJson entry: [id, sura, aya, textWithTashkeel, textPlain, page]
 */
export function getHafsPageAyahs(page: number): PageAyah[] {
  const raw = (ayatJson as any[])
    .filter((e) => e[5] === page)
    .map((e) => ({
      sura: Number(e[1]),
      aya: Number(e[2]),
      text: String(e[3]),
      marker: ayahMarker(Number(e[2])),
    }));
  return annotate(raw);
}

/**
 * Get all ayahs for a Warsh page — synchronous after initWarshDB.
 * textwarsh entries already embed ﴿n﴾ marker.
 * getWarshIndex() returns [[id, dbPage, sura, aya], ...] (dbPage = appPage+1).
 */
export function getWarshPageAyahs(page: number): PageAyah[] {
  const idx = getWarshIndex() as number[][];
  if (!idx || idx.length === 0) return [];
  const dbPage = page + 1;
  const raw = idx
    .filter((e) => e[1] === dbPage)
    .map((e) => {
      const ayaID = e[0];
      const sura = e[2];
      const aya = e[3];
      const cached = getWarshAyahContent(ayaID);
      // content field: tashkeel text, bismillah merged in aya 1 of each sura
      // content_plain: plain text with ﴿n﴾ marker at end — we use Western numerals
      const text = cached?.content ?? "";
      const marker = `﴿${aya}﴾`;
      return { sura, aya, text, marker };
    });
  return annotate(raw);
}

/** Unified getter */
export function getPageAyahs(page: number, quira: Quira): PageAyah[] {
  return quira === "warsh" ? getWarshPageAyahs(page) : getHafsPageAyahs(page);
}

/** Ayah count per sura (index 0 unused, index 1..114) */
export const SURA_AYAH_COUNTS: number[] = [0,7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

// Bismillah display constants
export const BISMILLAH_WARSH = "بِسْمِ اِ۬للَّـهِ اِ۬لرَّحْمَـٰنِ اِ۬لرَّحِيمِ";
export const BISMILLAH_HAFS  = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

/** Show bismillah before sura? (not for Fatiha or Tawba) */
export function showBismillah(sura: number): boolean {
  return sura !== 1 && sura !== 9;
}
