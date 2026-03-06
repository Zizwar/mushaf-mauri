import { Paths, File, Directory } from "expo-file-system";
import { openDatabaseAsync } from "expo-sqlite";

// ==============================================================
// Warsh → Hafs Ayah Mapping
// ==============================================================

/**
 * Exception map for surahs where Warsh (Madani) ayah numbering
 * differs from Hafs (Kufi) numbering.
 *
 * Types:
 * - "manual": full explicit map (Al-Fatihah)
 * - "offset": simple fawatih merge with constant offset for all subsequent ayahs
 * - "advanced": explicit_map for merge/split points + ranges with variable offsets
 *   (for surahs with internal shifts or count mismatches)
 */
const WARSH_EXCEPTIONS: Record<
  number,
  | { type: "manual"; map: Record<number, number[]> }
  | { type: "offset"; mergeAtWarshAyah: number; hafsTargetsToMerge: number[]; offsetForSubsequent: number }
  | { type: "advanced"; explicit_map: Record<number, number[]>; ranges: { warshStart: number; warshEnd: number; hafsOffset: number }[] }
> = {
  // ──────────────────────────────────────────────────────────────────────────
  // Category 0: Manual mapping
  // ──────────────────────────────────────────────────────────────────────────

  // Al-Fatihah (1): Warsh does not count Basmalah as aya; splits Hafs aya 7.
  1: {
    type: "manual",
    map: { 1: [2], 2: [3], 3: [4], 4: [5], 5: [6], 6: [7], 7: [7] },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 1: Simple Fawatih Merge at Aya 1 → uniform offset +1
  // Warsh merges fawatih letters + next content into one aya.
  // Verified by count diff AND last-aya text comparison.
  // ──────────────────────────────────────────────────────────────────────────

  // الم — Al-Baqarah: W=285, H=286 (+1). W1 = H[1+2] confirmed.
  2:  { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 1b: Fawatih merge at A1 + compensating split mid-surah (net 0)
  // Pattern: W1=H[1,2], then offset+1 for a range, then Warsh splits one Hafs
  // ayah into two, returning offset to 0 for the rest of the surah.
  // ──────────────────────────────────────────────────────────────────────────

  // الأعراف (7): W=206, H=206 (net 0).
  // W1 merges المص+كتاب أنزل (H1+H2). H137 "وأورثنا...بما صبروا ودمرنا"
  // is split by Warsh into W136 (first part) + W137 (second part). Offset=0 from W138.
  7: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 136: [137], 137: [137] },
    ranges: [
      { warshStart: 2,   warshEnd: 135, hafsOffset: 1 },
      { warshStart: 138, warshEnd: 206, hafsOffset: 0 },
    ],
  },

  // القصص (28): W=88, H=88 (net 0).
  // W1 merges طسم+تلك آيات (H1+H2). H23 "ولما ورد ماء مدين...ووجد من دونهم"
  // is split by Warsh into W22 (first part) + W23 (second part). Offset=0 from W24.
  28: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 22: [23], 23: [23] },
    ranges: [
      { warshStart: 2,  warshEnd: 21, hafsOffset: 1 },
      { warshStart: 24, warshEnd: 88, hafsOffset: 0 },
    ],
  },

  // العنكبوت (29): W=69, H=69 (net 0).
  // W1 merges الم+أحسب الناس (H1+H2). H29 "أئنكم لتأتون الرجال...وتأتون في ناديكم"
  // is split by Warsh into W28 (first part) + W29 (second part). Offset=0 from W30.
  29: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 28: [29], 29: [29] },
    ranges: [
      { warshStart: 2,  warshEnd: 27, hafsOffset: 1 },
      { warshStart: 30, warshEnd: 69, hafsOffset: 0 },
    ],
  },

  // السجدة (32): W=30, H=30 (net 0).
  // W1 merges الم+تنزيل الكتاب (H1+H2). H10 "وقالوا أإذا ضللنا...بل هم بلقاء ربهم كافرون"
  // is split by Warsh into W9 (first part) + W10 (second part). Offset=0 from W11.
  32: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 9: [10], 10: [10] },
    ranges: [
      { warshStart: 2,  warshEnd: 8,  hafsOffset: 1 },
      { warshStart: 11, warshEnd: 30, hafsOffset: 0 },
    ],
  },

  // الزخرف (43): W=89, H=89 (net 0).
  // W1 merges حم+والكتاب المبين (H1+H2). H52 "أم أنا خير...ولا يكاد يبين"
  // is split by Warsh into W51 (first part) + W52 (second part). Offset=0 from W53.
  43: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 51: [52], 52: [52] },
    ranges: [
      { warshStart: 2,  warshEnd: 50, hafsOffset: 1 },
      { warshStart: 53, warshEnd: 89, hafsOffset: 0 },
    ],
  },
  // الم — Al-Rum: W=59, H=60 (+1).
  30: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // الم — Luqman: W=33, H=34 (+1).
  31: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // طه — Ta-Ha: W=134, H=135 (+1).
  20: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // طسم — Ash-Shu'ara: W=226, H=227 (+1).
  26: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // يس — Ya-Sin: W=82, H=83 (+1).
  36: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // حم — Ghafir: W=84, H=85 (+1).
  40: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // حم — Fussilat: W=53, H=54 (+1).
  41: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // حم — Al-Jathiyah: W=36, H=37 (+1).
  45: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // حم — Al-Ahqaf: W=34, H=35 (+1).
  46: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },
  // القارعة (101): W=10, H=11 (+1). W1 = H[1+2] confirmed by full reading.
  101: { type: "offset", mergeAtWarshAyah: 1, hafsTargetsToMerge: [1, 2], offsetForSubsequent: 1 },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 2: Multiple merges / complex fawatih structure
  // ──────────────────────────────────────────────────────────────────────────

  // Sad (38): W=86, H=88 (diff=+2). W1=[H1,H2] (فاتحة merge); W83=[H84,H85].
  38: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 83: [84, 85] },
    ranges: [
      { warshStart: 2,  warshEnd: 82,  hafsOffset: 1 },
      { warshStart: 84, warshEnd: 86,  hafsOffset: 2 },
    ],
  },

  // Ash-Shura (42): W=50, H=53 (diff=+3). W1=[H1,H2,H3] (triple فاتحة حم+عسق).
  // W30=[H32,H33] (second merge mid-surah).
  42: {
    type: "advanced",
    explicit_map: { 1: [1, 2, 3], 30: [32, 33] },
    ranges: [
      { warshStart: 2,  warshEnd: 29, hafsOffset: 2 },
      { warshStart: 31, warshEnd: 50, hafsOffset: 3 },
    ],
  },

  // Ad-Dukhan (44): W=56, H=59 (diff=+3). W1=[H1,H2], W33=[H34,H35], W42=[H44,H45].
  44: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 33: [34, 35], 42: [44, 45] },
    ranges: [
      { warshStart: 2,  warshEnd: 32, hafsOffset: 1 },
      { warshStart: 34, warshEnd: 41, hafsOffset: 2 },
      { warshStart: 43, warshEnd: 56, hafsOffset: 3 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 3: Complex Structural Shifts (merge + split, net offset varies)
  // ──────────────────────────────────────────────────────────────────────────

  // Al-Imran (3): 200 ayahs in both (net 0). Warsh merges الم (H1+H2 → W1),
  // then splits Hafs aya 92 into W91+W92 → offset returns to 0 from W93.
  3: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 91: [92], 92: [92] },
    ranges: [
      { warshStart: 2,  warshEnd: 90,  hafsOffset: 1 },
      { warshStart: 93, warshEnd: 200, hafsOffset: 0 },
    ],
  },

  // Maryam (19): W=99, H=98 (diff=-1).
  // W1=[H1,H2] (merge, off→+1); H41→W40+W41 (split, off→0); H75→W75+W76 (split, off→-1).
  19: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 40: [41], 41: [41], 75: [75], 76: [75] },
    ranges: [
      { warshStart: 2,  warshEnd: 39, hafsOffset:  1 },
      { warshStart: 42, warshEnd: 74, hafsOffset:  0 },
      { warshStart: 77, warshEnd: 99, hafsOffset: -1 },
    ],
  },

  // Muhammad (47): W=39, H=38 (diff=-1). Warsh splits H4 into W4+W5; W6+ at off-1.
  47: {
    type: "advanced",
    explicit_map: { 4: [4], 5: [4] },
    ranges: [
      { warshStart: 1,  warshEnd: 3,  hafsOffset:  0 },
      { warshStart: 6,  warshEnd: 39, hafsOffset: -1 },
    ],
  },

  // Al-'Alaq (96): W=20, H=19 (diff=-1). Warsh splits Hafs A15
  // ("كلا لئن لم ينته لنسفعا بالناصية") into W15+W16. W17+ → offset -1.
  96: {
    type: "advanced",
    explicit_map: { 15: [15], 16: [15] },
    ranges: [
      { warshStart: 1,  warshEnd: 14, hafsOffset: 0  },
      { warshStart: 17, warshEnd: 20, hafsOffset: -1 },
    ],
  },

  // Az-Zalzalah (99): W=9, H=8 (diff=-1). Warsh splits Hafs A6
  // ("يومئذ يصدر الناس أشتاتا ليروا أعمالهم") into W6+W7. W8-9 → offset -1.
  99: {
    type: "advanced",
    explicit_map: { 6: [6], 7: [6] },
    ranges: [
      { warshStart: 1, warshEnd: 5, hafsOffset: 0  },
      { warshStart: 8, warshEnd: 9, hafsOffset: -1 },
    ],
  },

  // Quraysh (106): W=5, H=4 (diff=-1). Warsh splits Hafs A4
  // ("الذي أطعمهم من جوع وآمنهم من خوف") into W4+W5.
  106: {
    type: "advanced",
    explicit_map: { 4: [4], 5: [4] },
    ranges: [
      { warshStart: 1, warshEnd: 3, hafsOffset: 0 },
    ],
  },

  // Al-Ma'un (107): W=6, H=7 (diff=+1). Warsh merges Hafs A6+A7
  // ("الذين هم يراؤون" + "ويمنعون الماعون") into W6.
  107: {
    type: "advanced",
    explicit_map: { 6: [6, 7] },
    ranges: [
      { warshStart: 1, warshEnd: 5, hafsOffset: 0 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 4: Single mid-surah merge (diff=+1)
  // ──────────────────────────────────────────────────────────────────────────

  // An-Nisa (4): W=175, H=176 (diff=+1). W44=[H44,H45]; W45+ at off+1.
  4: {
    type: "advanced",
    explicit_map: { 44: [44, 45] },
    ranges: [
      { warshStart: 1,  warshEnd: 43,  hafsOffset: 0 },
      { warshStart: 45, warshEnd: 175, hafsOffset: 1 },
    ],
  },

  // Al-Isra (17): W=110, H=111 (diff=+1). W107=[H107,H108]; W108+ at off+1.
  17: {
    type: "advanced",
    explicit_map: { 107: [107, 108] },
    ranges: [
      { warshStart: 1,   warshEnd: 106, hafsOffset: 0 },
      { warshStart: 108, warshEnd: 110, hafsOffset: 1 },
    ],
  },

  // Al-Anbiya (21): W=111, H=112 (diff=+1). W73=[H73,H74]; W74+ at off+1.
  21: {
    type: "advanced",
    explicit_map: { 73: [73, 74] },
    ranges: [
      { warshStart: 1,  warshEnd: 72,  hafsOffset: 0 },
      { warshStart: 74, warshEnd: 111, hafsOffset: 1 },
    ],
  },

  // Al-Mu'minun (23): W=119, H=118 (diff=-1). H47→W47+W48 (split); W49+ at off-1.
  23: {
    type: "advanced",
    explicit_map: { 47: [47], 48: [47] },
    ranges: [
      { warshStart: 1,  warshEnd: 46,  hafsOffset: 0  },
      { warshStart: 49, warshEnd: 119, hafsOffset: -1 },
    ],
  },

  // Fatir (35): W=46, H=45 (diff=-1). H43→W43+W44 (split); W45+ at off-1.
  35: {
    type: "advanced",
    explicit_map: { 43: [43], 44: [43] },
    ranges: [
      { warshStart: 1,  warshEnd: 42, hafsOffset:  0 },
      { warshStart: 45, warshEnd: 46, hafsOffset: -1 },
    ],
  },

  // An-Najm (53): W=61, H=62 (diff=+1). W28=[H28,H29]; W29+ at off+1.
  53: {
    type: "advanced",
    explicit_map: { 28: [28, 29] },
    ranges: [
      { warshStart: 1,  warshEnd: 27, hafsOffset: 0 },
      { warshStart: 29, warshEnd: 61, hafsOffset: 1 },
    ],
  },

  // Al-Hadid (57): W=28, H=29 (diff=+1). W13=[H13,H14]; W14+ at off+1.
  57: {
    type: "advanced",
    explicit_map: { 13: [13, 14] },
    ranges: [
      { warshStart: 1,  warshEnd: 12, hafsOffset: 0 },
      { warshStart: 14, warshEnd: 28, hafsOffset: 1 },
    ],
  },

  // Al-Mujadila (58): W=21, H=22 (diff=+1). W20=[H20,H21]; W21 at off+1.
  58: {
    type: "advanced",
    explicit_map: { 20: [20, 21] },
    ranges: [
      { warshStart: 1,  warshEnd: 19, hafsOffset: 0 },
      { warshStart: 21, warshEnd: 21, hafsOffset: 1 },
    ],
  },

  // Al-Mulk (67): W=31, H=30 (diff=-1). H10→W10+W11 (split); W12+ at off-1.
  67: {
    type: "advanced",
    explicit_map: { 10: [10], 11: [10] },
    ranges: [
      { warshStart: 1,  warshEnd: 9,  hafsOffset: 0  },
      { warshStart: 12, warshEnd: 31, hafsOffset: -1 },
    ],
  },

  // Al-Muddaththir (74): W=55, H=56 (diff=+1). W40=[H40,H41]; W41+ at off+1.
  74: {
    type: "advanced",
    explicit_map: { 40: [40, 41] },
    ranges: [
      { warshStart: 1,  warshEnd: 39, hafsOffset: 0 },
      { warshStart: 41, warshEnd: 55, hafsOffset: 1 },
    ],
  },

  // Al-Qiyamah (75): W=39, H=40 (diff=+1). W18=[H18,H19]; W19+ at off+1.
  75: {
    type: "advanced",
    explicit_map: { 18: [18, 19] },
    ranges: [
      { warshStart: 1,  warshEnd: 17, hafsOffset: 0 },
      { warshStart: 19, warshEnd: 39, hafsOffset: 1 },
    ],
  },

  // An-Nazi'at (79): W=45, H=46 (diff=+1). W37=[H37,H38]; W38+ at off+1.
  79: {
    type: "advanced",
    explicit_map: { 37: [37, 38] },
    ranges: [
      { warshStart: 1,  warshEnd: 36, hafsOffset: 0 },
      { warshStart: 38, warshEnd: 45, hafsOffset: 1 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 5: Single mid-surah split (diff=-1)
  // ──────────────────────────────────────────────────────────────────────────

  // Al-Anfal (8): W=76, H=75 (diff=-1). H47→W47+W48 (split); W49+ at off-1.
  8: {
    type: "advanced",
    explicit_map: { 47: [47], 48: [47] },
    ranges: [
      { warshStart: 1,  warshEnd: 46, hafsOffset: 0  },
      { warshStart: 49, warshEnd: 76, hafsOffset: -1 },
    ],
  },

  // At-Tawbah (9): W=130, H=129 (diff=-1). H72→W72+W73 (split); W74+ at off-1.
  9: {
    type: "advanced",
    explicit_map: { 72: [72], 73: [72] },
    ranges: [
      { warshStart: 1,  warshEnd: 71,  hafsOffset: 0  },
      { warshStart: 74, warshEnd: 130, hafsOffset: -1 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Category 6: Multiple structural shifts (merge + split)
  // ──────────────────────────────────────────────────────────────────────────

  // Al-Maidah (5): W=122, H=120 (diff=-2).
  // H1→W1+W2 (split); H15→W16+W17 (split).
  5: {
    type: "advanced",
    explicit_map: { 1: [1], 2: [1], 16: [15], 17: [15] },
    ranges: [
      { warshStart: 3,  warshEnd: 15,  hafsOffset: -1 },
      { warshStart: 18, warshEnd: 122, hafsOffset: -2 },
    ],
  },

  // Al-An'am (6): W=167, H=165 (diff=-2).
  // H1→W1+W2 (split, off→-1); W67=[H66,H67] (merge, off→0);
  // H73→W73+W74 (split, off→-1); H161→W162+W163 (split, off→-2).
  6: {
    type: "advanced",
    explicit_map: { 1: [1], 2: [1], 67: [66, 67], 73: [73], 74: [73], 162: [161], 163: [161] },
    ranges: [
      { warshStart: 3,   warshEnd: 66,  hafsOffset: -1 },
      { warshStart: 68,  warshEnd: 72,  hafsOffset:  0 },
      { warshStart: 75,  warshEnd: 161, hafsOffset: -1 },
      { warshStart: 164, warshEnd: 167, hafsOffset: -2 },
    ],
  },

  // Hud (11): W=121, H=123 (diff=+2).
  // W54=[H54,H55] (merge, off→+1); H86→W85+W86 (split, off→0);
  // W118=[H118,H119] (merge, off→+1); W120=[H121,H122] (merge, off→+2).
  11: {
    type: "advanced",
    explicit_map: { 54: [54, 55], 85: [86], 86: [86], 118: [118, 119], 120: [121, 122] },
    ranges: [
      { warshStart: 1,   warshEnd: 53,  hafsOffset: 0 },
      { warshStart: 55,  warshEnd: 84,  hafsOffset: 1 },
      { warshStart: 87,  warshEnd: 117, hafsOffset: 0 },
      { warshStart: 119, warshEnd: 119, hafsOffset: 1 },
      { warshStart: 121, warshEnd: 121, hafsOffset: 2 },
    ],
  },

  // Ar-Ra'd (13): W=44, H=43 (diff=-1).
  // H5→W5+W6 (split, off→-1); H16→W17+W18 (split, off→-2);
  // W25=[H23,H24] (merge, off→-1).
  13: {
    type: "advanced",
    explicit_map: { 5: [5], 6: [5], 17: [16], 18: [16], 25: [23, 24] },
    ranges: [
      { warshStart: 1,  warshEnd: 4,  hafsOffset:  0 },
      { warshStart: 7,  warshEnd: 16, hafsOffset: -1 },
      { warshStart: 19, warshEnd: 24, hafsOffset: -2 },
      { warshStart: 26, warshEnd: 44, hafsOffset: -1 },
    ],
  },

  // Ibrahim (14): W=54, H=52 (diff=-2).
  // H1→W1+W2 (off→-1); H5→W6+W7 (off→-2); H9→W11+W12 (off→-3);
  // W22=[H19,H20] (merge, off→-2).
  14: {
    type: "advanced",
    explicit_map: { 1: [1], 2: [1], 6: [5], 7: [5], 11: [9], 12: [9], 22: [19, 20] },
    ranges: [
      { warshStart: 3,  warshEnd: 5,  hafsOffset: -1 },
      { warshStart: 8,  warshEnd: 10, hafsOffset: -2 },
      { warshStart: 13, warshEnd: 21, hafsOffset: -3 },
      { warshStart: 23, warshEnd: 54, hafsOffset: -2 },
    ],
  },

  // Al-Kahf (18): W=105, H=110 (diff=+5).
  // W35=[H35,H36]; W84=[H85,H86]; W87=[H89,H90]; W89=[H92,H93]; W99=[H103,H104].
  18: {
    type: "advanced",
    explicit_map: { 35: [35, 36], 84: [85, 86], 87: [89, 90], 89: [92, 93], 99: [103, 104] },
    ranges: [
      { warshStart: 1,   warshEnd: 34,  hafsOffset: 0 },
      { warshStart: 36,  warshEnd: 83,  hafsOffset: 1 },
      { warshStart: 85,  warshEnd: 86,  hafsOffset: 2 },
      { warshStart: 88,  warshEnd: 88,  hafsOffset: 3 },
      { warshStart: 90,  warshEnd: 98,  hafsOffset: 4 },
      { warshStart: 100, warshEnd: 105, hafsOffset: 5 },
    ],
  },

  // Al-Hajj (22): W=76, H=78 (diff=+2).
  // W18=[H18,H19]; W19=[H20,H21]; W20+ at off+2.
  22: {
    type: "advanced",
    explicit_map: { 18: [18, 19], 19: [20, 21] },
    ranges: [
      { warshStart: 1,  warshEnd: 17, hafsOffset: 0 },
      { warshStart: 20, warshEnd: 76, hafsOffset: 2 },
    ],
  },

  // An-Nur (24): W=62, H=64 (diff=+2).
  // W36=[H36,H37] (off→+1); W42=[H43,H44] (off→+2).
  24: {
    type: "advanced",
    explicit_map: { 36: [36, 37], 42: [43, 44] },
    ranges: [
      { warshStart: 1,  warshEnd: 35, hafsOffset: 0 },
      { warshStart: 37, warshEnd: 41, hafsOffset: 1 },
      { warshStart: 43, warshEnd: 62, hafsOffset: 2 },
    ],
  },

  // An-Naml (27): W=95, H=93 (diff=-2).
  // H33→W33+W34 (off→-1); H44→W45+W46 (off→-2).
  27: {
    type: "advanced",
    explicit_map: { 33: [33], 34: [33], 45: [44], 46: [44] },
    ranges: [
      { warshStart: 1,  warshEnd: 32, hafsOffset:  0 },
      { warshStart: 35, warshEnd: 44, hafsOffset: -1 },
      { warshStart: 47, warshEnd: 95, hafsOffset: -2 },
    ],
  },

  // Az-Zumar (39): W=72, H=75 (diff=+3).
  // H3→W3+W4 (off→-1); W12=[H11,H12] (off→0); W14=[H14,H15] (off→+1);
  // W35=[H36,H37] (off→+2); W37=[H39,H40] (off→+3).
  39: {
    type: "advanced",
    explicit_map: { 3: [3], 4: [3], 12: [11, 12], 14: [14, 15], 35: [36, 37], 37: [39, 40] },
    ranges: [
      { warshStart: 1,  warshEnd: 2,  hafsOffset: 0  },
      { warshStart: 5,  warshEnd: 11, hafsOffset: -1 },
      { warshStart: 13, warshEnd: 13, hafsOffset: 0  },
      { warshStart: 15, warshEnd: 34, hafsOffset: 1  },
      { warshStart: 36, warshEnd: 36, hafsOffset: 2  },
      { warshStart: 38, warshEnd: 72, hafsOffset: 3  },
    ],
  },

  // At-Tur (52): W=47, H=49 (diff=+2).
  // W1=[H1,H2] (off→+1); W12=[H13,H14] (off→+2).
  52: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 12: [13, 14] },
    ranges: [
      { warshStart: 2,  warshEnd: 11, hafsOffset: 1 },
      { warshStart: 13, warshEnd: 47, hafsOffset: 2 },
    ],
  },

  // Ar-Rahman (55): W=77, H=78 (diff=+1). W1=[H1,H2]; W2+ at off+1.
  55: {
    type: "advanced",
    explicit_map: { 1: [1, 2] },
    ranges: [
      { warshStart: 2, warshEnd: 77, hafsOffset: 1 },
    ],
  },

  // Al-Waqi'ah (56): W=99, H=96 (diff=-3).
  // H8→W8+W9, H9→W10+W11 (two consecutive splits, off→-2);
  // H18→W20+W21 (off→-3 before this, but at off-2 W20=H18, so split at off-2→-3 after);
  // W25=[H22,H23] (merge, off→-2); H41→W43+W44 (off→-3 after).
  56: {
    type: "advanced",
    explicit_map: { 8: [8], 9: [8], 10: [9], 11: [9], 20: [18], 21: [18], 25: [22, 23], 43: [41], 44: [41] },
    ranges: [
      { warshStart: 1,  warshEnd: 7,  hafsOffset:  0 },
      { warshStart: 12, warshEnd: 19, hafsOffset: -2 },
      { warshStart: 22, warshEnd: 24, hafsOffset: -3 },
      { warshStart: 26, warshEnd: 42, hafsOffset: -2 },
      { warshStart: 45, warshEnd: 99, hafsOffset: -3 },
    ],
  },

  // Nuh (71): W=30, H=28 (diff=-2).
  // H24→W24+W25, H25→W26+W27 (two consecutive splits); W28+ at off-2.
  71: {
    type: "advanced",
    explicit_map: { 24: [24], 25: [24], 26: [25], 27: [25] },
    ranges: [
      { warshStart: 1,  warshEnd: 23, hafsOffset:  0 },
      { warshStart: 28, warshEnd: 30, hafsOffset: -2 },
    ],
  },

  // Al-Muzzammil (73): W=18, H=20 (diff=+2).
  // W1=[H1,H2] (off→+1); W16=[H17,H18] (off→+2).
  73: {
    type: "advanced",
    explicit_map: { 1: [1, 2], 16: [17, 18] },
    ranges: [
      { warshStart: 2,  warshEnd: 15, hafsOffset: 1 },
      { warshStart: 17, warshEnd: 18, hafsOffset: 2 },
    ],
  },

  // Al-Fajr (89): W=32, H=30 (diff=-2).
  // H15→W15+W16, H16→W17+W18, H25→W27+W28 (3 splits); W32=[H29,H30] (merge).
  89: {
    type: "advanced",
    explicit_map: { 15: [15], 16: [15], 17: [16], 18: [16], 27: [25], 28: [25], 32: [29, 30] },
    ranges: [
      { warshStart: 1,  warshEnd: 14, hafsOffset:  0 },
      { warshStart: 19, warshEnd: 26, hafsOffset: -2 },
      { warshStart: 29, warshEnd: 31, hafsOffset: -3 },
    ],
  },
};

/**
 * Map a Warsh ayah number to the corresponding Hafs ayah number(s).
 * Returns an array of Hafs ayah numbers to fetch (usually 1, sometimes 2 for merged fawatih).
 */
export function warshToHafsAyahs(sura: number, warshAya: number): number[] {
  const exception = WARSH_EXCEPTIONS[sura];
  if (!exception) return [warshAya]; // 1:1 mapping

  if (exception.type === "manual") {
    return exception.map[warshAya] ?? [warshAya];
  }

  if (exception.type === "advanced") {
    // Check explicit_map first (merge/split points)
    const mapped = exception.explicit_map[warshAya];
    if (mapped) return mapped;
    // Find matching range
    for (const r of exception.ranges) {
      if (warshAya >= r.warshStart && warshAya <= r.warshEnd) {
        return [warshAya + r.hafsOffset];
      }
    }
    return [warshAya];
  }

  // offset type (simple fawatih)
  if (warshAya === exception.mergeAtWarshAyah) {
    return exception.hafsTargetsToMerge;
  }
  return [warshAya + exception.offsetForSubsequent];
}

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
