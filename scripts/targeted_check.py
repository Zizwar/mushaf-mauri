#!/usr/bin/env python3
"""Targeted verification for specific surahs."""
import sqlite3, re, json, os, unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "assets", "qurantxtdb.db")
JS_PATH = os.path.join(BASE, "src", "data", "ayatJson.js")

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
    if not text:
        return ""
    text = "".join(c for c in unicodedata.normalize("NFD", text)
                   if unicodedata.category(c) != "Mn")
    text = re.sub(r"[أإآٱ]", "ا", text)
    text = text.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    text = text.replace("ـ", "")
    text = re.sub(r"[^\u0600-\u06FF\s]", "", text)
    return " ".join(text.split())

def sim(a, b, prefix=20):
    na, nb = normalize(a)[:prefix], normalize(b)[:prefix]
    return na == nb and len(na) >= 8

warsh = load_warsh()
hafs = load_hafs()

def show(sura, w_range, label=""):
    w = warsh.get(sura, {})
    h = hafs.get(sura, {})
    if label:
        print(f"  --- {label} ---")
    for wa in w_range:
        wt = w.get(wa, "")
        if not wt:
            continue
        print(f"  W[{wa}]: {wt[:70]}")
        for dh in range(-3, 6):
            ha = wa + dh
            ht = h.get(ha, "")
            if ht:
                mark = "✓" if sim(wt, ht) else " "
                print(f"    {mark} H[{ha:>3}]: {ht[:65]}")

def quick_show(sura, ranges_list):
    """Show small ranges around given warsh ayas."""
    w = warsh.get(sura, {})
    h = hafs.get(sura, {})
    w_last = max(w.keys()) if w else 0
    h_last = max(h.keys()) if h else 0
    print(f"\nS{sura} W={w_last} H={h_last}")
    for r in ranges_list:
        for wa in r:
            wt = w.get(wa, "")
            if not wt:
                continue
            best = None
            for dh in range(-6, 8):
                ha = wa + dh
                ht = h.get(ha, "")
                if ht and sim(wt, ht):
                    best = (ha, dh)
                    break
            if best:
                ha, dh = best
                ht = h.get(ha, "")
                print(f"  W[{wa}]=H[{ha}](off={dh:+d}): {wt[:45]} | {ht[:45]}")
            else:
                print(f"  W[{wa}]=? : {wt[:60]}")

# ===== S5 المائدة =====
print("\n" + "="*70)
print("S5 المائدة (diff=-2): expect 2 splits")
quick_show(5, [range(1, 8), range(33, 39)])

# ===== S6 الأنعام =====
print("\n" + "="*70)
print("S6 الأنعام (diff=-2): expect 2 splits")
quick_show(6, [range(1, 8), range(65, 73), range(78, 85)])

# ===== S11 هود =====
print("\n" + "="*70)
print("S11 هود (diff=+2): expect 2 merges")
quick_show(11, [range(1, 6), range(53, 60), range(87, 94), range(116, 122)])

# ===== S13 الرعد =====
print("\n" + "="*70)
print("S13 الرعد (diff=-1): expect 1 split")
quick_show(13, [range(1, 8), range(5, 9), range(17, 22), range(24, 28), range(41, 45)])

# ===== S14 إبراهيم =====
print("\n" + "="*70)
print("S14 إبراهيم (diff=-2): expect 2 splits")
quick_show(14, [range(1, 10), range(10, 18), range(20, 27), range(50, 55)])

# ===== S18 الكهف =====
print("\n" + "="*70)
print("S18 الكهف (diff=+5): complex")
quick_show(18, [range(1, 6), range(35, 42), range(85, 93), range(97, 106)])

# ===== S22 الحج =====
print("\n" + "="*70)
print("S22 الحج (diff=+2): 2 merges expected")
quick_show(22, [range(1, 6), range(17, 24), range(73, 77)])

# ===== S24 النور =====
print("\n" + "="*70)
print("S24 النور (diff=+2): complex")
quick_show(24, [range(1, 8), range(11, 18), range(22, 28), range(34, 40), range(40, 46), range(59, 63)])

# ===== S27 النمل =====
print("\n" + "="*70)
print("S27 النمل (diff=-2): 2 splits")
quick_show(27, [range(1, 6), range(32, 38), range(44, 50), range(91, 96)])

# ===== S38 ص =====
print("\n" + "="*70)
print("S38 ص (diff=+2): 2 merges or complex")
quick_show(38, [range(1, 8), range(83, 89)])

# ===== S39 الزمر =====
print("\n" + "="*70)
print("S39 الزمر (diff=+3): complex")
quick_show(39, [range(1, 8), range(12, 18), range(36, 42), range(69, 73)])

# ===== S42 الشورى =====
print("\n" + "="*70)
print("S42 الشورى (diff=+3): complex")
quick_show(42, [range(1, 6), range(9, 14), range(28, 35), range(47, 51)])

# ===== S44 الدخان =====
print("\n" + "="*70)
print("S44 الدخان (diff=+3): complex")
quick_show(44, [range(1, 8), range(31, 38), range(40, 47), range(53, 57)])

# ===== S52 الطور =====
print("\n" + "="*70)
print("S52 الطور (diff=+2): 2 merges")
quick_show(52, [range(1, 7), range(10, 16), range(44, 49)])

# ===== S55 الرحمن =====
print("\n" + "="*70)
print("S55 الرحمن (diff=+1): 1 merge")
quick_show(55, [range(1, 7), range(33, 39), range(74, 78)])

# ===== S56 الواقعة =====
print("\n" + "="*70)
print("S56 الواقعة (diff=-3): 3 splits")
quick_show(56, [range(1, 8), range(10, 16), range(19, 27), range(43, 49), range(93, 100)])

# ===== S71 نوح =====
print("\n" + "="*70)
print("S71 نوح (diff=-2): 2 splits")
quick_show(71, [range(1, 6), range(22, 29)])

# ===== S73 المزمل =====
print("\n" + "="*70)
print("S73 المزمل (diff=+2): 2 merges")
quick_show(73, [range(1, 8), range(14, 20)])

# ===== S89 الفجر =====
print("\n" + "="*70)
print("S89 الفجر (diff=-2): 2 splits")
quick_show(89, [range(1, 8), range(16, 22), range(28, 32)])
