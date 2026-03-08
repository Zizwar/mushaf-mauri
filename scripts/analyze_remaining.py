#!/usr/bin/env python3
"""
Analyze remaining 33 unmapped surahs to find exact Warsh→Hafs offset transition points.
Uses brute-force offset scan: for each surah, tries all possible merge/split patterns.
"""
import sqlite3, re, json, os, unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "assets", "qurantxtdb.db")
JS_PATH = os.path.join(BASE, "src", "data", "ayatJson.js")

SURAH_NAMES = [
    "", "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام",
    "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد",
    "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء",
    "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة",
    "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر",
    "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية",
    "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات",
    "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد",
    "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون",
    "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة",
    "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة",
    "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير",
    "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق",
    "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل",
    "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة",
    "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر",
    "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون",
    "النصر", "المسد", "الإخلاص", "الفلق", "الناس",
]

def load_warsh():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT suraID, ayaNum, content FROM aya_audio ORDER BY suraID, ayaNum")
    data = {}
    for sura, aya, text in cur.fetchall():
        data.setdefault(int(sura), {})[int(aya)] = text or ""
    conn.close()
    return data

def load_hafs():
    with open(JS_PATH, "r", encoding="utf-8") as f:
        raw = f.read()
    raw = re.sub(r"^\s*export\s+const\s+\w+\s*=\s*", "", raw, flags=re.MULTILINE)
    raw = raw.rstrip().rstrip(";")
    entries = json.loads(raw)
    data = {}
    for e in entries:
        sura, aya, text = int(e[1]), int(e[2]), str(e[3])
        data.setdefault(sura, {})[aya] = text
    return data

def normalize(text):
    """Normalize Arabic text for comparison."""
    if not text:
        return ""
    # Remove diacritics
    text = ''.join(c for c in unicodedata.normalize('NFD', text)
                   if unicodedata.category(c) != 'Mn')
    # Normalize alef forms
    text = re.sub(r'[أإآٱ]', 'ا', text)
    # Normalize other chars
    text = text.replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
    # Remove tatweel
    text = text.replace('ـ', '')
    # Remove non-Arabic
    text = re.sub(r'[^\u0600-\u06FF\s]', '', text)
    # Collapse spaces
    text = ' '.join(text.split())
    return text

def sim(a, b, prefix=20):
    """Check if two texts share the same first `prefix` normalized chars."""
    na, nb = normalize(a)[:prefix], normalize(b)[:prefix]
    return na == nb and len(na) >= 10

# The 33 remaining surahs with their diffs
# Format: (surah_num, diff)  where diff = hafs_count - warsh_count
REMAINING = [
    (4, +1), (5, -2), (6, -2), (8, -1), (9, -1),
    (11, +2), (13, -1), (14, -2), (17, +1), (18, +5),
    (21, +1), (22, +2), (23, -1), (24, +2), (27, -2),
    (35, -1), (38, +2), (39, +3), (42, +3), (44, +3),
    (52, +2), (53, +1), (55, +1), (56, -3), (57, +1),
    (58, +1), (67, -1), (71, -2), (73, +2), (74, +1),
    (75, +1), (79, +1), (89, -2),
]

def find_transitions(warsh, hafs, sura, diff):
    """
    Find offset transition points in a surah.
    Returns list of (warsh_aya, description) describing the shift pattern.
    """
    w_ayas = warsh.get(sura, {})
    h_ayas = hafs.get(sura, {})
    w_last = max(w_ayas.keys()) if w_ayas else 0
    h_last = max(h_ayas.keys()) if h_ayas else 0

    results = []
    results.append(f"\n{'='*70}")
    results.append(f"SURAH {sura} ({SURAH_NAMES[sura] if sura < len(SURAH_NAMES) else ''})  W={w_last}  H={h_last}  diff={diff:+d}")
    results.append(f"{'='*70}")

    # Show first 3 ayahs to understand structure
    for w_idx in range(1, min(4, w_last+1)):
        wt = w_ayas.get(w_idx, "")[:70]
        results.append(f"  W[{w_idx:>3}]: {wt}")
    results.append(f"  ...")
    for h_idx in range(1, min(5, h_last+1)):
        ht = h_ayas.get(h_idx, "")[:70]
        results.append(f"  H[{h_idx:>3}]: {ht}")
    results.append("")

    # Scan for offset transitions:
    # At each warsh aya W, check which hafs aya best matches.
    # Track when the "expected offset" changes.

    # Try offsets from -5 to +5
    # For each warsh aya, find the best matching hafs aya
    current_offset = None
    transitions = []  # (warsh_aya, old_offset, new_offset)

    matches = {}  # w_aya -> best_h_aya (or None if no match)

    for w_aya in range(1, w_last + 1):
        wt = w_ayas.get(w_aya, "")
        if not wt:
            continue
        best = None
        for offset in range(-5, 8):
            h_aya = w_aya + offset
            if 1 <= h_aya <= h_last:
                ht = h_ayas.get(h_aya, "")
                if sim(wt, ht, 25):
                    best = (h_aya, offset)
                    break
        matches[w_aya] = best

    # Find transition points
    prev_offset = None
    for w_aya in range(1, w_last + 1):
        m = matches.get(w_aya)
        if m is None:
            continue
        h_aya, offset = m
        if offset != prev_offset:
            transitions.append((w_aya, h_aya, offset))
            prev_offset = offset

    if transitions:
        results.append("  Offset transitions detected:")
        for w_aya, h_aya, offset in transitions:
            wt = w_ayas.get(w_aya, "")[:60]
            ht = h_ayas.get(h_aya, "")[:60]
            results.append(f"    W[{w_aya}] offset={offset:+d}  W='{wt}'")
            results.append(f"           H[{h_aya}]='{ht}'")
    else:
        results.append("  No clear offset transitions found.")

    # Show key boundary points for manual inspection
    results.append("\n  Key boundary ayahs (for manual inspection):")

    # Show ayahs around each transition
    for w_aya, h_aya, offset in transitions:
        for w_check in range(max(1, w_aya-2), min(w_last+1, w_aya+3)):
            wt = w_ayas.get(w_check, "")[:60]
            # Show hafs candidates
            hafs_cands = []
            for dh in range(-2, 4):
                hc = w_check + dh
                if 1 <= hc <= h_last:
                    hafs_cands.append(f"H[{hc}]='{h_ayas.get(hc,'')[:40]}'")
            results.append(f"    W[{w_check:>3}]: {wt}")
            for hc_str in hafs_cands[:4]:
                results.append(f"          {hc_str}")

    return "\n".join(results)

def main():
    print("Loading data...")
    warsh = load_warsh()
    hafs = load_hafs()

    out_path = os.path.join(BASE, "scripts", "remaining_analysis.txt")

    lines = ["REMAINING SURAHS ANALYSIS\n"]
    lines.append(f"Total: {len(REMAINING)} surahs\n")

    for sura, diff in REMAINING:
        result = find_transitions(warsh, hafs, sura, diff)
        lines.append(result)
        print(f"Done S{sura}")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nSaved to: {out_path}")

if __name__ == "__main__":
    main()
