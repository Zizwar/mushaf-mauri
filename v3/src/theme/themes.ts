export interface Theme {
  backgroundColor: string;
  color: string;
  night?: boolean;
  name: string;
}

export const THEMES: Theme[] = [
  { backgroundColor: "#fff", color: "#000", name: "white" },
  { backgroundColor: "#fffcd9", color: "#000", name: "yellow" },
  { backgroundColor: "#e8f7fe", color: "#369", name: "blue" },
  { backgroundColor: "#e7f7ec", color: "#009", name: "green" },
  { backgroundColor: "#1a1a2e", color: "#eee", night: true, name: "night" },
];
