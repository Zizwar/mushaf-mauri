export interface Theme {
  backgroundColor: string;
  color: string;
  night?: boolean;
  name: string;
}

export const THEMES: Theme[] = [
  { backgroundColor: "#fff", color: "#000", name: "white" },
  { backgroundColor: "#fffcd9", color: "#000", name: "yellow" },
  { backgroundColor: "#f5ebe0", color: "#3e2723", name: "sepia" },
  { backgroundColor: "#e8f7fe", color: "#369", name: "blue" },
  { backgroundColor: "#e7f7ec", color: "#009", name: "green" },
  { backgroundColor: "#fce4ec", color: "#880e4f", name: "rose" },
  { backgroundColor: "#ede7f6", color: "#4a148c", name: "lavender" },
  { backgroundColor: "#e0f2f1", color: "#004d40", name: "mint" },
  { backgroundColor: "#fff3e0", color: "#bf360c", name: "peach" },
  { backgroundColor: "#eceff1", color: "#263238", name: "slate" },
  { backgroundColor: "#1a1a2e", color: "#eee", night: true, name: "night" },
  { backgroundColor: "#0d1b2a", color: "#e0e0e0", night: true, name: "night_blue" },
];
