import { Paths, File, Directory } from "expo-file-system";
import { openDatabaseAsync } from "expo-sqlite";

// ==============================================================
// Warsh → Hafs Ayah Mapping
// ==============================================================

/**
 * Exception map for surahs where Warsh (Madani) ayah numbering
 * differs from Hafs (Kufi) numbering.
 *
 * Types:
 * - "manual": full explicit map (Al-Fatihah)
 * - "offset": simple fawatih merge with constant offset for all subsequent ayahs
 * - "advanced": explicit_map for merge/split points + ranges with variable offsets
 *   (for surahs with internal shifts or count mismatches)
 */
const WARSH_EXCEPTIONS: Record<
  number,
  | { type: "manual"; map: Record<number, number[]> }
  | { type: "offset"; mergeAtWarshAyah: number; hafsTargetsToMerge: number[]; offsetForSubsequent: number }
  | { type: "advanced"; explicit_map: Record<number, number[]>; ranges: { warshStart: number; warshEnd: number; hafsOffset: number }[] }
> = {
  1: {
    type: "manual",
    map: { 1: [2], 2: [3], 3: [4], 4: [5], 5: [6], 6: [7], 7: [7] },
  },
  // === Category 1: Simple Fawatih Offset (+1) — 17 surahs ===
  // Warsh merges fawatih letters + next ayah into one; subsequent ayahs offset +1
  // الم surahs:
  2: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  29: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  30: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  31: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  32: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // المص:
  7: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // طه:
  20: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // طسم:
  26: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  28: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // يس:
  36: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // ص:
  38: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // حم surahs:
  40: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  41: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  43: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  44: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  45: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  46: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },

  // === Category 2: Double Fawatih Offset (+2) — Ash-Shura ===
  // Warsh merges {حم} + {عسق} + next verse into one ayah → offset +2
  42: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2, 3], offsetForSubsequent: 2 },

  // === Category 3: Complex Structural Shifts ===

  // Al-Imran (3): 200 ayahs in both. Warsh merges الم (ayahs 1+2), but splits
  // Hafs ayah 92 at {مما تحبون} to compensate → offset returns to 0 from ayah 93.
  3: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 91: [92], 92: [92] },
    ranges: [
      { warshStart: 2, warshEnd: 90, hafsOffset: 1 },
      { warshStart: 93, warshEnd: 200, hafsOffset: 0 },
    ],
  },

  // Maryam (19): Hafs 98 ayahs, Warsh 99 ayahs. Warsh merges كهيعص (1+2),
  // but splits Hafs ayah 42 at {واذكر في الكتاب إبراهيم} → offset 0 from 43.
  // A second split near the end accounts for Warsh having 99 total.
  // TODO: verify second split point (likely near ayah 96-97)
  19: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 41: [42], 42: [42] },
    ranges: [
      { warshStart: 2, warshEnd: 40, hafsOffset: 1 },
      { warshStart: 43, warshEnd: 99, hafsOffset: 0 },
    ],
  },

  // Muhammad (47): Warsh 39 ayahs, Hafs 38. Warsh splits Hafs ayah 15
  // at {لذة للشاربين}. Warsh 15 & 16 both map to Hafs 15.
  47: {
    type: "advanced",
    explicit_map: { 15: [15], 16: [15] },
    ranges: [
      { warshStart: 1, warshEnd: 14, hafsOffset: 0 },
      { warshStart: 17, warshEnd: 39, hafsOffset: -1 },
    ],
  },
};

/**
 * Map a Warsh ayah number to the corresponding Hafs ayah number(s).
 * Returns an array of Hafs ayah numbers to fetch (usually 1, sometimes 2 for merged fawatih).
 */
export function warshToHafsAyahs(sura: number, warshAya: number): number[] {
  const exception = WARSH_EXCEPTIONS[sura];
  if (!exception) return [warshAya]; // 1:1 mapping

  if (exception.type === "manual") {
    return exception.map[warshAya] ?? [warshAya];
  }

  if (exception.type === "advanced") {
    // Check explicit_map first (merge/split points)
    const mapped = exception.explicit_map[warshAya];
    if (mapped) return mapped;
    // Find matching range
    for (const r of exception.ranges) {
      if (warshAya >= r.warshStart && warshAya <= r.warshEnd) {
        return [warshAya + r.hafsOffset];
      }
    }
    return [warshAya];
  }

  // offset type (simple fawatih)
  if (warshAya === exception.mergeAtWarshAyah) {
    return exception.hafsTargetsToMerge;
  }
  return [warshAya + exception.offsetForSubsequent];
}

// ==============================================================
// URL Builders
// ==============================================================

const BASE_URL = "https://quran.ksu.edu.sa/";

export const getTafsirUri = (
  author: string,
  sura: number,
  aya: number
): string =>
  `${BASE_URL}interface.php?ui=mobile&do=tafsir&author=${author || "sa3dy"}&sura=${sura}&aya=${aya}`;

