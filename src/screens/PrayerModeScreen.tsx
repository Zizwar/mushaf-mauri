import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import {
  allSuwar,
  getAyahCount,
  getSuraName,
} from "../utils/quranHelpers";
import { getSuraVerses, getAyahText } from "../utils/ayahText";
import type { Quira } from "../store/useAppStore";

// ==================== COLOR THEMES ====================

interface ColorTheme {
  id: string;
  label: string;
  textColor: string;
  backgroundColor: string;
}

const COLOR_THEMES: ColorTheme[] = [
  { id: "white_black", label: "أبيض على أسود", textColor: "#ffffff", backgroundColor: "#000000" },
  { id: "gold_green", label: "ذهبي على أخضر", textColor: "#ffd700", backgroundColor: "#1a3c2a" },
  { id: "blue_cream", label: "أزرق على كريمي", textColor: "#1a4a80", backgroundColor: "#fdf5e6" },
  { id: "white_blue", label: "أبيض على أزرق", textColor: "#ffffff", backgroundColor: "#1a2744" },
  { id: "black_white", label: "أسود على أبيض", textColor: "#000000", backgroundColor: "#ffffff" },
  { id: "amber_brown", label: "عنبري على بني", textColor: "#ffbf00", backgroundColor: "#3b2f2f" },
  { id: "green_gray", label: "أخضر على رمادي", textColor: "#90ee90", backgroundColor: "#2d2d2d" },
  { id: "pink_purple", label: "وردي على بنفسجي", textColor: "#ffb6c1", backgroundColor: "#2d1b3d" },
];

const FONT_OPTIONS = [
  { id: "Maghribi", label: "مغربي" },
  { id: "uthmanic", label: "عثماني" },
  { id: "hafs", label: "حفص" },
  { id: "rustam", label: "رستم" },
];

const MIN_FONT_SIZE = 20;
const MAX_FONT_SIZE = 56;
const FONT_STEP = 4;

interface Props {
  onGoBack: () => void;
}

// Load verses for a sura range (potentially spanning multiple surahs)
async function loadVersesForRange(
  startSura: number,
  ayaFrom: number,
  endSura: number,
  ayaTo: number,
  quira: Quira
): Promise<{ sura: number; aya: number; text: string; suraName: string }[]> {
  const all: { sura: number; aya: number; text: string; suraName: string }[] = [];
  for (let s = startSura; s <= endSura; s++) {
    const count = getAyahCount(s);
    const from = s === startSura ? ayaFrom : 1;
    const to = s === endSura && ayaTo > 0 ? Math.min(ayaTo, count) : count;
    const verses = await getSuraVerses(s, from, to, quira);
    const name = getSuraName(s);
    for (const v of verses) {
      all.push({ sura: s, aya: v.aya, text: v.text, suraName: name });
    }
  }
  return all;
}

