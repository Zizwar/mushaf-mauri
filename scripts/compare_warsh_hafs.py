#!/usr/bin/env python3
"""
Warsh vs Hafs Ayah Comparison Tool
====================================
Outputs Arabic texts side by side for human reading.
NO programmatic text comparison — Claude reads and decides.

Output file: scripts/comparison_report.txt
"""

import sqlite3
import re
import json
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "assets", "qurantxtdb.db")
JS_PATH = os.path.join(BASE, "src", "data", "ayatJson.js")
OUT_PATH = os.path.join(BASE, "scripts", "comparison_report.txt")

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

# ── Load data ──────────────────────────────────────────────────────────────

def load_warsh():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT suraID, ayaNum, content FROM aya_audio ORDER BY suraID, ayaNum")
    data = {}
    for sura, aya, text in cur.fetchall():
        data.setdefault(sura, {})[aya] = text or ""
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

# ── Helpers ────────────────────────────────────────────────────────────────

def get_aya(dataset, sura, aya):
    return dataset.get(sura, {}).get(aya, "—غير موجود—")

def last_aya(dataset, sura):
    ayas = dataset.get(sura, {})
    return max(ayas.keys()) if ayas else 0

def section(title):
    return f"\n{'═'*70}\n  {title}\n{'═'*70}\n"

def row(label, text):
    return f"  {label:<12} {text}\n"

# ── Binary search checkpoints ──────────────────────────────────────────────

def binary_checkpoints(w_last, h_last):
    """
    Given that Warsh has w_last ayahs and Hafs has h_last ayahs (diff != 0),
    return a list of Warsh ayah numbers to check as pivot points.
    Strategy: quarter points + mid, to quickly narrow the shift zone.
    """
    points = set()
    # Always check aya 1 and 2 (most shifts are at fawatih)
    points.add(1)
    points.add(2)
    # Quarter points
    for frac in [0.25, 0.5, 0.75]:
        p = max(1, int(w_last * frac))
        points.add(p)
    # Points near common shift areas (ayahs 90-100 for Al-Imran type)
    if w_last > 100:
        for p in [90, 91, 92, 93, 94, 95]:
            points.add(p)
    return sorted(points)

# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Loading data...")
    warsh = load_warsh()
    hafs  = load_hafs()

    w_total = sum(last_aya(warsh, s) for s in range(1, 115))
    h_total = sum(last_aya(hafs,  s) for s in range(1, 115))

    lines = []
    lines.append("WARSH ↔ HAFS AYAH MAPPING ANALYSIS\n")
    lines.append(f"Warsh total ayahs: {w_total}  |  Hafs total ayahs: {h_total}  |  Diff: {h_total - w_total:+d}\n")

    same_count  = []
    diff_surahs = []

    # ── Phase 1: Last-ayah comparison for all 114 surahs ──────────────────
    lines.append(section("PHASE 1 — آخر آية لكل سورة (ورش ↔ حفص)"))
    lines.append("  السورة            ورش_آخر  حفص_آخر  فرق   آخر آية ورش                         آخر آية حفص\n")
    lines.append("  " + "─"*110 + "\n")

    for sura in range(1, 115):
        wl = last_aya(warsh, sura)
        hl = last_aya(hafs,  sura)
        diff = hl - wl
        w_text = get_aya(warsh, sura, wl)
        h_text = get_aya(hafs,  sura, hl)
        name = SURAH_NAMES[sura] if sura < len(SURAH_NAMES) else f"S{sura}"

        marker = "◄ DIFF" if diff != 0 else ""
        lines.append(
            f"  [{sura:03d}] {name:<12}  {wl:>4}    {hl:>4}    {diff:>+3}  "
            f"  {w_text[:40]:<42}  {h_text[:40]}  {marker}\n"
        )

        if diff == 0:
            same_count.append(sura)
        else:
            diff_surahs.append((sura, wl, hl, diff))

    # ── Phase 2: Detailed pivot points for diff surahs ────────────────────
    lines.append(section(f"PHASE 2 — تفاصيل السور المختلفة ({len(diff_surahs)} سورة)"))
    lines.append("  اقرأ الأزواج وحدد: هل الآيتان متطابقتان في المعنى؟ (نعم/لا)\n")

    for sura, wl, hl, diff in diff_surahs:
        name = SURAH_NAMES[sura] if sura < len(SURAH_NAMES) else f"S{sura}"
        lines.append(f"\n  ┌─ سورة {sura} ({name})  ورش={wl}  حفص={hl}  فرق={diff:+d}\n")

        checkpoints = binary_checkpoints(wl, hl)

        for w_aya in checkpoints:
            if w_aya > wl:
                continue
            # Show Warsh ayah vs several Hafs candidates around expected offset
            w_text = get_aya(warsh, sura, w_aya)

            # Show Hafs at same position AND at offset positions
            hafs_candidates = set()
            hafs_candidates.add(w_aya)  # offset 0
            for offset in range(-3, 4):
                h_cand = w_aya + offset
                if 1 <= h_cand <= hl:
                    hafs_candidates.add(h_cand)

            lines.append(f"\n  │  ── آية ورش [{w_aya}] ──\n")
            lines.append(f"  │  ورش  [{w_aya:>3}]: {w_text}\n")
            for h_aya in sorted(hafs_candidates):
                h_text = get_aya(hafs, sura, h_aya)
                tag = " ◄ نفس الرقم" if h_aya == w_aya else ""
                lines.append(f"  │  حفص  [{h_aya:>3}]: {h_text}{tag}\n")

        lines.append(f"  └─ نهاية سورة {sura}\n")

    # ── Phase 3: Spot-check for same-count surahs ─────────────────────────
    lines.append(section("PHASE 3 — تحقق عشوائي للسور ذات العدد المتساوي"))
    lines.append("  اقرأ كل زوج — إن اختلف المعنى رغم تساوي العدد فالسورة تحتاج تحقيقاً أعمق\n")

    for sura in same_count:
        wl = last_aya(warsh, sura)
        name = SURAH_NAMES[sura] if sura < len(SURAH_NAMES) else f"S{sura}"

        # Check at aya 1 and middle
        check_points = [1, max(1, wl // 2)]
        interesting = False
        pairs = []
        for w_aya in check_points:
            w_text = get_aya(warsh, sura, w_aya)
            h_text = get_aya(hafs,  sura, w_aya)
            pairs.append((w_aya, w_text, h_text))

        lines.append(f"\n  [{sura:03d}] {name} (آخر={wl})\n")
        for w_aya, w_text, h_text in pairs:
            lines.append(f"    ورش [{w_aya:>3}]: {w_text[:80]}\n")
            lines.append(f"    حفص [{w_aya:>3}]: {h_text[:80]}\n")

    lines.append(section("نهاية التقرير"))
    lines.append(f"  السور ذات العدد المختلف: {[s for s,*_ in diff_surahs]}\n")
    lines.append(f"  السور ذات العدد المتساوي: {len(same_count)}\n")

    # Write output
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"Done. Report saved to: {OUT_PATH}")
    print(f"Surahs with count diff: {[s for s,*_ in diff_surahs]}")
    print(f"Surahs with same count: {len(same_count)}")

if __name__ == "__main__":
    main()
