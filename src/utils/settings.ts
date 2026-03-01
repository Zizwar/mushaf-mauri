import { File, Paths } from "expo-file-system";
import type { LangKey } from "../i18n";
import type { Theme } from "../theme/themes";
import type { Quira } from "../store/useAppStore";
import { THEMES } from "../theme/themes";

// ---------------------------------------------------------------------------
// Settings file path
// ---------------------------------------------------------------------------
const SETTINGS_FILE = `${Paths.document}/app_settings.json`;

interface PersistedSettings {
  hasCompletedSetup: boolean;
  lang: LangKey;
  quira: Quira;
  themeName: string;
  moqriId: string;
  currentPage: number;
  quranFont: string;
  warshRecitorId: number;
}

// ---------------------------------------------------------------------------
// Load settings from file
// ---------------------------------------------------------------------------
export function loadSettings(): Partial<PersistedSettings> {
  try {
    const file = new File(SETTINGS_FILE);
    if (file.exists) {
      const text = file.textSync();
      return JSON.parse(text) as Partial<PersistedSettings>;
    }
  } catch {
    // ignore
  }
  return {};
}

// ---------------------------------------------------------------------------
// Save settings to file
// ---------------------------------------------------------------------------
export function saveSettings(settings: Partial<PersistedSettings>): void {
  try {
    const existing = loadSettings();
    const merged = { ...existing, ...settings };
    const file = new File(SETTINGS_FILE);
    file.create();
    file.write(JSON.stringify(merged));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Resolve theme by name
// ---------------------------------------------------------------------------
export function resolveTheme(themeName: string): Theme {
  return THEMES.find((t) => t.name === themeName) ?? THEMES[0];
}
