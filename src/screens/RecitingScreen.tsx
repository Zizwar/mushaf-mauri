import React, { useState, useMemo, useCallback } from "react";
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
  allSuwar,
  getAyahsForSura,
  getSuraName,
  getPageBySuraAya,
} from "../utils/quranHelpers";

const ACCENT = "#1a5c2e";

interface RecitingScreenProps {
  onGoBack: () => void;
}

export default function RecitingScreen({ onGoBack }: RecitingScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setPendingPlayAya = useAppStore((s) => s.setPendingPlayAya);
  const setTekrar = useAppStore((s) => s.setTekrar);
  const quira = useAppStore((s) => s.quira);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";

  const [startSura, setStartSura] = useState(1);
  const [startAya, setStartAya] = useState(1);
  const [endSura, setEndSura] = useState(1);
  const [endAya, setEndAya] = useState(7);
  const [repeatCount, setRepeatCount] = useState(3);

  const suwar = useMemo(() => allSuwar(), []);
  const startAyahs = useMemo(() => getAyahsForSura(startSura), [startSura]);
  const endAyahs = useMemo(() => getAyahsForSura(endSura), [endSura]);

  const handleStartSuraChange = useCallback((sura: number) => {
    setStartSura(sura);
    setStartAya(1);
  }, []);

  const handleEndSuraChange = useCallback((sura: number) => {
    setEndSura(sura);
    setEndAya(1);
  }, []);

  const handleStart = useCallback(() => {
    // Validate: start must be before or equal to end
    if (startSura > endSura || (startSura === endSura && startAya > endAya)) {
      Alert.alert(t("recitation", lang), t("search_err_length", lang));
      return;
    }

    const page = getPageBySuraAya(startSura, startAya, quira);

    setTekrar({
      startSura,
      startAya,
      endSura,
      endAya,
      repeatCount,
      currentRepeat: 0,
      active: true,
    });

    setSelectedAya({
      sura: startSura,
      aya: startAya,
      page,
      id: `s${startSura}a${startAya}z`,
    });

    setPendingPlayAya({ sura: startSura, aya: startAya, page });
    onGoBack();
  }, [startSura, startAya, endSura, endAya, repeatCount, lang, quira, setTekrar, setSelectedAya, setPendingPlayAya, onGoBack]);

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

  const repeatOptions = [2, 3, 4, 5, 6, 7].map((n) => ({
    value: n,
    label: `${n} ${t("times", lang)}`,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("recitation", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Start Sura */}
        {renderPicker(t("start_sura", lang), suwar, startSura, handleStartSuraChange)}

        {/* Start Aya */}
        {renderPicker(t("start_aya", lang), startAyahs, startAya, setStartAya)}

        {/* End Sura */}
        {renderPicker(t("end_sura", lang), suwar, endSura, handleEndSuraChange)}

        {/* End Aya */}
        {renderPicker(t("end_aya", lang), endAyahs, endAya, setEndAya)}

        {/* Repeat Count */}
        {renderPicker(t("repeat_count", lang), repeatOptions, repeatCount, setRepeatCount)}

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.summaryText, { color: textColor }]}>
            {t("from", lang)}: {getSuraName(startSura)} - {t("aya_s", lang)} {startAya}
          </Text>
          <Text style={[styles.summaryText, { color: textColor }]}>
            {t("to", lang)}: {getSuraName(endSura)} - {t("aya_s", lang)} {endAya}
          </Text>
          <Text style={[styles.summaryText, { color: mutedColor }]}>
            {t("repeat_count", lang)}: {repeatCount} {t("times", lang)}
          </Text>
        </View>

        {/* Start Button */}
        <Pressable
          style={[styles.startBtn, { backgroundColor: ACCENT }]}
          onPress={handleStart}
        >
          <Ionicons name="play" size={22} color="#fff" />
          <Text style={styles.startBtnText}>{t("start_recitation", lang)}</Text>
        </Pressable>
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
  summaryCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    textAlign: "right",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
