export interface Theme {
  backgroundColor: string;
  color: string;
  night?: boolean;
  name: string;
  borderColor: string;
  imageFilter?: Array<Record<string, number | string>>;
}

// sepia in RN produces a blue base (~215°), not warm amber like CSS spec.
// Rule: hueRotate = targetHue - 215° (mod 360)
// brightness(0.73) pre-dims white so sepia doesn't overflow/clamp.
const tint = (hue: string, sat = 1.5, bright = 1.2) => [
  { brightness: 0.73 },
  { sepia: 1 },
  { hueRotate: hue },
  { saturate: sat },
  { brightness: bright },
];

export const THEMES: Theme[] = [
  { backgroundColor: "#fff", color: "#000", name: "white", borderColor: "#e0e0e0" },
  {
    // yellow ~50°  → 50 - 215 = -165 = 195°
    backgroundColor: "#fffcd9",
    color: "#000",
    name: "yellow",
    borderColor: "#d8d090",
    imageFilter: tint("195deg", 1.2, 1.35),
  },
  {
    // sepia/warm-brown ~30° → 30 - 215 = -185 = 175°, low saturation
    backgroundColor: "#f5ebe0",
    color: "#3e2723",
    name: "sepia",
    borderColor: "#c8a882",
    imageFilter: tint("175deg", 0.5, 1.35),
  },
  {
    // blue ~210° → sepia base IS ~215°, no big rotation needed
    backgroundColor: "#e8f7fe",
    color: "#369",
    name: "blue",
    borderColor: "#9cc8e4",
    imageFilter: [{ brightness: 0.73 }, { sepia: 1 }, { saturate: 1.2 }, { brightness: 1.3 }],
  },
  {
    // green ~135° → 135 - 215 = -80 = 280°
    backgroundColor: "#e7f7ec",
    color: "#009",
    name: "green",
    borderColor: "#90c8a8",
    imageFilter: tint("280deg"),
  },
  {
    // rose/pink ~340° → 340 - 215 = 125°
    backgroundColor: "#fce4ec",
    color: "#880e4f",
    name: "rose",
    borderColor: "#d898b4",
    imageFilter: tint("125deg"),
  },
  {
    // lavender ~270° → 270 - 215 = 55°
    backgroundColor: "#ede7f6",
    color: "#4a148c",
    name: "lavender",
    borderColor: "#b8a0d8",
    imageFilter: tint("55deg"),
  },
  {
    // mint/teal ~180° → 180 - 215 = -35 = 325°
    backgroundColor: "#e0f2f1",
    color: "#004d40",
    name: "mint",
    borderColor: "#80c4c0",
    imageFilter: tint("325deg"),
  },
  {
    // peach ~30° → same as sepia but slightly more saturated
    backgroundColor: "#fff3e0",
    color: "#bf360c",
    name: "peach",
    borderColor: "#d8c090",
    imageFilter: tint("175deg", 0.8, 1.35),
  },
  {
    // slate (blue-gray ~220°) → sepia base already close, tiny rotation
    backgroundColor: "#eceff1",
    color: "#263238",
    name: "slate",
    borderColor: "#b0bcc8",
    imageFilter: [{ brightness: 0.73 }, { sepia: 1 }, { hueRotate: "5deg" }, { saturate: 0.4 }, { brightness: 1.3 }],
  },
  { backgroundColor: "#1a1a2e", color: "#eee", night: true, name: "night", borderColor: "#2e2e48" },
];
