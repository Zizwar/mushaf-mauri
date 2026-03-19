import type { Theme } from "../theme/themes";
import { THEMES } from "../theme/themes";

// ---------------------------------------------------------------------------
// Storage is now handled by Zustand persist + AsyncStorage in useAppStore.ts
// This file only keeps the theme resolver utility.
// ---------------------------------------------------------------------------

export function resolveTheme(themeName: string): Theme {
  return THEMES.find((t) => t.name === themeName) ?? THEMES[0];
}
