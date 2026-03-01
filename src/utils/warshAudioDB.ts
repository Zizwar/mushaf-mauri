import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

// ==================== TYPES ====================

export interface WarshRecitor {
  recitorId: number;
  name: string;
  description: string;
  folder: string;
}

export interface VerseTimingData {
  idAya: number;
  ayaNum: number;
  suraID: number;
  timeStart: number;
  timeEnd: number;
  fileTitle: string;
  pageNum: number;
  content: string;
  contentPlain: string;
}

// ==================== STATE ====================

let db: SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;
let initFailed = false;

// Debug log accumulator - read via getDebugLog()
const _debugLog: string[] = [];
function dbg(msg: string) {
  _debugLog.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
  console.log("[WarshDB]", msg);
}

export function getDebugLog(): string[] {
  return [..._debugLog];
}

// Cached warsh index: same format as old indexMuhammadi.js → [id, page, sura, aya][]
let _warshIndex: number[][] | null = null;


// ==================== INIT ====================

export async function initWarshDB(): Promise<void> {
  if (db) return;
  if (initFailed) { initPromise = null; initFailed = false; }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dbName = "qurantxtdb.db";
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const dbPath = `${sqliteDir}/${dbName}`;

    dbg("Starting init...");

    // 1. Ensure SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
      dbg("Created SQLite directory");
    }

    // 2. Check if DB already exists in target location
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    const existingSize = dbInfo.exists ? (dbInfo as any).size ?? 0 : 0;
    dbg(`DB exists at target: ${dbInfo.exists}${dbInfo.exists ? ` (${existingSize} bytes)` : ""}`);

    // 3. If DB doesn't exist OR is stale (size mismatch), copy from asset
    const EXPECTED_MIN_SIZE = 4_000_000; // asset DB is ~4.1MB
    const needsCopy = !dbInfo.exists || existingSize < EXPECTED_MIN_SIZE;
    if (needsCopy && dbInfo.exists) {
      dbg(`Stale DB detected (${existingSize} < ${EXPECTED_MIN_SIZE}), deleting...`);
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
    }
    if (needsCopy) {
      dbg("Copying DB from asset...");
      try {
        const asset = Asset.fromModule(require("../../assets/qurantxtdb.db"));
        dbg(`Asset hash: ${asset.hash}, uri: ${asset.uri?.substring(0, 60)}`);
        await asset.downloadAsync();
        dbg(`Asset localUri: ${asset.localUri?.substring(0, 80)}`);

        if (asset.localUri) {
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: dbPath,
          });
          const copied = await FileSystem.getInfoAsync(dbPath);
          dbg(`Copied OK: ${copied.exists} (${(copied as any).size} bytes)`);
        } else {
          dbg("ERROR: asset.localUri is null!");
        }
      } catch (copyErr: any) {
        dbg(`Copy error: ${copyErr.message}`);
      }
    }

    // 4. Open the database
    dbg("Opening database...");
    db = await openDatabaseAsync(dbName);
    dbg("Database opened OK");

    // 5. Verify: list tables
    try {
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      dbg(`Tables: ${tables.map((t) => t.name).join(", ")}`);
    } catch (e: any) {
      dbg(`Table list error: ${e.message}`);
    }

    // 6. Verify: count aya_audio rows
    try {
      const testRow = await db.getFirstAsync<{ cnt: number }>(
        "SELECT count(*) as cnt FROM aya_audio"
      );
      dbg(`aya_audio count: ${testRow?.cnt}`);
    } catch (e: any) {
      dbg(`Count error: ${e.message}`);
    }

    // 7. Test: get first verse
    try {
      const firstVerse = await db.getFirstAsync<{ content: string }>(
        "SELECT content FROM aya_audio WHERE suraID=1 AND ayaNum=1"
      );
      dbg(`First verse: ${firstVerse?.content?.substring(0, 40) ?? "NULL"}`);
    } catch (e: any) {
      dbg(`First verse error: ${e.message}`);
    }

    // 8. Load warsh index
    if (!_warshIndex) {
      try {
        const rows = await db.getAllAsync<{
          idAya: number;
          pageNum: number;
          suraID: number;
          ayaNum: number;
        }>(
          `SELECT x.idAya, x.pageNum, a.suraID, a.ayaNum
           FROM ayaXYP x
           JOIN aya_audio a ON x.idAya = a.ayaID
           ORDER BY x.idAya`
        );
        _warshIndex = rows.map((r) => [r.idAya, r.pageNum, r.suraID, r.ayaNum]);
        dbg(`warshIndex loaded: ${_warshIndex.length} entries`);
      } catch (e: any) {
        dbg(`Index load error: ${e.message}`);
      }
    }

    dbg("Init complete!");
  })().catch((e: any) => {
    dbg(`INIT FAILED: ${e.message}`);
    initFailed = true;
    db = null;
  });

  return initPromise;
}

/**
 * Get the warsh index synchronously.
 */
export function getWarshIndex(): number[][] {
  return _warshIndex ?? [];
}

export function isWarshIndexReady(): boolean {
  return _warshIndex !== null && _warshIndex.length > 0;
}

// ==================== TEXT QUERIES ====================

export async function getWarshAyahText(
  sura: number,
  aya: number
): Promise<string | null> {
  try {
    if (!db) await initWarshDB();
    if (!db) return null;
    const row = await db.getFirstAsync<{ content: string }>(
      `SELECT content FROM aya_audio WHERE suraID = ? AND ayaNum = ?`,
      [sura, aya]
    );
    return row?.content ?? null;
  } catch (e) {
    console.error("[WarshDB] getWarshAyahText error:", e);
    return null;
  }
}

