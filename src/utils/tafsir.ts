import { Paths, File, Directory } from "expo-file-system";
import { openDatabaseAsync } from "expo-sqlite";

// Warsh → Hafs mapping lives in warshMapping.ts (re-exported for backwards compatibility)
export { warshToHafsAyahs } from "./warshMapping";

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

/**
 * Build a tarjama URL fetching ayahs [bAya, eAya) — eAya is exclusive.
 * The KSU API returns empty when bAya === eAya; always pass eAya = lastAya + 1.
 */
export const getTarjamaUri = (
  tarjama: string,
  sura: number,
  bAya: number,
  eAya: number
): string =>
  `${BASE_URL}interface.php?ui=mobile&do=tarjama&tafsir=${tarjama || "ar_muyassar"}&b_sura=${sura}&b_aya=${bAya}&e_sura=${sura}&e_aya=${eAya}`;

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
 * The KSU tarjama API returns:
 *   {"tafsir":{"2_1":{"text":"..."},"2_2":{"text":"..."}}}
 * Values are sorted by key (sura_aya) so order is preserved.
 */
function extractFromJson(raw: string): string | null {
  try {
    const json = JSON.parse(raw);
    if (json?.tafsir && typeof json.tafsir === "object") {
      // Sort entries by key so multi-ayah results appear in order
      const entries = Object.entries(json.tafsir).sort(([a], [b]) => a.localeCompare(b));
      if (entries.length === 0) return null;

      const texts = entries
        .map(([, v]) => {
          if (typeof v === "string") return stripHtml(v);
          if (v && typeof v === "object" && "text" in v) return stripHtml((v as { text: string }).text);
          return "";
        })
        .filter(Boolean);

      return texts.length > 0 ? texts.join("\n\n") : null;
    }
    if (json?.text && typeof json.text === "string") {
      return stripHtml(json.text);
    }
    return null;
  } catch {
    return null; // not JSON
  }
}

/**
 * Fetch translation (tarjama) for one or more consecutive Hafs ayahs.
 * Uses the KSU range API (b_aya / e_aya) in a single request.
 * e_aya is exclusive: to fetch ayah n, pass bAya=n, eAya=n+1.
 *
 * @param hafsAyahs - Hafs ayah number(s). For a Warsh merged ayah this can be [n, n+1].
 */
export async function fetchTarjamaOnline(
  tarjama: string,
  sura: number,
  hafsAyahs: number[]
): Promise<string> {
  const bAya = hafsAyahs[0];
  const eAya = hafsAyahs[hafsAyahs.length - 1] + 1; // exclusive end
  const uri = getTarjamaUri(tarjama, sura, bAya, eAya);

  const response = await fetch(uri, {
    headers: {
      Accept: "application/json, text/html, */*",
      "Accept-Language": "ar",
    },
  });

  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  const raw = await response.text();
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
 * Fetch tarjama for one or more Hafs ayahs from a local SQLite database.
 * Returns null if the database does not exist, is missing rows, or fails.
 */
export async function fetchTarjamaOffline(
  tarjama: string,
  sura: number,
  hafsAyahs: number[]
): Promise<string | null> {
  try {
    if (!isDBAvailable(tarjama)) return null;

    const db = await openDatabaseAsync(`${tarjama}.db`);
    const texts: string[] = [];

    for (const aya of hafsAyahs) {
      const row = await db.getFirstAsync<{ text?: string; nass?: string }>(
        `SELECT * FROM ${tarjama} WHERE sura = ? AND aya = ?`,
        [sura, aya]
      );
      const raw = row?.text ?? row?.nass ?? null;
      if (raw) texts.push(stripHtml(raw));
    }

    return texts.length > 0 ? texts.join("\n\n") : null;
  } catch {
    return null;
  }
}

/**
 * Fetch tafsir from a local SQLite database.
 * Strips HTML tags (KSU tafsir DBs store HTML content).
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

    const raw = row.text ?? row.nass ?? null;
    return raw ? stripHtml(raw) : null;
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