export default function PrayerModeScreen({ onGoBack }: Props) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);

  // Selection state
  const [startSura, setStartSura] = useState(1);
  const [endSura, setEndSura] = useState(1);
  const [ayaFrom, setAyaFrom] = useState(1);
  const [ayaTo, setAyaTo] = useState(0); // 0 = end of sura
  const [isOpenEnded, setIsOpenEnded] = useState(false);

  // Display state
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Maghribi");
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0]);
  const [showSuraPicker, setShowSuraPicker] = useState<"start" | "end" | null>(null);
  const [showFontPicker, setShowFontPicker] = useState(false);

  // Lock state
  const [locked, setLocked] = useState(false);

  // Free continuation mode
  const [freeContinuation, setFreeContinuation] = useState(false);

  // Ayah preview for range selection
  const [fromPreview, setFromPreview] = useState("");
  const [toPreview, setToPreview] = useState("");

  const suwarList = useMemo(() => allSuwar(), []);
  const startAyahCount = useMemo(() => getAyahCount(startSura), [startSura]);
  const endAyahCount = useMemo(() => getAyahCount(endSura), [endSura]);

  const [verses, setVerses] = useState<{ sura: number; aya: number; text: string; suraName: string }[]>([]);

  // Keep screen awake
  useEffect(() => {
    activateKeepAwakeAsync("prayer_mode").catch(() => {});
    return () => { deactivateKeepAwake("prayer_mode"); };
  }, []);

  // Restore status bar on unmount
  useEffect(() => {
    return () => { StatusBar.setHidden(false); };
  }, []);

  // Load verses
  useEffect(() => {
    const actualEndSura = isOpenEnded || freeContinuation ? 114 : endSura;
    const actualAyaTo = isOpenEnded || freeContinuation ? 0 : ayaTo;
    loadVersesForRange(startSura, ayaFrom, actualEndSura, actualAyaTo, quira).then(setVerses);
  }, [startSura, endSura, ayaFrom, ayaTo, isOpenEnded, freeContinuation, quira]);

  // Update ayah previews for selection
  useEffect(() => {
    getAyahText(startSura, ayaFrom, quira).then((text) => {
      setFromPreview(text ? text.substring(0, 60) : "");
    });
  }, [startSura, ayaFrom, quira]);

  useEffect(() => {
    if (ayaTo > 0 && !isOpenEnded) {
      getAyahText(endSura, ayaTo, quira).then((text) => {
        setToPreview(text ? text.substring(0, 60) : "");
      });
    } else {
      setToPreview("");
    }
  }, [endSura, ayaTo, isOpenEnded, quira]);

  const handleStartSuraSelect = useCallback((sura: number) => {
    setStartSura(sura);
    if (sura > endSura) setEndSura(sura);
    setAyaFrom(1);
    setAyaTo(0);
    setShowSuraPicker(null);
    setFreeContinuation(false);
  }, [endSura]);

  const handleEndSuraSelect = useCallback((sura: number) => {
    if (sura < startSura) return;
    setEndSura(sura);
    setAyaTo(0);
    setShowSuraPicker(null);
    setFreeContinuation(false);
  }, [startSura]);

  const handlePrevSura = useCallback(() => {
    if (startSura > 1) {
      const newSura = startSura - 1;
      setStartSura(newSura);
      setEndSura(newSura);
      setAyaFrom(1);
      setAyaTo(0);
      setFreeContinuation(false);
    }
  }, [startSura]);

  const handleNextSura = useCallback(() => {
    if (startSura < 114) {
      const newSura = startSura + 1;
      setStartSura(newSura);
      setEndSura(newSura);
      setAyaFrom(1);
      setAyaTo(0);
      setFreeContinuation(false);
    }
  }, [startSura]);

  const handleGoBack = useCallback(() => {
    StatusBar.setHidden(false);
    onGoBack();
  }, [onGoBack]);

  // Track which sura sections to show headers for
  const suraBreaks = useMemo(() => {
    const breaks = new Set<number>();
    let lastSura = -1;
    for (const v of verses) {
      if (v.sura !== lastSura) {
        breaks.add(verses.indexOf(v));
        lastSura = v.sura;
      }
    }
    return breaks;
  }, [verses]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorTheme.backgroundColor }]}>
      <StatusBar hidden />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable onPress={handleGoBack} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color="#1a5c2e" />
        </Pressable>

        {/* Start Sura */}
        <Pressable style={styles.suraPicker} onPress={() => setShowSuraPicker(showSuraPicker === "start" ? null : "start")}>
          <Text style={styles.suraPickerText}>{getSuraName(startSura)}</Text>
          <Ionicons name="chevron-down" size={16} color="#1a5c2e" />
        </Pressable>

        {/* End Sura (if different) */}
        {endSura !== startSura && (
          <>
            <Text style={styles.rangeLabel}>←</Text>
            <Pressable style={styles.suraPicker} onPress={() => setShowSuraPicker(showSuraPicker === "end" ? null : "end")}>
              <Text style={styles.suraPickerText}>{getSuraName(endSura)}</Text>
              <Ionicons name="chevron-down" size={16} color="#1a5c2e" />
            </Pressable>
          </>
        )}

        {/* Multi-sura toggle */}
        <Pressable
          style={[styles.miniBtn, endSura !== startSura && styles.miniBtnActive]}
          onPress={() => {
            if (endSura === startSura) {
              setEndSura(Math.min(startSura + 1, 114));
            } else {
              setEndSura(startSura);
              setAyaTo(0);
            }
          }}
        >
          <Ionicons name="layers-outline" size={16} color={endSura !== startSura ? "#fff" : "#1a5c2e"} />
        </Pressable>

        {/* Lock button */}
        <Pressable
          style={[styles.miniBtn, locked && styles.miniBtnActive]}
          onPress={() => setLocked(!locked)}
        >
          <Ionicons name={locked ? "lock-closed" : "lock-open-outline"} size={16} color={locked ? "#fff" : "#1a5c2e"} />
        </Pressable>
      </View>

      {/* Ayah range row */}
      <View style={styles.rangeBar}>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeLabel}>{t("from", lang)}</Text>
          <Pressable style={styles.rangeBtn} onPress={() => setAyaFrom(Math.max(1, ayaFrom - 1))}>
            <Text style={styles.rangeBtnText}>-</Text>
          </Pressable>
          <Text style={styles.rangeValue}>{ayaFrom}</Text>
          <Pressable style={styles.rangeBtn} onPress={() => setAyaFrom(Math.min(startAyahCount, ayaFrom + 1))}>
            <Text style={styles.rangeBtnText}>+</Text>
          </Pressable>

          <Text style={[styles.rangeLabel, { marginStart: 8 }]}>{t("to", lang)}</Text>
          {isOpenEnded ? (
            <Pressable style={[styles.openEndedChip, styles.openEndedChipActive]} onPress={() => setIsOpenEnded(false)}>
              <Text style={styles.openEndedText}>مفتوحة</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.rangeBtn} onPress={() => setAyaTo((v) => (v <= 1 ? 0 : Math.max(1, v - 1)))}>
                <Text style={styles.rangeBtnText}>-</Text>
              </Pressable>
              <Text style={styles.rangeValue}>{ayaTo > 0 ? ayaTo : endAyahCount}</Text>
              <Pressable style={styles.rangeBtn} onPress={() => setAyaTo((v) => Math.min(v === 0 ? endAyahCount : v + 1, endAyahCount))}>
                <Text style={styles.rangeBtnText}>+</Text>
              </Pressable>
              <Pressable style={styles.openEndedChip} onPress={() => setIsOpenEnded(true)}>
                <Text style={[styles.openEndedText, { color: "#1a5c2e" }]}>∞</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Ayah text preview */}
        {fromPreview ? (
          <Text style={styles.previewText} numberOfLines={1}>
            {ayaFrom}: {fromPreview}...
          </Text>
        ) : null}
        {toPreview ? (
          <Text style={styles.previewText} numberOfLines={1}>
            {ayaTo}: {toPreview}...
          </Text>
        ) : null}
      </View>

      {/* SURA DROPDOWN */}
      {showSuraPicker && (
        <ScrollView style={styles.suraDropdown} contentContainerStyle={styles.suraDropdownContent}>
          {suwarList
            .filter((s) => showSuraPicker === "end" ? s.value >= startSura : true)
            .map((s) => {
              const isActive = showSuraPicker === "start" ? startSura === s.value : endSura === s.value;
              return (
                <Pressable
                  key={s.value}
                  style={[styles.suraDropdownItem, isActive && styles.suraDropdownItemActive]}
                  onPress={() => showSuraPicker === "start" ? handleStartSuraSelect(s.value) : handleEndSuraSelect(s.value)}
                >
                  <Text style={[styles.suraDropdownText, isActive && styles.suraDropdownTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
        </ScrollView>
      )}

      {/* SETTINGS BAR */}
      <View style={styles.settingsBar}>
        <View style={styles.fontSizeControls}>
          <Pressable onPress={() => setFontSize((s) => Math.max(s - FONT_STEP, MIN_FONT_SIZE))} style={styles.fontBtn}>
            <Ionicons name="remove" size={18} color="#1a5c2e" />
          </Pressable>
          <Text style={styles.fontSizeLabel}>{fontSize}</Text>
          <Pressable onPress={() => setFontSize((s) => Math.min(s + FONT_STEP, MAX_FONT_SIZE))} style={styles.fontBtn}>
            <Ionicons name="add" size={18} color="#1a5c2e" />
          </Pressable>
        </View>
        <Pressable style={styles.fontPickerBtn} onPress={() => setShowFontPicker(!showFontPicker)}>
          <Text style={styles.fontPickerText}>
            {FONT_OPTIONS.find((f) => f.id === fontFamily)?.label ?? fontFamily}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#1a5c2e" />
        </Pressable>
        <View style={styles.colorThemes}>
          {COLOR_THEMES.map((ct) => (
            <Pressable
              key={ct.id}
              style={[styles.colorCircle, { backgroundColor: ct.backgroundColor, borderColor: ct.textColor }, colorTheme.id === ct.id && styles.colorCircleActive]}
              onPress={() => setColorTheme(ct)}
            >
              <View style={[styles.colorInner, { backgroundColor: ct.textColor }]} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* FONT DROPDOWN */}
      {showFontPicker && (
        <View style={styles.fontDropdown}>
          {FONT_OPTIONS.map((f) => (
            <Pressable
              key={f.id}
              style={[styles.fontDropdownItem, fontFamily === f.id && styles.fontDropdownItemActive]}
              onPress={() => { setFontFamily(f.id); setShowFontPicker(false); }}
            >
              <Text style={[styles.fontDropdownText, fontFamily === f.id && styles.fontDropdownTextActive, { fontFamily: f.id }]}>
                {f.label} - بِسْمِ ٱللَّهِ
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* QURAN TEXT (with lock overlay) */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.textContainer}
          contentContainerStyle={styles.textContent}
          scrollEnabled={!locked}
        >
          {verses.map((v, i) => {
            const showSuraHeader = suraBreaks.has(i);
            return (
              <React.Fragment key={`${v.sura}_${v.aya}`}>
                {showSuraHeader && (
                  <>
                    <Text style={[styles.suraHeader, { color: colorTheme.textColor, fontFamily }]}>
                      سورة {v.suraName}
                    </Text>
                    {v.sura !== 9 && v.aya === 1 && (
                      <Text style={[styles.basmala, { color: colorTheme.textColor, fontFamily, fontSize: fontSize - 4 }]}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </Text>
                    )}
                  </>
                )}
                <Text
                  style={[styles.verseText, { color: colorTheme.textColor, fontFamily, fontSize, lineHeight: fontSize * 2 }]}
                >
                  {v.text}
                </Text>
              </React.Fragment>
            );
          })}

          {/* Free continuation button — shown when not in open-ended mode */}
          {!isOpenEnded && !freeContinuation && verses.length > 0 && (
            <Pressable
              style={styles.freeContinueBtn}
              onPress={() => setFreeContinuation(true)}
            >
              <Text style={styles.freeContinueBtnText}>متابعة حرة</Text>
              <Ionicons name="arrow-down" size={18} color="#fff" />
            </Pressable>
          )}
        </ScrollView>

        {/* Lock overlay — blocks touches on content but not on unlock button */}
        {locked && (
          <View style={styles.lockOverlay} pointerEvents="box-only" />
        )}
      </View>

      {/* Floating unlock button — always accessible */}
      {locked && (
        <Pressable style={styles.unlockBtn} onPress={() => setLocked(false)}>
          <Ionicons name="lock-open" size={20} color="#fff" />
        </Pressable>
      )}

      {/* BOTTOM NAV */}
      <View style={styles.bottomBar}>
        <Pressable onPress={handleNextSura} style={[styles.navBtn, startSura >= 114 && styles.navBtnDisabled]} disabled={startSura >= 114}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={styles.navBtnText}>{startSura < 114 ? getSuraName(startSura + 1) : ""}</Text>
        </Pressable>
        <Text style={styles.bottomSuraName}>{getSuraName(startSura)}</Text>
        <Pressable onPress={handlePrevSura} style={[styles.navBtn, startSura <= 1 && styles.navBtnDisabled]} disabled={startSura <= 1}>
          <Text style={styles.navBtnText}>{startSura > 1 ? getSuraName(startSura - 1) : ""}</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 8, paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd",
    flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", gap: 8,
  },
  backBtn: { padding: 4 },
  suraPicker: {
    flexDirection: "row-reverse", alignItems: "center", gap: 4,
    backgroundColor: "#e8f4ed", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  suraPickerText: { fontSize: 15, fontWeight: "600", color: "#1a5c2e" },
  miniBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#e8f4ed",
    alignItems: "center", justifyContent: "center",
  },
  miniBtnActive: {
    backgroundColor: "#1a5c2e",
  },
  rangeBar: {
    backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd",
  },
  rangeRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  rangeLabel: { fontSize: 12, color: "#666", marginHorizontal: 2 },
  rangeBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "#e8f4ed",
    alignItems: "center", justifyContent: "center",
  },
  rangeBtnText: { fontSize: 16, fontWeight: "700", color: "#1a5c2e" },
  rangeValue: { fontSize: 14, fontWeight: "600", color: "#333", minWidth: 24, textAlign: "center" },
  openEndedChip: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    backgroundColor: "#e8f4ed", marginStart: 4,
  },
  openEndedChipActive: {
    backgroundColor: "#1a5c2e",
  },
  openEndedText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  previewText: {
    fontSize: 12, color: "#999", marginTop: 4, textAlign: "right",
    writingDirection: "rtl",
  },
  suraDropdown: {
    position: "absolute", top: 90, left: 20, right: 20, maxHeight: 300,
    backgroundColor: "#fff", borderRadius: 8, zIndex: 100, elevation: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  suraDropdownContent: { padding: 4 },
  suraDropdownItem: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f0f0f0",
  },
  suraDropdownItemActive: { backgroundColor: "#e8f4ed" },
  suraDropdownText: { fontSize: 16, color: "#333", textAlign: "right" },
  suraDropdownTextActive: { fontWeight: "700", color: "#1a5c2e" },
  settingsBar: {
    backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row-reverse", alignItems: "center", gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd",
  },
  fontSizeControls: { flexDirection: "row", alignItems: "center", gap: 4 },
  fontBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#e8f4ed",
    alignItems: "center", justifyContent: "center",
  },
  fontSizeLabel: { fontSize: 13, fontWeight: "600", color: "#333", minWidth: 24, textAlign: "center" },
  fontPickerBtn: {
    flexDirection: "row-reverse", alignItems: "center", gap: 4,
    backgroundColor: "#e8f4ed", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  fontPickerText: { fontSize: 13, color: "#1a5c2e", fontWeight: "600" },
  colorThemes: { flexDirection: "row", gap: 6, flex: 1, justifyContent: "flex-start", flexWrap: "wrap" },
  colorCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  colorCircleActive: { borderWidth: 2 },
  colorInner: { width: 8, height: 8, borderRadius: 4 },
  fontDropdown: {
    backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd", paddingHorizontal: 12, paddingVertical: 4,
  },
  fontDropdownItem: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f0f0f0",
  },
  fontDropdownItemActive: { backgroundColor: "#e8f4ed" },
  fontDropdownText: { fontSize: 18, color: "#333", textAlign: "right" },
  fontDropdownTextActive: { fontWeight: "700", color: "#1a5c2e" },
  textContainer: { flex: 1 },
  textContent: { padding: 20, paddingBottom: 80 },
  suraHeader: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 12, marginTop: 16 },
  basmala: { textAlign: "center", marginBottom: 16, opacity: 0.85 },
  verseText: { textAlign: "right", writingDirection: "rtl", marginBottom: 4 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  unlockBtn: {
    position: "absolute", bottom: 80, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(26, 92, 46, 0.85)",
    alignItems: "center", justifyContent: "center",
    elevation: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  freeContinueBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 24, paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: "#1a5c2e", borderRadius: 24, alignSelf: "center",
  },
  freeContinueBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  bottomBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1a5c2e", paddingHorizontal: 12, paddingVertical: 10,
  },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  bottomSuraName: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
