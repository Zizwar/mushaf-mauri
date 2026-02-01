import React, { useState, useCallback, useMemo } from "react";
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
  calcKhitma,
  getHizbQuarterPosition,
  getSuraName,
  getPageBySuraAya,
} from "../utils/quranHelpers";
import { getAyahText } from "../utils/ayahText";

const ACCENT = "#1a5c2e";

interface KhatmaScreenProps {
  onGoBack: () => void;
}

export default function KhatmaScreen({ onGoBack }: KhatmaScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quira = useAppStore((s) => s.quira);
  const khatma = useAppStore((s) => s.khatma);
  const setKhatma = useAppStore((s) => s.setKhatma);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setPendingPlayAya = useAppStore((s) => s.setPendingPlayAya);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";

  const [selectedJuz, setSelectedJuz] = useState(khatma.juz || 1);
  const [selectedDays, setSelectedDays] = useState(khatma.day || 30);

  const juzOptions = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}`,
      })),
    []
  );

  const dayOptions = useMemo(
    () =>
      [3, 5, 7, 10, 14, 15, 20, 30, 40, 60, 90, 120, 180, 240].map((d) => ({
        value: d,
        label: `${d}`,
      })),
    []
  );

  // Compute current portion info when khatma is active
  const portionInfo = useMemo(() => {
    if (!khatma.ok) return null;

    const currentStart = khatma.startRob3 + khatma.selection * khatma.rob3Day;
    const currentEnd = Math.min(currentStart + khatma.rob3Day, 240);

    const startPos = getHizbQuarterPosition(currentStart);
    const endIdx = currentEnd >= 240 ? 239 : currentEnd;
    const endPos = getHizbQuarterPosition(endIdx);

    if (!startPos || !endPos) return null;

    const startText = getAyahText(startPos.sura, startPos.aya, quira);
    const endText = getAyahText(endPos.sura, endPos.aya, quira);
    const startPage = getPageBySuraAya(startPos.sura, startPos.aya, quira);

    const totalDays = Math.ceil((240 - (khatma.juz - 1) * 8) / khatma.rob3Day);
    const isComplete = khatma.selection >= totalDays;

    return {
      startSura: startPos.sura,
      startAya: startPos.aya,
      endSura: endPos.sura,
      endAya: endPos.aya,
      startText,
      endText,
      startPage,
      day: khatma.selection + 1,
      totalDays,
      isComplete,
    };
  }, [khatma, quira]);

  const handleStartKhatma = useCallback(() => {
    const result = calcKhitma(selectedJuz, selectedDays);
    setKhatma({
      juz: selectedJuz,
      day: selectedDays,
      startRob3: result.startRob3,
      endRob3: result.endRob3,
      rob3Day: result.rob3Day,
      selection: 0,
      ok: true,
    });
  }, [selectedJuz, selectedDays, setKhatma]);

  const handleNext = useCallback(() => {
    const totalDays = Math.ceil((240 - (khatma.juz - 1) * 8) / khatma.rob3Day);
    const nextSelection = khatma.selection + 1;

    if (nextSelection >= totalDays) {
      Alert.alert(t("khatma_complete", lang));
      setKhatma({ ...khatma, selection: 0, ok: false });
      return;
    }

    setKhatma({ ...khatma, selection: nextSelection });
  }, [khatma, lang, setKhatma]);

  const handleListen = useCallback(() => {
    if (!portionInfo) return;
    const page = portionInfo.startPage;
    setSelectedAya({
      sura: portionInfo.startSura,
      aya: portionInfo.startAya,
      page,
      id: `s${portionInfo.startSura}a${portionInfo.startAya}z`,
    });
    setPendingPlayAya({
      sura: portionInfo.startSura,
      aya: portionInfo.startAya,
      page,
    });
    onGoBack();
  }, [portionInfo, setSelectedAya, setPendingPlayAya, onGoBack]);

  const handleReset = useCallback(() => {
    setKhatma({ ...khatma, selection: 0, ok: false });
  }, [khatma, setKhatma]);

  const formatPortion = () => {
    const juzPart = Math.floor(khatma.rob3Day / 8);
    const rob3Part = khatma.rob3Day % 8;
    let text = "";
    if (juzPart > 0) text += `${juzPart} ${t("juz_word", lang)}`;
    if (rob3Part > 0) {
      if (text) text += " ";
      text += `${rob3Part} ${t("rob3_word", lang)}`;
    }
    return text || `1 ${t("rob3_word", lang)}`;
  };

  const renderPicker = (
    label: string,
    items: { value: number; label: string }[],
    selected: number,
    onChange: (val: number) => void
  ) => (
    <View style={[styles.pickerCard, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.pickerLabel, { color: mutedColor }]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pickerScroll}
      >
        {items.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.pickerChip,
              {
                borderColor: selected === item.value ? ACCENT : borderColor,
                backgroundColor:
                  selected === item.value
                    ? isDark
                      ? "#1a3a2e"
                      : "#e8f5e9"
                    : "transparent",
              },
            ]}
            onPress={() => onChange(item.value)}
          >
            <Text
              style={[
                styles.pickerChipText,
                {
                  color: selected === item.value ? ACCENT : textColor,
                  fontWeight: selected === item.value ? "700" : "400",
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("khatma_title", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!khatma.ok ? (
          <>
            {/* Setup */}
            {renderPicker(t("select_juz", lang), juzOptions, selectedJuz, setSelectedJuz)}
            {renderPicker(t("select_days", lang), dayOptions, selectedDays, setSelectedDays)}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: ACCENT }]}
              onPress={handleStartKhatma}
            >
              <Ionicons name="book" size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>{t("start_khatma", lang)}</Text>
            </Pressable>
          </>
        ) : portionInfo ? (
          <>
            {/* Active Khatma */}
            <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.dayLabel, { color: ACCENT }]}>
                {t("day_number", lang)} {portionInfo.day} {t("of_total", lang)} {portionInfo.totalDays}
              </Text>
              <Text style={[styles.portionText, { color: textColor }]}>
                {t("daily_portion", lang)}: {formatPortion()}
              </Text>
            </View>

            {/* Start Ayah */}
            <View style={[styles.ayahCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.ayahLabel, { color: ACCENT }]}>
                {t("from_aya", lang)}
              </Text>
              <Text style={[styles.ayahSura, { color: textColor }]}>
                {getSuraName(portionInfo.startSura)} - {t("aya_s", lang)} {portionInfo.startAya}
              </Text>
              {portionInfo.startText ? (
                <Text
                  style={[styles.ayahText, { color: textColor }]}
                  numberOfLines={3}
                >
                  {portionInfo.startText}
                </Text>
              ) : null}
            </View>

            {/* End Ayah */}
            <View style={[styles.ayahCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.ayahLabel, { color: ACCENT }]}>
                {t("to_aya", lang)}
              </Text>
              <Text style={[styles.ayahSura, { color: textColor }]}>
                {getSuraName(portionInfo.endSura)} - {t("aya_s", lang)} {portionInfo.endAya}
              </Text>
              {portionInfo.endText ? (
                <Text
                  style={[styles.ayahText, { color: textColor }]}
                  numberOfLines={3}
                >
                  {portionInfo.endText}
                </Text>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: ACCENT }]}
                onPress={handleNext}
              >
                <Ionicons name="arrow-back" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t("next_portion", lang)}</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: "#4285f4" }]}
                onPress={handleListen}
              >
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t("listen_portion", lang)}</Text>
              </Pressable>
            </View>

            {/* Reset */}
            <Pressable
              style={[styles.resetBtn, { borderColor }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetBtnText, { color: mutedColor }]}>
                {t("cancel", lang)}
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  pickerCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerScroll: {
    gap: 6,
    paddingRight: 8,
  },
  pickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  pickerChipText: {
    fontSize: 13,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  portionText: {
    fontSize: 14,
  },
  ayahCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 6,
  },
  ayahLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  ayahSura: {
    fontSize: 15,
    fontWeight: "600",
  },
  ayahText: {
    fontSize: 16,
    lineHeight: 28,
    writingDirection: "rtl",
    textAlign: "right",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  resetBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