export async function getWarshSuraText(
  sura: number,
  fromAya: number = 1,
  toAya: number = 999
): Promise<{ aya: number; text: string }[]> {
  try {
    if (!db) await initWarshDB();
    if (!db) return [];
    const rows = await db.getAllAsync<{ ayaNum: number; content: string }>(
      `SELECT ayaNum, content FROM aya_audio
       WHERE suraID = ? AND ayaNum >= ? AND ayaNum <= ?
       ORDER BY ayaNum`,
      [sura, fromAya, toAya]
    );
    return rows.map((r) => ({ aya: r.ayaNum, text: r.content }));
  } catch (e) {
    console.error("[WarshDB] getWarshSuraText error:", e);
    return [];
  }
}

export interface WarshSearchResult {
  sura: number;
  aya: number;
  page: number;
  text: string;
}

export async function searchWarshText(
  query: string,
  limit: number = 100
): Promise<WarshSearchResult[]> {
  try {
    if (!db) await initWarshDB();
    if (!db) return [];
    const rows = await db.getAllAsync<{
      suraID: number;
      ayaNum: number;
      pageNum: number;
      content: string;
    }>(
      `SELECT a.suraID, a.ayaNum, x.pageNum, a.content
       FROM aya_audio a
       JOIN ayaXYP x ON a.ayaID = x.idAya
       WHERE a."content_plain" LIKE ?
       ORDER BY a.ayaID
       LIMIT ?`,
      [`%${query}%`, limit]
    );
    return rows.map((r) => ({
      sura: r.suraID,
      aya: r.ayaNum,
      page: r.pageNum,
      text: r.content,
    }));
  } catch (e) {
    console.error("[WarshDB] searchWarshText error:", e);
    return [];
  }
}

export async function closeWarshDB(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
  }
}

// ==================== AUDIO QUERIES ====================

export async function getWarshRecitors(): Promise<WarshRecitor[]> {
  try {
    if (!db) await initWarshDB();
    if (!db) return [];
    const rows = await db.getAllAsync<{
      recitorID: number;
      name: string;
      description: string;
      folder: string;
    }>("SELECT recitorID, name, description, folder FROM recitor_audio");
    return rows.map((r) => ({
      recitorId: r.recitorID,
      name: r.name,
      description: r.description,
      folder: r.folder,
    }));
  } catch (e) {
    console.error("[WarshDB] getWarshRecitors error:", e);
    return [];
  }
}

export async function getAudioFileForPage(
  recitorId: number,
  appPage: number
): Promise<string | null> {
  try {
    if (!db) await initWarshDB();
    if (!db) return null;
    const dbPage = appPage + 1;
    const row = await db.getFirstAsync<{ fileTitle: string }>(
      `SELECT DISTINCT t.fileTitle
       FROM ayaTiming_audio t
       JOIN ayaXYP x ON t.idAya = x.idAya
       WHERE t.idRecitor = ? AND x.pageNum = ?
       LIMIT 1`,
      [recitorId, dbPage]
    );
    return row?.fileTitle ?? null;
  } catch (e) {
    console.error("[WarshDB] getAudioFileForPage error:", e);
    return null;
  }
}

export async function getVersesForFile(
  recitorId: number,
  fileTitle: string
): Promise<VerseTimingData[]> {
  try {
    if (!db) await initWarshDB();
    if (!db) return [];
    const rows = await db.getAllAsync<{
      idAya: number;
      ayaNum: number;
      suraID: number;
      timeStart: number;
      timeEnd: number;
      fileTitle: string;
      pageNum: number;
      content: string;
      cplain: string;
    }>(
      `SELECT t.idAya, a.ayaNum, a.suraID, t.timeStart, t.timeEnd, t.fileTitle, x.pageNum,
              a.content, a."content_plain" AS cplain
       FROM ayaTiming_audio t
       JOIN aya_audio a ON t.idAya = a.ayaID
       JOIN ayaXYP x ON t.idAya = x.idAya
       WHERE t.idRecitor = ? AND t.fileTitle = ?
       ORDER BY t.idAya`,
      [recitorId, fileTitle]
    );
    return rows.map((r) => ({
      idAya: r.idAya,
      ayaNum: r.ayaNum,
      suraID: r.suraID,
      timeStart: r.timeStart,
      timeEnd: r.timeEnd,
      fileTitle: r.fileTitle,
      pageNum: r.pageNum,
      content: r.content,
      contentPlain: r.cplain,
    }));
  } catch (e) {
    console.error("[WarshDB] getVersesForFile error:", e);
    return [];
  }
}

export function findVerseIndex(
  verses: VerseTimingData[],
  sura: number,
  aya: number
): number {
  return verses.findIndex((v) => v.suraID === sura && v.ayaNum === aya);
}

// ==================== QUADRATIC TIMING ====================

export function apiToSeconds(
  val: number,
  maxTimeEnd: number,
  totalDuration: number
): number {
  if (maxTimeEnd <= 0 || totalDuration <= 0) return 0;
  return totalDuration * Math.sqrt(val / maxTimeEnd);
}

export function secondsToApi(
  seconds: number,
  maxTimeEnd: number,
  totalDuration: number
): number {
  if (totalDuration <= 0) return 0;
  return maxTimeEnd * Math.pow(seconds / totalDuration, 2);
}

export function getMaxTimeEnd(verses: VerseTimingData[]): number {
  if (verses.length === 0) return 0;
  return Math.max(...verses.map((v) => v.timeEnd));
}
