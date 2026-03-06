import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import {
  getHizbQuarterPosition,
  getSuraName,
  getPageBySuraAya,
  getHizbInfo,
} from "../utils/quranHelpers";
import { getAyahText } from "../utils/ayahText";

const ACCENT = "#1a5c2e";
const ACCENT_LIGHT = "#e8f5e9";

// rob3 per day for each unit
const UNIT_ROB3: Record<"rob3" | "hizb" | "juz", number> = {
  rob3: 1,
  hizb: 4,
  juz: 8,
};

interface KhatmaScreenProps {
  onGoBack: () => void;
  onNavigateToPage?: (page: number, sura?: number, aya?: number) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-MA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function KhatmaScreen({ onGoBack, onNavigateToPage }: KhatmaScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quira = useAppStore((s) => s.quira);
  const quranFont = useAppStore((s) => s.quranFont);
  const khatma = useAppStore((s) => s.khatma);
  const setKhatma = useAppStore((s) => s.setKhatma);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setPendingPlayAya = useAppStore((s) => s.setPendingPlayAya);

  const isDark = !!theme.night;
  const isRTL = lang === "ar" || lang === "he";
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";

  // Setup state
  const [unit, setUnit] = useState<"rob3" | "hizb" | "juz">(khatma.unit || "hizb");
  const [startJuz, setStartJuz] = useState(khatma.startJuz || 1);

  // Computed setup values
  const totalRob3 = useMemo(() => (31 - startJuz) * 8, [startJuz]);
  const rob3PerDay = UNIT_ROB3[unit];
  const totalDays = useMemo(() => Math.ceil(totalRob3 / rob3PerDay), [totalRob3, rob3PerDay]);
  const finishDate = useMemo(
    () => Date.now() + totalDays * 86400000,
    [totalDays]
  );

  // Active portion info
  const [portionInfo, setPortionInfo] = useState<{
    startSura: number; startAya: number;
    endSura: number; endAya: number;
    startText: string | null; endText: string | null;
    startPage: number;
    startHizb: string; endHizb: string;
    day: number; totalDays: number;
    progress: number;
  } | null>(null);

  useEffect(() => {
    if (!khatma.ok) { setPortionInfo(null); return; }

    const rob3Day = khatma.rob3Day;
    const startRob3 = khatma.startRob3;
    const day = khatma.selection;
    const total = khatma.totalDays;

    const curStart = startRob3 + day * rob3Day;
    const curEnd = Math.min(curStart + rob3Day, 240) - 1;

    const startPos = getHizbQuarterPosition(curStart);
    const endPos = getHizbQuarterPosition(curEnd < 0 ? 0 : curEnd);

    if (!startPos || !endPos) { setPortionInfo(null); return; }

    const startPage = getPageBySuraAya(startPos.sura, startPos.aya, quira);
    const startHizb = getHizbInfo(startPos.sura, startPos.aya).label;
    const endHizb = getHizbInfo(endPos.sura, endPos.aya).label;

    Promise.all([
      getAyahText(startPos.sura, startPos.aya, quira),
      getAyahText(endPos.sura, endPos.aya, quira),
    ]).then(([startText, endText]) => {
      setPortionInfo({
        startSura: startPos.sura, startAya: startPos.aya,
        endSura: endPos.sura, endAya: endPos.aya,
        startText, endText, startPage,
        startHizb, endHizb,
        day: day + 1, totalDays: total,
        progress: (day + 1) / total,
      });
    });
  }, [khatma, quira]);

  const handleStart = useCallback(() => {
    setKhatma({
      unit,
      startJuz,
      startRob3: (startJuz - 1) * 8,
      rob3Day: rob3PerDay,
      selection: 0,
      totalDays,
      startDate: Date.now(),
      ok: true,
    });
  }, [unit, startJuz, rob3PerDay, totalDays, setKhatma]);

  const handleNext = useCallback(() => {
    const next = khatma.selection + 1;
    if (next >= khatma.totalDays) {
      Alert.alert("🎉", t("khatma_complete", lang), [
        { text: "OK", onPress: () => setKhatma({ ...khatma, ok: false }) },
      ]);
      return;
    }
    setKhatma({ ...khatma, selection: next });
  }, [khatma, lang, setKhatma]);

  const handleListen = useCallback(() => {
    if (!portionInfo) return;
    setSelectedAya({
      sura: portionInfo.startSura,
      aya: portionInfo.startAya,
      page: portionInfo.startPage,
      id: `s${portionInfo.startSura}a${portionInfo.startAya}z`,
    });
    setPendingPlayAya({
      sura: portionInfo.startSura,
      aya: portionInfo.startAya,
      page: portionInfo.startPage,
    });
    onGoBack();
  }, [portionInfo, setSelectedAya, setPendingPlayAya, onGoBack]);

  const handleGoToPage = useCallback(() => {
    if (!portionInfo) return;
    if (onNavigateToPage) {
      onNavigateToPage(portionInfo.startPage, portionInfo.startSura, portionInfo.startAya);
    }
    onGoBack();
  }, [portionInfo, onNavigateToPage, onGoBack]);

  const handleReset = useCallback(() => {
    Alert.alert(t("cancel", lang), t("khatma_complete", lang), [
      { text: t("cancel", lang), style: "cancel" },
      { text: "OK", onPress: () => setKhatma({ ...khatma, ok: false }) },
    ]);
  }, [khatma, lang, setKhatma]);

  const UNITS: { key: "rob3" | "hizb" | "juz"; labelKey: string; desc: string }[] = [
    { key: "rob3", labelKey: "unit_rob3", desc: "≈ 1 ربع" },
    { key: "hizb", labelKey: "unit_hizb", desc: "≈ ½ جزء" },
    { key: "juz",  labelKey: "unit_juz",  desc: "≈ جزء كامل" },
  ];

  const juzList = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("khatma_title", lang)}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {!khatma.ok ? (
          /* ── SETUP MODE ── */
          <>
            {/* Unit picker */}
            <Text style={[styles.sectionLabel, { color: mutedColor }]}>
              {t("choose_unit", lang)}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.unitRow}>
                {UNITS.map((u) => {
                  const active = unit === u.key;
                  return (
                    <Pressable
                      key={u.key}
                      style={[styles.unitChip, active && styles.unitChipActive, { borderColor: active ? ACCENT : borderColor }]}
                      onPress={() => setUnit(u.key)}
                    >
                      <Text style={[styles.unitLabel, { color: active ? "#fff" : textColor }]}>
                        {t(u.labelKey, lang)}
                      </Text>
                      <Text style={[styles.unitDesc, { color: active ? "rgba(255,255,255,0.75)" : mutedColor }]}>
                        {u.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Start juz picker */}
            <Text style={[styles.sectionLabel, { color: mutedColor }]}>
              {t("start_from_juz", lang)}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.juzScroll}>
                {juzList.map((j) => {
                  const active = startJuz === j;
                  return (
                    <Pressable
                      key={j}
                      style={[styles.juzChip, { borderColor: active ? ACCENT : borderColor, backgroundColor: active ? ACCENT_LIGHT : "transparent" }]}
                      onPress={() => setStartJuz(j)}
                    >
                      <Text style={[styles.juzChipText, { color: active ? ACCENT : textColor, fontWeight: active ? "700" : "400" }]}>
                        {j}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: isDark ? "#1a3a2e" : ACCENT_LIGHT, borderColor: ACCENT + "40" }]}>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                <Text style={[styles.summaryText, { color: ACCENT }]}>
                  {totalDays} {t("khatma_days_needed", lang)}
                </Text>
              </View>
              <Text style={[styles.summaryFinish, { color: ACCENT }]}>
                {t("khatma_summary", lang)}: {formatDate(finishDate)}
              </Text>
            </View>

            <Pressable style={[styles.startBtn, { backgroundColor: ACCENT }]} onPress={handleStart}>
              <Ionicons name="book" size={20} color="#fff" />
              <Text style={styles.startBtnText}>{t("start_khatma", lang)}</Text>
            </Pressable>
          </>
        ) : portionInfo ? (
          /* ── ACTIVE MODE ── */
          <>
            {/* Progress */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.dayText, { color: ACCENT }]}>
                  {t("day_number", lang)} {portionInfo.day}
                </Text>
                <Text style={[styles.dayTotal, { color: mutedColor }]}>
                  {t("of_total", lang)} {portionInfo.totalDays}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
                <View style={[styles.progressFill, { width: `${Math.min(portionInfo.progress * 100, 100)}%` as any, backgroundColor: ACCENT }]} />
              </View>
              <Text style={[styles.progressPct, { color: mutedColor }]}>
                {Math.round(portionInfo.progress * 100)}%
              </Text>
            </View>

            {/* Today's portion label */}
            <Text style={[styles.sectionLabel, { color: mutedColor }]}>
              {t("today_portion", lang)}
            </Text>

            {/* Start ayah card */}
            <AyahCard
              label={t("from_aya", lang)}
              hizbInfo={portionInfo.startHizb}
              sura={portionInfo.startSura}
              aya={portionInfo.startAya}
              text={portionInfo.startText}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
              mutedColor={mutedColor}
              quranFont={quranFont}
              lang={lang}
            />

            {/* End ayah card */}
            <AyahCard
              label={t("to_aya", lang)}
              hizbInfo={portionInfo.endHizb}
              sura={portionInfo.endSura}
              aya={portionInfo.endAya}
              text={portionInfo.endText}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
              mutedColor={mutedColor}
              quranFont={quranFont}
              lang={lang}
            />

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: "#4285f4" }]} onPress={handleListen}>
                <Ionicons name="headset-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t("listen_portion", lang)}</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: ACCENT }]} onPress={handleGoToPage}>
                <Ionicons name="book-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t("go_to_page", lang)}</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.nextBtn, { backgroundColor: ACCENT }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>{t("next_portion", lang)}</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            </Pressable>

            <Pressable style={[styles.resetLink]} onPress={handleReset}>
              <Text style={[styles.resetText, { color: mutedColor }]}>{t("cancel", lang)}</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.loading}>
            <Text style={{ color: mutedColor }}>...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── AyahCard sub-component ──────────────────────────────
interface AyahCardProps {
  label: string;
  hizbInfo: string;
  sura: number;
  aya: number;
  text: string | null;
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  quranFont: string;
  lang: string;
}

function AyahCard({ label, hizbInfo, sura, aya, text, cardBg, borderColor, textColor, mutedColor, quranFont, lang }: AyahCardProps) {
  return (
    <View style={[styles.ayahCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.ayahCardHeader}>
        <Text style={[styles.ayahLabel, { color: ACCENT }]}>{label}</Text>
        <Text style={[styles.hizbBadge, { color: mutedColor }]}>{hizbInfo}</Text>
      </View>
      <Text style={[styles.ayahSura, { color: textColor }]}>
        {getSuraName(sura)} · {t("aya_s", lang as any)} {aya}
      </Text>
      {text ? (
        <Text style={[styles.ayahText, quranFont !== "default" && { fontFamily: quranFont }]}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, gap: 10, paddingBottom: 48 },

  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", marginTop: 4 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },

  // Unit picker
  unitRow: { flexDirection: "row", padding: 10, gap: 8 },
  unitChip: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 10, borderWidth: 1.5,
  },
  unitChipActive: { backgroundColor: ACCENT },
  unitLabel: { fontSize: 15, fontWeight: "700" },
  unitDesc: { fontSize: 11, marginTop: 2 },

  // Juz picker
  juzScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  juzChip: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  juzChipText: { fontSize: 13 },

  // Summary
  summaryCard: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    alignItems: "center", gap: 4,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryText: { fontSize: 18, fontWeight: "700" },
  summaryFinish: { fontSize: 13, opacity: 0.8 },

  // Start button
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 14, gap: 8,
  },
  startBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // Progress
  progressHeader: { flexDirection: "row", alignItems: "baseline", gap: 6, padding: 14, paddingBottom: 10 },
  dayText: { fontSize: 20, fontWeight: "800" },
  dayTotal: { fontSize: 14 },
  progressTrack: { height: 6, marginHorizontal: 14, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPct: { fontSize: 12, textAlign: "center", paddingVertical: 8 },

  // Ayah cards
  ayahCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  ayahCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ayahLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  hizbBadge: { fontSize: 12, fontWeight: "600" },
  ayahSura: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  ayahText: {
    fontSize: 18, lineHeight: 32, color: "#222",
    textAlign: "center", writingDirection: "rtl",
    marginTop: 6,
  },

  // Actions
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 13, borderRadius: 12, gap: 6,
  },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 15, borderRadius: 14, gap: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  resetLink: { alignItems: "center", paddingVertical: 10 },
  resetText: { fontSize: 14 },
  loading: { flex: 1, alignItems: "center", paddingTop: 40 },
});
