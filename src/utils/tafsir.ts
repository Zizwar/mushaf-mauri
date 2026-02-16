import { Paths, File, Directory } from "expo-file-system";
import { openDatabaseAsync } from "expo-sqlite";

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
