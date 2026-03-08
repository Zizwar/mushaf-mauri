#!/usr/bin/env python3
"""Final targeted check for complex surahs."""
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

def best_offset(sura, w_aya):
    w = warsh.get(sura, {})
    h = hafs.get(sura, {})
    wt = w.get(w_aya, "")
    if not wt:
        return None
    for offset in range(-6, 8):
        ha = w_aya + offset
        ht = h.get(ha, "")
        if ht and sim(wt, ht):
            return (ha, offset)
    return None

def scan_transitions(sura, diff):
    """Find transitions - show key transition zones."""
    w = warsh.get(sura, {})
    h = hafs.get(sura, {})
    w_last = max(w.keys()) if w else 0
    h_last = max(h.keys()) if h else 0

    results = {}
    prev_off = None
    trans = []
    for wa in range(1, w_last+1):
        r = best_offset(sura, wa)
        if r:
            ha, off = r
            results[wa] = (ha, off)
            if off != prev_off:
                trans.append((wa, ha, off))
                prev_off = off

    print(f"\nS{sura} diff={diff:+d} W={w_last} H={h_last}")
    print(f"  Transitions: {[(t[0], t[2]) for t in trans]}")

    # Show content around each transition
    for (wa, ha, off) in trans:
        print(f"  >>> transition at W[{wa}]=H[{ha}] off={off:+d}")
        for wc in range(max(1, wa-2), min(w_last+1, wa+3)):
            wt = w.get(wc, "")[:50]
            r2 = results.get(wc)
            if r2:
                hc, o2 = r2
                ht = h.get(hc, "")[:50]
                print(f"    W[{wc:>3}]=H[{hc:>3}](off={o2:+d}): {wt[:35]}| {ht[:35]}")
            else:
                print(f"    W[{wc:>3}]=?       : {wt[:55]}")

# Complex surahs that need investigation
complex_cases = [
    (5, -2), (6, -2), (11, +2), (13, -1), (14, -2),
    (18, +5), (22, +2), (24, +2), (27, -2), (38, +2),
    (39, +3), (56, -3), (71, -2), (89, -2),
]

for sura, diff in complex_cases:
    scan_transitions(sura, diff)
