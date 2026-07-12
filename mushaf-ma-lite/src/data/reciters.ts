// Famous reciters available for comparison playback.
// IDs are KSU (quran.ksu.edu.sa) per-ayah mp3 folder names — Hafs numbering.
export interface Reciter {
  id: string;
  nameAr: string;
  nameLat: string;
}

export const RECITERS: Reciter[] = [
  { id: "Husary_64kbps", nameAr: "محمود خليل الحصري", nameLat: "Al-Husary" },
  { id: "Minshawy_Murattal_128kbps", nameAr: "محمد صديق المنشاوي", nameLat: "Al-Minshawy" },
  { id: "Abdul_Basit_Murattal_64kbps", nameAr: "عبد الباسط عبد الصمد", nameLat: "Abdul Basit" },
  { id: "Hudhaify_64kbps", nameAr: "علي الحذيفي", nameLat: "Al-Hudhaify" },
  { id: "Alafasy_64kbps", nameAr: "مشاري العفاسي", nameLat: "Al-Afasy" },
  { id: "Muhammad_Ayyoub_64kbps", nameAr: "محمد أيوب", nameLat: "Muhammad Ayyoub" },
  { id: "Mohammad_al_Tablaway_64kbps", nameAr: "محمد الطبلاوي", nameLat: "At-Tablaway" },
  { id: "Abu_Bakr_Ash-Shaatree_64kbps", nameAr: "أبو بكر الشاطري", nameLat: "Ash-Shaatree" },
  { id: "Nasser_Alqatami_128kbps", nameAr: "ناصر القطامي", nameLat: "Al-Qatami" },
  { id: "Abdullah_Basfar_64kbps", nameAr: "عبد الله بصفر", nameLat: "Basfar" },
];

export const DEFAULT_RECITER_ID = RECITERS[0].id;

export function getReciterName(id: string, lang: string): string {
  const r = RECITERS.find((x) => x.id === id);
  if (!r) return id;
  return lang === "ar" ? r.nameAr : r.nameLat;
}