export const getTarjamaUri = (
  tarjama: string,
  sura: number,
  aya: number
): string =>
  `${BASE_URL}interface.php?ui=mobile&do=tarjama&tafsir=${tarjama || "ar_muyassar"}&b_sura=${sura}&b_aya=${aya}&e_sura=${sura}&e_aya=${aya}`;

export const getDBTafsirUrl = (db: string): string =>
  `${BASE_URL}ayat/resources/tafasir/${db}.ayt`;

export const getDBTarajemUrl = (db: string): string =>
  `${BASE_URL}ayat/resources/tarajem/${db}.ayt`;

// ==============================================================
// Online Fetching
// ==============================================================

/**
 * Strip HTML tags and decode common HTML entities.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Fetch tafsir text from KSU online API.
 */
export async function fetchTafsirOnline(
  author: string,
  sura: number,
  aya: number
): Promise<string> {
  const uri = getTafsirUri(author, sura, aya);
  const response = await fetch(uri, {
    headers: {
      Accept: "text/html, application/xhtml+xml, */*",
      "Accept-Language": "ar",
    },
  });

  if (!response.ok) {
    throw new Error(`Tafsir request failed: ${response.status}`);
  }

  const html = await response.text();
  const text = stripHtml(html);

  if (!text || text.length < 2) {
    throw new Error("Empty tafsir response");
  }

  return text;
}

/**
 * Try to extract translation text from a JSON response.
 * The KSU API sometimes returns JSON like {"tafsir":{"1":"text"}} or {"tafsir":{}}
 */
function extractFromJson(raw: string): string | null {
  try {
    const json = JSON.parse(raw);
    // Handle {"tafsir":{"1":"text here"}} format
    if (json?.tafsir && typeof json.tafsir === "object") {
      const values = Object.values(json.tafsir);
      if (values.length > 0) {
        return values.map((v) => (typeof v === "string" ? stripHtml(v) : "")).join("\n").trim();
      }
      return null; // empty tafsir object
    }
    // Handle {"text":"..."} format
    if (json?.text && typeof json.text === "string") {
      return stripHtml(json.text);
    }
    return null;
  } catch {
    return null; // not JSON
  }
}

/**
 * Fetch translation (tarjama) text from KSU online API.
 */
export async function fetchTarjamaOnline(
  tarjama: string,
  sura: number,
  aya: number
): Promise<string> {
  const uri = getTarjamaUri(tarjama, sura, aya);
  const response = await fetch(uri, {
    headers: {
      Accept: "text/html, application/xhtml+xml, */*",
      "Accept-Language": "ar",
    },
  });

  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  const raw = await response.text();

  // Check if response is JSON (API returns {"tafsir":{}} when unavailable)
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const jsonText = extractFromJson(trimmed);
    if (jsonText && jsonText.length > 1) {
      return jsonText;
    }
    throw new Error("no_translation");
  }

  const text = stripHtml(raw);

  if (!text || text.length < 2) {
    throw new Error("no_translation");
  }

  return text;
}

// ==============================================================
// Offline SQLite
// ==============================================================

/**
 * Get the SQLite directory inside the document directory.
 */
function getSQLiteDir(): Directory {
  return new Directory(Paths.document, "SQLite");
}

/**
 * Get the path for a specific database file.
 */
function getDBFile(author: string): File {
  return new File(getSQLiteDir(), `${author}.db`);
}

/**
 * Ensure the SQLite directory exists.
 */
function ensureSQLiteDir(): void {
  const dir = getSQLiteDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/**
 * Check if a tafsir/translation database file is available locally.
 */
export function isDBAvailable(author: string): boolean {
  try {
    return getDBFile(author).exists;
  } catch {
    return false;
  }
}

/**
 * Fetch tafsir from a local SQLite database.
 * Returns null if the database does not exist or the query fails.
 */
export async function fetchTafsirOffline(
  author: string,
  sura: number,
  aya: number
): Promise<string | null> {
  try {
    if (!isDBAvailable(author)) return null;

    const db = await openDatabaseAsync(`${author}.db`);
    const row = await db.getFirstAsync<{ text?: string; nass?: string }>(
      `SELECT * FROM ${author} WHERE sura = ? AND aya = ?`,
      [sura, aya]
    );

    if (!row) return null;

    // The KSU .ayt databases use either "text" or "nass" as the column name
    return row.text ?? row.nass ?? null;
  } catch {
    return null;
  }
}

/**
 * Download a .ayt database file from KSU and save it locally as a SQLite DB.
 * Returns true on success, false on failure.
 */
export async function downloadTafsirDB(
  author: string,
  type: "tafsir" | "tarajem"
): Promise<boolean> {
  try {
    ensureSQLiteDir();

    const remoteUrl =
      type === "tafsir" ? getDBTafsirUrl(author) : getDBTarajemUrl(author);

    const destination = getDBFile(author);

    await File.downloadFileAsync(remoteUrl, destination, {
      idempotent: true,
    });

    return destination.exists;
  } catch {
    // Cleanup partial download if it exists
    try {
      const dbFile = getDBFile(author);
      if (dbFile.exists) {
        dbFile.delete();
      }
    } catch {
      // Ignore cleanup errors
    }
    return false;
  }
}
