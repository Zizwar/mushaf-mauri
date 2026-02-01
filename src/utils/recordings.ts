import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Quira, RecordingProfile } from "../store/useAppStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordingBackup {
  format: "mushaf-mauri-recording-backup";
  version: 1;
  quira: string;
  profile: RecordingProfile;
  exportDate: string;
  recordings: { sura: number; aya: number; base64: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getQuiraDir(quira: Quira): Directory {
  return new Directory(Paths.document, "recordings", quira);
}

function getProfileDir(quira: Quira, profileId: string): Directory {
  return new Directory(getQuiraDir(quira), profileId);
}

function getProfilesFile(quira: Quira): File {
  return new File(getQuiraDir(quira), "profiles.json");
}

function buildKey(sura: number, aya: number): string {
  const s = String(sura).padStart(3, "0");
  const a = String(aya).padStart(3, "0");
  return `s${s}a${a}`;
}

function getFile(
  sura: number,
  aya: number,
  quira: Quira,
  profileId: string
): File {
  return new File(
    getProfileDir(quira, profileId),
    `${buildKey(sura, aya)}.m4a`
  );
}

function ensureDir(quira: Quira, profileId: string): void {
  const dir = getProfileDir(quira, profileId);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

// ---------------------------------------------------------------------------
// Profile Management
// ---------------------------------------------------------------------------

function saveProfilesList(
  quira: Quira,
  profiles: RecordingProfile[]
): void {
  const quiraDir = getQuiraDir(quira);
  if (!quiraDir.exists) {
    quiraDir.create({ intermediates: true });
  }
  const profilesFile = getProfilesFile(quira);
  if (!profilesFile.exists) profilesFile.create();
  profilesFile.write(JSON.stringify(profiles));
}

/**
 * Load profiles from profiles.json. Migrates old flat recordings if needed.
 */
export function loadProfiles(quira: Quira): RecordingProfile[] {
  const quiraDir = getQuiraDir(quira);
  const profilesFile = getProfilesFile(quira);

  if (profilesFile.exists) {
    try {
      const content = profilesFile.textSync();
      return JSON.parse(content) as RecordingProfile[];
    } catch {
      return [];
    }
  }

  // Migration: check for old flat .m4a files
  if (!quiraDir.exists) return [];

  const items = quiraDir.list();
  const m4aFiles = items.filter(
    (item): item is File =>
      item instanceof File && item.uri.endsWith(".m4a")
  );

  if (m4aFiles.length === 0) return [];

  // Create default profile and migrate old recordings
  const defaultProfile: RecordingProfile = {
    id: generateId(),
    name: "\u062a\u0633\u062c\u064a\u0644\u064a",
    createdAt: new Date().toISOString(),
  };

  const profileDir = getProfileDir(quira, defaultProfile.id);
  if (!profileDir.exists) {
    profileDir.create({ intermediates: true });
  }

  for (const file of m4aFiles) {
    const fileName = file.uri.split("/").pop()!;
    const dest = new File(profileDir, fileName);
    file.move(dest);
  }

  saveProfilesList(quira, [defaultProfile]);
  return [defaultProfile];
}

export function createProfile(
  quira: Quira,
  name: string
): RecordingProfile {
  const profiles = loadProfiles(quira);
  const profile: RecordingProfile = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };
  profiles.push(profile);
  saveProfilesList(quira, profiles);
  ensureDir(quira, profile.id);
  return profile;
}

export function renameProfile(
  quira: Quira,
  profileId: string,
  newName: string
): void {
  const profiles = loadProfiles(quira);
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx >= 0) {
    profiles[idx].name = newName;
    saveProfilesList(quira, profiles);
  }
}

export function deleteProfile(
  quira: Quira,
  profileId: string
): void {
  const profiles = loadProfiles(quira);
  const filtered = profiles.filter((p) => p.id !== profileId);
  saveProfilesList(quira, filtered);
  const dir = getProfileDir(quira, profileId);
  if (dir.exists) {
    dir.delete();
  }
}

// ---------------------------------------------------------------------------
// Recording CRUD (profile-aware)
// ---------------------------------------------------------------------------

export function saveRecording(
  tempUri: string,
  sura: number,
  aya: number,
  quira: Quira,
  profileId: string
): string {
  ensureDir(quira, profileId);
  const dest = getFile(sura, aya, quira, profileId);
  if (dest.exists) {
    dest.delete();
  }
  const tempFile = new File(tempUri);
  tempFile.move(dest);
  return dest.uri;
}

export function getRecordingUri(
  sura: number,
  aya: number,
  quira: Quira,
  profileId: string
): string | null {
  const file = getFile(sura, aya, quira, profileId);
  return file.exists ? file.uri : null;
}

export function hasRecording(
  sura: number,
  aya: number,
  recordedAyahs: Record<string, boolean>
): boolean {
  return !!recordedAyahs[`s${sura}a${aya}`];
}

export function listRecordings(
  quira: Quira,
  profileId: string
): { sura: number; aya: number; uri: string }[] {
  const dir = getProfileDir(quira, profileId);
  if (!dir.exists) return [];

  const items = dir.list();
  const result: { sura: number; aya: number; uri: string }[] = [];

  for (const item of items) {
    if (item instanceof File) {
      const name = item.uri.split("/").pop() ?? "";
      const match = name.match(/^s(\d+)a(\d+)\.m4a$/);
      if (match) {
        result.push({
          sura: parseInt(match[1], 10),
          aya: parseInt(match[2], 10),
          uri: item.uri,
        });
      }
    }
  }

  return result;
}

export function deleteRecording(
  sura: number,
  aya: number,
  quira: Quira,
  profileId: string
): void {
  const file = getFile(sura, aya, quira, profileId);
  if (file.exists) {
    file.delete();
  }
}

