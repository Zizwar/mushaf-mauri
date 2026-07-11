import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Riwaya } from "../store/useAppStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionMarker {
  aya: number;
  tMs: number;
}

export interface UploadInfo {
  id: string;
  url: string; // share page URL
  audioUrl: string;
  ownerToken: string;
  isPublic: boolean;
  uploadedAt: string;
  serverUrl: string;
}

export interface RecitationMeta {
  id: string;
  v: 1;
  type: "ayah" | "session";
  riwaya: Riwaya;
  sura: number;
  ayaFrom: number;
  ayaTo: number; // === ayaFrom for type "ayah"
  durationMs: number;
  createdAt: string; // ISO
  markers?: SessionMarker[]; // session only
  noteText?: string;
  hasVoiceNote?: boolean;
  upload?: UploadInfo;
}

export interface BackupFile {
  format: "mushaf-ma-lite-backup";
  version: 1;
  exportDate: string;
  items: {
    meta: Omit<RecitationMeta, "upload">;
    audioBase64: string;
    voiceNoteBase64?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Paths & helpers
// ---------------------------------------------------------------------------

function baseDir(): Directory {
  return new Directory(Paths.document, "recitations");
}

function audioDir(): Directory {
  return new Directory(baseDir(), "audio");
}

function notesDir(): Directory {
  return new Directory(baseDir(), "notes");
}

function indexFile(): File {
  return new File(baseDir(), "index.json");
}

function ensureDirs(): void {
  for (const dir of [baseDir(), audioDir(), notesDir()]) {
    if (!dir.exists) dir.create({ intermediates: true });
  }
}

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function audioFile(id: string): File {
  return new File(audioDir(), `${id}.m4a`);
}

function voiceNoteFile(id: string): File {
  return new File(notesDir(), `${id}.m4a`);
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export function loadIndex(): RecitationMeta[] {
  const file = indexFile();
  if (!file.exists) return [];
  try {
    const parsed = JSON.parse(file.textSync()) as RecitationMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIndex(list: RecitationMeta[]): void {
  ensureDirs();
  const file = indexFile();
  if (!file.exists) file.create();
  file.write(JSON.stringify(list));
}

export function getRecitation(id: string): RecitationMeta | undefined {
  return loadIndex().find((r) => r.id === id);
}

export function getAudioUri(id: string): string | null {
  const f = audioFile(id);
  return f.exists ? f.uri : null;
}

export function getVoiceNoteUri(id: string): string | null {
  const f = voiceNoteFile(id);
  return f.exists ? f.uri : null;
}

/** Existing ayah-type recording for (sura, aya, riwaya), if any. */
export function findAyahRecording(
  sura: number,
  aya: number,
  riwaya: Riwaya
): RecitationMeta | undefined {
  return loadIndex().find(
    (r) =>
      r.type === "ayah" &&
      r.sura === sura &&
      r.ayaFrom === aya &&
      r.riwaya === riwaya
  );
}

/** Map "sura:aya" -> true for quick recorded-badge lookups in a sura. */
export function recordedAyahMap(
  sura: number,
  riwaya: Riwaya
): Record<number, boolean> {
  const map: Record<number, boolean> = {};
  for (const r of loadIndex()) {
    if (r.type === "ayah" && r.sura === sura && r.riwaya === riwaya) {
      map[r.ayaFrom] = true;
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Create / delete
// ---------------------------------------------------------------------------

/**
 * Save an ayah-by-ayah take. Replace semantics: re-recording the same
 * (sura, aya, riwaya) overwrites the audio and refreshes duration/date but
 * keeps the id, notes and upload info of the previous take.
 */
export function saveAyahRecording(
  tempUri: string,
  params: { sura: number; aya: number; riwaya: Riwaya; durationMs: number }
): RecitationMeta {
  ensureDirs();
  const list = loadIndex();
  const existing = list.find(
    (r) =>
      r.type === "ayah" &&
      r.sura === params.sura &&
      r.ayaFrom === params.aya &&
      r.riwaya === params.riwaya
  );

  const id = existing ? existing.id : generateId();
  const dest = audioFile(id);
  if (dest.exists) dest.delete();
  new File(tempUri).move(dest);

  if (existing) {
    existing.durationMs = params.durationMs;
    existing.createdAt = new Date().toISOString();
    saveIndex(list);
    return existing;
  }

  const meta: RecitationMeta = {
    id,
    v: 1,
    type: "ayah",
    riwaya: params.riwaya,
    sura: params.sura,
    ayaFrom: params.aya,
    ayaTo: params.aya,
    durationMs: params.durationMs,
    createdAt: new Date().toISOString(),
  };
  list.push(meta);
  saveIndex(list);
  return meta;
}

export function saveSessionRecording(
  tempUri: string,
  params: {
    sura: number;
    ayaFrom: number;
    ayaTo: number;
    riwaya: Riwaya;
    durationMs: number;
    markers?: SessionMarker[];
  }
): RecitationMeta {
  ensureDirs();
  const id = generateId();
  const dest = audioFile(id);
  if (dest.exists) dest.delete();
  new File(tempUri).move(dest);

  const meta: RecitationMeta = {
    id,
    v: 1,
    type: "session",
    riwaya: params.riwaya,
    sura: params.sura,
    ayaFrom: params.ayaFrom,
    ayaTo: params.ayaTo,
    durationMs: params.durationMs,
    createdAt: new Date().toISOString(),
    markers:
      params.markers && params.markers.length > 1 ? params.markers : undefined,
  };
  const list = loadIndex();
  list.push(meta);
  saveIndex(list);
  return meta;
}

export function deleteRecitation(id: string): void {
  const audio = audioFile(id);
  if (audio.exists) audio.delete();
  const note = voiceNoteFile(id);
  if (note.exists) note.delete();
  saveIndex(loadIndex().filter((r) => r.id !== id));
}

// ---------------------------------------------------------------------------
// Notes (text + voice)
// ---------------------------------------------------------------------------

export function saveTextNote(id: string, text: string): void {
  const list = loadIndex();
  const meta = list.find((r) => r.id === id);
  if (!meta) return;
  const trimmed = text.trim();
  if (trimmed) meta.noteText = trimmed;
  else delete meta.noteText;
  saveIndex(list);
}

export function attachVoiceNote(id: string, tempUri: string): void {
  ensureDirs();
  const list = loadIndex();
  const meta = list.find((r) => r.id === id);
  if (!meta) return;
  const dest = voiceNoteFile(id);
  if (dest.exists) dest.delete();
  new File(tempUri).move(dest);
  meta.hasVoiceNote = true;
  saveIndex(list);
}

export function deleteVoiceNote(id: string): void {
  const list = loadIndex();
  const meta = list.find((r) => r.id === id);
  const f = voiceNoteFile(id);
  if (f.exists) f.delete();
  if (meta) {
    delete meta.hasVoiceNote;
    saveIndex(list);
  }
}

// ---------------------------------------------------------------------------
// Upload info
// ---------------------------------------------------------------------------

export function setUploadInfo(id: string, upload: UploadInfo | null): void {
  const list = loadIndex();
  const meta = list.find((r) => r.id === id);
  if (!meta) return;
  if (upload) meta.upload = upload;
  else delete meta.upload;
  saveIndex(list);
}

// ---------------------------------------------------------------------------
// Export / import (.mlrec)
// ---------------------------------------------------------------------------

export async function exportRecitations(
  ids: string[],
  fileLabel: string
): Promise<boolean> {
  const list = loadIndex();
  const items: BackupFile["items"] = [];

  for (const id of ids) {
    const meta = list.find((r) => r.id === id);
    if (!meta) continue;
    const audio = audioFile(id);
    if (!audio.exists) continue;
    const { upload: _upload, ...metaNoUpload } = meta;
    const item: BackupFile["items"][number] = {
      meta: metaNoUpload,
      audioBase64: audio.base64Sync(),
    };
    if (meta.hasVoiceNote) {
      const note = voiceNoteFile(id);
      if (note.exists) item.voiceNoteBase64 = note.base64Sync();
    }
    items.push(item);
  }

  if (items.length === 0) return false;

  const backup: BackupFile = {
    format: "mushaf-ma-lite-backup",
    version: 1,
    exportDate: new Date().toISOString(),
    items,
  };

  const tempDir = new Directory(Paths.cache, "exports");
  if (!tempDir.exists) tempDir.create({ intermediates: true });

  const sanitized =
    fileLabel.replace(/[^a-zA-Z0-9؀-ۿ]/g, "_") || "recitations";
  const tempFile = new File(tempDir, `${sanitized}.mlrec`);
  if (tempFile.exists) tempFile.delete();
  tempFile.create();
  tempFile.write(JSON.stringify(backup));

  await Sharing.shareAsync(tempFile.uri, {
    mimeType: "application/json",
    dialogTitle: fileLabel,
    UTI: "ma.wino.mushaf.mlrec",
  });
  return true;
}

function importFromContent(content: string): number {
  const backup = JSON.parse(content) as BackupFile;
  if (backup.format !== "mushaf-ma-lite-backup" || !Array.isArray(backup.items)) {
    throw new Error("invalid format");
  }

  ensureDirs();
  const list = loadIndex();
  let imported = 0;

  for (const item of backup.items) {
    if (!item?.meta || !item.audioBase64) continue;
    const id = generateId(); // always re-key on import to avoid collisions
    const audio = audioFile(id);
    if (audio.exists) audio.delete();
    audio.create();
    audio.write(item.audioBase64, { encoding: "base64" });

    const meta: RecitationMeta = {
      ...item.meta,
      id,
      v: 1,
      hasVoiceNote: false,
    };
    if (item.voiceNoteBase64) {
      const note = voiceNoteFile(id);
      if (note.exists) note.delete();
      note.create();
      note.write(item.voiceNoteBase64, { encoding: "base64" });
      meta.hasVoiceNote = true;
    }
    list.push(meta);
    imported++;
  }

  saveIndex(list);
  return imported;
}

/** Import via system file picker. Returns number of imported items, or null on cancel/error. */
export async function importBackup(): Promise<number | null> {
  try {
    const picked = await File.pickFileAsync();
    const pickedFile = Array.isArray(picked) ? picked[0] : picked;
    if (!pickedFile || !pickedFile.exists) return null;
    return importFromContent(pickedFile.textSync());
  } catch {
    return null;
  }
}

/** Import from a URI (file association / deep link / http). */
export async function importFromUri(uri: string): Promise<number | null> {
  try {
    let content: string;
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const response = await fetch(uri);
      if (!response.ok) return null;
      content = await response.text();
    } else {
      const file = new File(uri);
      if (!file.exists) return null;
      content = file.textSync();
    }
    return importFromContent(content);
  } catch {
    return null;
  }
}

/** Share the raw audio file of a recitation via the system share sheet. */
export async function shareAudioFile(
  id: string,
  label: string
): Promise<boolean> {
  const f = audioFile(id);
  if (!f.exists) return false;
  await Sharing.shareAsync(f.uri, {
    mimeType: "audio/mp4",
    dialogTitle: label,
  });
  return true;
}
