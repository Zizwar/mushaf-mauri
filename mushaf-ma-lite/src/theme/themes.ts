export interface Theme {
  name: string;
  backgroundColor: string;
  cardColor: string;
  color: string;
  subColor: string;
  borderColor: string;
  night?: boolean;
}

export const ACCENT = "#1a5c2e";
export const ACCENT_LIGHT = "#2e7d32";
export const RECORDING_COLOR = "#d32f2f";
export const RECORDING_IDLE = "#e53935";
export const GOLD = "#b8860b";

export const THEMES: Theme[] = [
  {
    name: "white",
    backgroundColor: "#fafafa",
    cardColor: "#ffffff",
    color: "#1b1b1b",
    subColor: "#666666",
    borderColor: "#e0e0e0",
  },
  {
    name: "sepia",
    backgroundColor: "#f5ebe0",
    cardColor: "#fdf6ec",
    color: "#3e2723",
    subColor: "#7a5c50",
    borderColor: "#c8a882",
  },
  {
    name: "green",
    backgroundColor: "#e7f7ec",
    cardColor: "#f4fdf7",
    color: "#0d3018",
    subColor: "#4d7a5c",
    borderColor: "#90c8a8",
  },
  {
    name: "night",
    backgroundColor: "#121212",
    cardColor: "#1e1e1e",
    color: "#e8e8e8",
    subColor: "#9e9e9e",
    borderColor: "#333333",
    night: true,
  },
];

export function resolveTheme(name: string): Theme {
  return THEMES.find((t) => t.name === name) ?? THEMES[0];
}