export function deleteAllRecordings(
  quira: Quira,
  profileId: string
): void {
  const dir = getProfileDir(quira, profileId);
  if (dir.exists) {
    dir.delete();
    dir.create({ intermediates: true });
  }
}

export function buildRecordedAyahSet(
  quira: Quira,
  profileId: string
): Record<string, boolean> {
  const recordings = listRecordings(quira, profileId);
  const map: Record<string, boolean> = {};
  for (const r of recordings) {
    map[`s${r.sura}a${r.aya}`] = true;
  }
  return map;
}

export function countRecordings(
  quira: Quira,
  profileId: string
): number {
  return listRecordings(quira, profileId).length;
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

export async function exportProfile(
  quira: Quira,
  profile: RecordingProfile
): Promise<void> {
  const recordings = listRecordings(quira, profile.id);
  const recordingData: { sura: number; aya: number; base64: string }[] = [];

  for (const rec of recordings) {
    const file = getFile(rec.sura, rec.aya, quira, profile.id);
    if (file.exists) {
      const b64 = file.base64Sync();
      recordingData.push({ sura: rec.sura, aya: rec.aya, base64: b64 });
    }
  }

  const backup: RecordingBackup = {
    format: "mushaf-mauri-recording-backup",
    version: 1,
    quira,
    profile,
    exportDate: new Date().toISOString(),
    recordings: recordingData,
  };

  const tempDir = new Directory(Paths.cache, "exports");
  if (!tempDir.exists) {
    tempDir.create({ intermediates: true });
  }

  const sanitizedName = profile.name.replace(
    /[^a-zA-Z0-9\u0600-\u06FF\u2D30-\u2D7F]/g,
    "_"
  );
  const tempFile = new File(tempDir, `${sanitizedName}.mrec`);
  if (tempFile.exists) tempFile.delete();
  tempFile.create();
  tempFile.write(JSON.stringify(backup));

  await Sharing.shareAsync(tempFile.uri, {
    mimeType: "application/json",
    dialogTitle: profile.name,
    UTI: "public.json",
  });
}

export async function importProfile(
  quira: Quira
): Promise<RecordingProfile | null> {
  try {
    const picked = await File.pickFileAsync();
    const pickedFile = Array.isArray(picked) ? picked[0] : picked;
    if (!pickedFile || !pickedFile.exists) return null;

    const content = pickedFile.textSync();
    const backup = JSON.parse(content) as RecordingBackup;

    if (
      backup.format !== "mushaf-mauri-recording-backup" ||
      !backup.recordings
    ) {
      return null;
    }

    const newProfile: RecordingProfile = {
      id: generateId(),
      name: backup.profile.name,
      createdAt: new Date().toISOString(),
    };

    const profiles = loadProfiles(quira);
    profiles.push(newProfile);
    saveProfilesList(quira, profiles);

    ensureDir(quira, newProfile.id);
    for (const rec of backup.recordings) {
      const file = getFile(rec.sura, rec.aya, quira, newProfile.id);
      if (file.exists) file.delete();
      file.create();
      file.write(rec.base64, { encoding: "base64" });
    }

    return newProfile;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

function getNotesFile(quira: Quira, profileId: string): File {
  return new File(getProfileDir(quira, profileId), "notes.json");
}

export function loadNotes(
  quira: Quira,
  profileId: string
): Record<string, string> {
  const file = getNotesFile(quira, profileId);
  if (!file.exists) return {};
  try {
    return JSON.parse(file.textSync()) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveNote(
  quira: Quira,
  profileId: string,
  sura: number,
  aya: number,
  note: string
): void {
  const notes = loadNotes(quira, profileId);
  const key = buildKey(sura, aya);
  if (note.trim()) {
    notes[key] = note.trim();
  } else {
    delete notes[key];
  }
  ensureDir(quira, profileId);
  const file = getNotesFile(quira, profileId);
  if (!file.exists) file.create();
  file.write(JSON.stringify(notes));
}

export function deleteNote(
  quira: Quira,
  profileId: string,
  sura: number,
  aya: number
): void {
  const notes = loadNotes(quira, profileId);
  delete notes[buildKey(sura, aya)];
  const file = getNotesFile(quira, profileId);
  if (file.exists) {
    file.write(JSON.stringify(notes));
  }
}

// ---------------------------------------------------------------------------
// Selective Export
// ---------------------------------------------------------------------------

export async function exportSelectedRecordings(
  quira: Quira,
  profile: RecordingProfile,
  ayahs: { sura: number; aya: number }[]
): Promise<void> {
  const recordingData: { sura: number; aya: number; base64: string }[] = [];

  for (const { sura, aya } of ayahs) {
    const file = getFile(sura, aya, quira, profile.id);
    if (file.exists) {
      const b64 = file.base64Sync();
      recordingData.push({ sura, aya, base64: b64 });
    }
  }

  const backup: RecordingBackup = {
    format: "mushaf-mauri-recording-backup",
    version: 1,
    quira,
    profile,
    exportDate: new Date().toISOString(),
    recordings: recordingData,
  };

  const tempDir = new Directory(Paths.cache, "exports");
  if (!tempDir.exists) {
    tempDir.create({ intermediates: true });
  }

  const sanitizedName = profile.name.replace(
    /[^a-zA-Z0-9\u0600-\u06FF\u2D30-\u2D7F]/g,
    "_"
  );
  const tempFile = new File(tempDir, `${sanitizedName}_selected.mrec`);
  if (tempFile.exists) tempFile.delete();
  tempFile.create();
  tempFile.write(JSON.stringify(backup));

  await Sharing.shareAsync(tempFile.uri, {
    mimeType: "application/json",
    dialogTitle: profile.name,
    UTI: "public.json",
  });
}
