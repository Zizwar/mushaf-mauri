import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
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
import { loadSettings, saveSettings } from "../utils/settings";
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

// ==================== TYPES ====================

type ScreenMode = "setup" | "reading";

type ListItem =
  | { type: "suraHeader"; sura: number; suraName: string; key: string }
  | { type: "basmala"; sura: number; key: string }
  | { type: "verse"; sura: number; aya: number; text: string; key: string }
  | { type: "continuation"; key: string };

interface Verse {
  sura: number;
  aya: number;
  text: string;
  suraName: string;
}

interface Props {
  onGoBack: () => void;
}

// ==================== COMPONENT ====================

export default function PrayerModeScreen({ onGoBack }: Props) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);

  // ── Mode ─────────────────────────────────────────────
  const [mode, setMode] = useState<ScreenMode>("setup");

  // ── Setup state ──────────────────────────────────────
  const [startSura, setStartSura] = useState(1);
  const [startAya, setStartAya] = useState(1);
  const [endSura, setEndSura] = useState(1);
  const [endAya, setEndAya] = useState(7);
  const [isOpenEnded, setIsOpenEnded] = useState(false);

  // ── Display settings ─────────────────────────────────
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Maghribi");
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0]);

  // ── Reading state ────────────────────────────────────
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadedUpToSura, setLoadedUpToSura] = useState(0);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [freeContinuation, setFreeContinuation] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // ── Ayah previews ────────────────────────────────────
  const [fromPreview, setFromPreview] = useState("");
  const [toPreview, setToPreview] = useState("");

  // ── Sura picker state ────────────────────────────────
  const [showSuraPicker, setShowSuraPicker] = useState<"start" | "end" | null>(null);

  // ── Saved state ──────────────────────────────────────
  const [hasSavedState, setHasSavedState] = useState(false);

  // ── Refs ──────────────────────────────────────────────
  const flatListRef = useRef<FlatList>(null);
  const toolbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(false);

  // ── Derived data ──────────────────────────────────────
  const suwarList = useMemo(() => allSuwar(), []);
  const startAyahCount = useMemo(() => getAyahCount(startSura), [startSura]);
  const endAyahCount = useMemo(() => getAyahCount(endSura), [endSura]);

  // ── Load saved state on mount ─────────────────────────
  useEffect(() => {
    const saved = loadSettings().prayerModeState;
    if (saved) {
      setHasSavedState(true);
      setStartSura(saved.startSura);
      setStartAya(saved.startAya);
      setEndSura(saved.endSura);
      setEndAya(saved.endAya);
      setIsOpenEnded(saved.isOpenEnded);
      setFontSize(saved.fontSize);
      setFontFamily(saved.fontFamily);
      const theme = COLOR_THEMES.find((ct) => ct.id === saved.colorThemeId);
      if (theme) setColorTheme(theme);
    }
  }, []);

  // ── Ayah previews ─────────────────────────────────────
  useEffect(() => {
    getAyahText(startSura, startAya, quira).then((text) => {
      setFromPreview(text ? text.substring(0, 60) : "");
    });
  }, [startSura, startAya, quira]);

  useEffect(() => {
    if (!isOpenEnded) {
      getAyahText(endSura, endAya, quira).then((text) => {
        setToPreview(text ? text.substring(0, 60) : "");
      });
    } else {
      setToPreview("");
    }
  }, [endSura, endAya, isOpenEnded, quira]);

  // ── Keep-awake + StatusBar in reading mode ─────────────
  useEffect(() => {
    if (mode === "reading") {
      StatusBar.setHidden(true);
      activateKeepAwakeAsync("prayer_mode").catch(() => {});
    }
    return () => {
      StatusBar.setHidden(false);
      deactivateKeepAwake("prayer_mode");
    };
  }, [mode]);

  // ── Android back button ────────────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mode === "reading") {
        handleGoBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [mode]);

  // ── Auto-hide toolbar after 5s ─────────────────────────
  useEffect(() => {
    if (toolbarVisible) {
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
      toolbarTimerRef.current = setTimeout(() => {
        setToolbarVisible(false);
      }, 5000);
    }
    return () => {
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
    };
  }, [toolbarVisible]);

  // ── Save state periodically ────────────────────────────
  const savePrayerState = useCallback(() => {
    saveSettings({
      prayerModeState: {
        startSura,
        startAya,
        endSura,
        endAya,
        isOpenEnded,
        fontSize,
        fontFamily,
        colorThemeId: colorTheme.id,
      },
    });
  }, [startSura, startAya, endSura, endAya, isOpenEnded, fontSize, fontFamily, colorTheme.id]);

  // ── Load initial sura on entering reading mode ─────────
  const loadInitialVerses = useCallback(async () => {
    const count = getAyahCount(startSura);
    const from = startAya;
    const to =
      startSura === endSura && !isOpenEnded
        ? Math.min(endAya, count)
        : count;

    const newVerses = await getSuraVerses(startSura, from, to, quira);
    const name = getSuraName(startSura);
    const mapped: Verse[] = newVerses.map((v) => ({
      sura: startSura,
      aya: v.aya,
      text: v.text,
      suraName: name,
    }));

    setVerses(mapped);
    setLoadedUpToSura(startSura);

    // If single sura and not open-ended, we're done
    if (startSura === endSura && !isOpenEnded) {
      setAllLoaded(true);
    } else {
      setAllLoaded(false);
    }
  }, [startSura, startAya, endSura, endAya, isOpenEnded, quira]);

  // ── Lazy-load next sura ────────────────────────────────
  const loadNextSura = useCallback(async () => {
    if (loadingRef.current) return;
    const nextSura = loadedUpToSura + 1;
    const limit = freeContinuation || isOpenEnded ? 114 : endSura;
    if (nextSura > limit) {
      setAllLoaded(true);
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);

    const count = getAyahCount(nextSura);
    const from = 1;
    const to =
      nextSura === endSura && !freeContinuation && !isOpenEnded
        ? Math.min(endAya, count)
        : count;

    const newVerses = await getSuraVerses(nextSura, from, to, quira);
    const name = getSuraName(nextSura);
    const mapped: Verse[] = newVerses.map((v) => ({
      sura: nextSura,
      aya: v.aya,
      text: v.text,
      suraName: name,
    }));

    setVerses((prev) => [...prev, ...mapped]);
    setLoadedUpToSura(nextSura);
    setIsLoadingMore(false);
    loadingRef.current = false;

    // Check if this was the last sura
    if (nextSura >= limit) {
      setAllLoaded(true);
    }
  }, [loadedUpToSura, endSura, endAya, freeContinuation, isOpenEnded, quira]);

  // ── Transform verses into FlatList items ───────────────
  const listItems: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    let lastSura = -1;

    for (const v of verses) {
      if (v.sura !== lastSura) {
        items.push({
          type: "suraHeader",
          sura: v.sura,
          suraName: v.suraName,
          key: `header_${v.sura}`,
        });
        if (v.sura !== 9 && v.aya === 1) {
          items.push({
            type: "basmala",
            sura: v.sura,
            key: `basmala_${v.sura}`,
          });
        }
        lastSura = v.sura;
      }
      items.push({
        type: "verse",
        sura: v.sura,
        aya: v.aya,
        text: v.text,
        key: `v_${v.sura}_${v.aya}`,
      });
    }

    // Show continuation button at end of loaded range
    if (allLoaded && !isOpenEnded && !freeContinuation && verses.length > 0) {
      items.push({ type: "continuation", key: "continuation" });
    }

    return items;
  }, [verses, allLoaded, isOpenEnded, freeContinuation]);

  // ── Start reading ──────────────────────────────────────
  const handleStartReading = useCallback(async () => {
    await loadInitialVerses();
    setMode("reading");
    setToolbarVisible(false);
    setLocked(false);
    setFreeContinuation(false);
    savePrayerState();
  }, [loadInitialVerses, savePrayerState]);

  // ── Resume reading ─────────────────────────────────────
  const handleResume = useCallback(async () => {
    await loadInitialVerses();
    setMode("reading");
    setToolbarVisible(false);
    setLocked(false);
    setFreeContinuation(false);
  }, [loadInitialVerses]);

  // ── Exit reading with confirmation ─────────────────────
  const handleGoBack = useCallback(() => {
    if (mode === "reading") {
      Alert.alert(
        t("prayer_mode", lang),
        t("exit_prayer_reading", lang),
        [
          { text: t("cancel", lang), style: "cancel" },
          {
            text: t("yes", lang),
            onPress: () => {
              StatusBar.setHidden(false);
              setMode("setup");
            },
          },
        ]
      );
    } else {
      onGoBack();
    }
  }, [mode, lang, onGoBack]);

  // ── Toggle toolbar on tap ──────────────────────────────
  const handleContentTap = useCallback(() => {
    if (locked) return;
    setToolbarVisible((v) => !v);
  }, [locked]);

  // ── Free continuation: load beyond original range ──────
  const handleFreeContinuation = useCallback(() => {
    setFreeContinuation(true);
    setAllLoaded(false);
  }, []);

  // ── Sura navigation from toolbar ───────────────────────
  const handleToolbarPrevSura = useCallback(() => {
    if (loadedUpToSura < 114) {
      // Navigate forward to next sura
      const nextSura = loadedUpToSura + 1;
      setStartSura(nextSura);
      setStartAya(1);
      setEndSura(nextSura);
      setEndAya(getAyahCount(nextSura));
      setIsOpenEnded(false);
      setFreeContinuation(false);
      setAllLoaded(false);
      // Reload
      (async () => {
        const count = getAyahCount(nextSura);
        const newVerses = await getSuraVerses(nextSura, 1, count, quira);
        const name = getSuraName(nextSura);
        const mapped: Verse[] = newVerses.map((v) => ({
          sura: nextSura,
          aya: v.aya,
          text: v.text,
          suraName: name,
        }));
        setVerses(mapped);
        setLoadedUpToSura(nextSura);
        setAllLoaded(true);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      })();
    }
  }, [loadedUpToSura, quira]);

  const handleToolbarNextSura = useCallback(() => {
    if (startSura > 1) {
      // Navigate backward to previous sura
      const prevSura = startSura - 1;
      setStartSura(prevSura);
      setStartAya(1);
      setEndSura(prevSura);
      setEndAya(getAyahCount(prevSura));
      setIsOpenEnded(false);
      setFreeContinuation(false);
      setAllLoaded(false);
      (async () => {
        const count = getAyahCount(prevSura);
        const newVerses = await getSuraVerses(prevSura, 1, count, quira);
        const name = getSuraName(prevSura);
        const mapped: Verse[] = newVerses.map((v) => ({
          sura: prevSura,
          aya: v.aya,
          text: v.text,
          suraName: name,
        }));
        setVerses(mapped);
        setLoadedUpToSura(prevSura);
        setAllLoaded(true);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      })();
    }
  }, [startSura, quira]);

  // ── Sura picker handlers ───────────────────────────────
  const handleStartSuraSelect = useCallback(
    (sura: number) => {
      setStartSura(sura);
      setStartAya(1);
      if (sura > endSura) {
        setEndSura(sura);
        setEndAya(getAyahCount(sura));
      }
      setShowSuraPicker(null);
      setFreeContinuation(false);
    },
    [endSura]
  );

  const handleEndSuraSelect = useCallback(
    (sura: number) => {
      if (sura < startSura) return;
      setEndSura(sura);
      setEndAya(getAyahCount(sura));
      setShowSuraPicker(null);
      setFreeContinuation(false);
    },
    [startSura]
  );

  // ── FlatList renderItem ────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case "suraHeader":
          return (
            <Text
              style={[
                styles.suraHeader,
                { color: colorTheme.textColor, fontFamily },
              ]}
            >
              {"\u0633\u0648\u0631\u0629"} {item.suraName}
            </Text>
          );
        case "basmala":
          return (
            <Text
              style={[
                styles.basmala,
                {
                  color: colorTheme.textColor,
                  fontFamily,
                  fontSize: fontSize - 4,
                },
              ]}
            >
              {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
            </Text>
          );
        case "verse":
          return (
            <Pressable onPress={handleContentTap}>
              <Text
                style={[
                  styles.verseText,
                  {
                    color: colorTheme.textColor,
                    fontFamily,
                    fontSize,
                    lineHeight: fontSize * 2,
                  },
                ]}
              >
                {item.text}
              </Text>
            </Pressable>
          );
        case "continuation":
          return (
            <Pressable
              style={styles.freeContinueBtn}
              onPress={handleFreeContinuation}
            >
              <Text style={styles.freeContinueBtnText}>
                {t("free_continuation", lang)}
              </Text>
              <Ionicons name="arrow-down" size={18} color="#fff" />
            </Pressable>
          );
      }
    },
    [
      colorTheme,
      fontFamily,
      fontSize,
      lang,
      handleContentTap,
      handleFreeContinuation,
    ]
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  // ── onEndReached for lazy loading ──────────────────────
  const handleEndReached = useCallback(() => {
    if (!allLoaded && !isLoadingMore) {
      loadNextSura();
    }
  }, [allLoaded, isLoadingMore, loadNextSura]);

  // =====================================================
  // SETUP MODE
  // =====================================================
  if (mode === "setup") {
    return (
      <SafeAreaView style={styles.setupContainer}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.setupHeader}>
          <Pressable onPress={onGoBack} style={styles.setupBackBtn}>
            <Ionicons name="arrow-forward" size={24} color="#1a5c2e" />
          </Pressable>
          <Text style={styles.setupTitle}>{t("prayer_mode", lang)}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.setupScroll}
          contentContainerStyle={styles.setupScrollContent}
        >
          {/* FROM: Sura + Aya */}
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>{t("from", lang)}</Text>
            <View style={styles.pickerRow}>
              <Pressable
                style={styles.suraChip}
                onPress={() =>
                  setShowSuraPicker(showSuraPicker === "start" ? null : "start")
                }
              >
                <Text style={styles.suraChipText}>
                  {getSuraName(startSura)}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#1a5c2e" />
              </Pressable>
              <View style={styles.ayaControls}>
                <Pressable
                  style={styles.ayaBtn}
                  onPress={() => setStartAya((a) => Math.max(1, a - 1))}
                >
                  <Ionicons name="remove" size={16} color="#1a5c2e" />
                </Pressable>
                <Text style={styles.ayaValue}>{startAya}</Text>
                <Pressable
                  style={styles.ayaBtn}
                  onPress={() =>
                    setStartAya((a) => Math.min(startAyahCount, a + 1))
                  }
                >
                  <Ionicons name="add" size={16} color="#1a5c2e" />
                </Pressable>
              </View>
            </View>
            {fromPreview ? (
              <Text style={styles.previewText} numberOfLines={1}>
                {fromPreview}...
              </Text>
            ) : null}
          </View>

          {/* TO: Sura + Aya */}
          <View style={styles.setupSection}>
            <View style={styles.toHeaderRow}>
              <Text style={styles.setupLabel}>{t("to", lang)}</Text>
              <Pressable
                style={[
                  styles.openEndedToggle,
                  isOpenEnded && styles.openEndedToggleActive,
                ]}
                onPress={() => setIsOpenEnded(!isOpenEnded)}
              >
                <Text
                  style={[
                    styles.openEndedToggleText,
                    isOpenEnded && styles.openEndedToggleTextActive,
                  ]}
                >
                  {t("open_ended", lang)} {"\u221E"}
                </Text>
              </Pressable>
            </View>
            {!isOpenEnded && (
              <>
                <View style={styles.pickerRow}>
                  <Pressable
                    style={styles.suraChip}
                    onPress={() =>
                      setShowSuraPicker(
                        showSuraPicker === "end" ? null : "end"
                      )
                    }
                  >
                    <Text style={styles.suraChipText}>
                      {getSuraName(endSura)}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#1a5c2e" />
                  </Pressable>
                  <View style={styles.ayaControls}>
                    <Pressable
                      style={styles.ayaBtn}
                      onPress={() => setEndAya((a) => Math.max(1, a - 1))}
                    >
                      <Ionicons name="remove" size={16} color="#1a5c2e" />
                    </Pressable>
                    <Text style={styles.ayaValue}>{endAya}</Text>
                    <Pressable
                      style={styles.ayaBtn}
                      onPress={() =>
                        setEndAya((a) => Math.min(endAyahCount, a + 1))
                      }
                    >
                      <Ionicons name="add" size={16} color="#1a5c2e" />
                    </Pressable>
                  </View>
                </View>
                {toPreview ? (
                  <Text style={styles.previewText} numberOfLines={1}>
                    {toPreview}...
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* Sura dropdown */}
          {showSuraPicker && (
            <View style={styles.suraDropdownContainer}>
              <ScrollView
                style={styles.suraDropdown}
                contentContainerStyle={styles.suraDropdownContent}
              >
                {suwarList
                  .filter((s) =>
                    showSuraPicker === "end" ? s.value >= startSura : true
                  )
                  .map((s) => {
                    const isActive =
                      showSuraPicker === "start"
                        ? startSura === s.value
                        : endSura === s.value;
                    return (
                      <Pressable
                        key={s.value}
                        style={[
                          styles.suraDropdownItem,
                          isActive && styles.suraDropdownItemActive,
                        ]}
                        onPress={() =>
                          showSuraPicker === "start"
                            ? handleStartSuraSelect(s.value)
                            : handleEndSuraSelect(s.value)
                        }
                      >
                        <Text
                          style={[
                            styles.suraDropdownText,
                            isActive && styles.suraDropdownTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </View>
          )}

          {/* Color theme selector */}
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>{t("color", lang)}</Text>
            <View style={styles.colorRow}>
              {COLOR_THEMES.map((ct) => (
                <Pressable
                  key={ct.id}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: ct.backgroundColor, borderColor: ct.textColor },
                    colorTheme.id === ct.id && styles.colorCircleActive,
                  ]}
                  onPress={() => setColorTheme(ct)}
                >
                  <View
                    style={[styles.colorInner, { backgroundColor: ct.textColor }]}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Font family + size */}
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>{t("font_selection", lang)}</Text>
            <View style={styles.fontRow}>
              {FONT_OPTIONS.map((f) => (
                <Pressable
                  key={f.id}
                  style={[
                    styles.fontChip,
                    fontFamily === f.id && styles.fontChipActive,
                  ]}
                  onPress={() => setFontFamily(f.id)}
                >
                  <Text
                    style={[
                      styles.fontChipText,
                      { fontFamily: f.id },
                      fontFamily === f.id && styles.fontChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.fontSizeRow}>
              <Pressable
                style={styles.ayaBtn}
                onPress={() =>
                  setFontSize((s) => Math.max(s - FONT_STEP, MIN_FONT_SIZE))
                }
              >
                <Ionicons name="remove" size={16} color="#1a5c2e" />
              </Pressable>
              <Text style={styles.fontSizeLabel}>{fontSize}</Text>
              <Pressable
                style={styles.ayaBtn}
                onPress={() =>
                  setFontSize((s) => Math.min(s + FONT_STEP, MAX_FONT_SIZE))
                }
              >
                <Ionicons name="add" size={16} color="#1a5c2e" />
              </Pressable>
            </View>
          </View>

          {/* Font preview */}
          <View
            style={[
              styles.fontPreview,
              { backgroundColor: colorTheme.backgroundColor },
            ]}
          >
            <Text
              style={{
                color: colorTheme.textColor,
                fontFamily,
                fontSize,
                textAlign: "center",
                lineHeight: fontSize * 2,
              }}
            >
              {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.setupBottomBar}>
          {hasSavedState && (
            <Pressable
              style={styles.resumeBtn}
              onPress={handleResume}
            >
              <Ionicons name="play" size={18} color="#1a5c2e" />
              <Text style={styles.resumeBtnText}>
                {t("resume_reading", lang)}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={styles.startBtn}
            onPress={handleStartReading}
          >
            <Text style={styles.startBtnText}>
              {t("start_reading", lang)}
            </Text>
            <Ionicons name="book" size={18} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // READING MODE
  // =====================================================
  return (
    <View style={[styles.readingContainer, { backgroundColor: colorTheme.backgroundColor }]}>
      <StatusBar hidden />

      {/* FlatList with verses */}
      <Pressable
        style={{ flex: 1 }}
        onPress={handleContentTap}
      >
        <FlatList
          ref={flatListRef}
          data={listItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.readingContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={20}
          windowSize={7}
        />
      </Pressable>

      {/* Lock overlay — blocks all touches on content */}
      {locked && (
        <View style={styles.lockOverlay} pointerEvents="box-only" />
      )}

      {/* Floating unlock FAB — OUTSIDE overlay, always tappable */}
      {locked && (
        <Pressable
          style={styles.unlockFab}
          onPress={() => setLocked(false)}
        >
          <Ionicons name="lock-open" size={20} color="#fff" />
        </Pressable>
      )}

      {/* Bottom toolbar — toggled by tap */}
      {toolbarVisible && !locked && (
        <View style={styles.toolbar}>
          {/* Back to setup */}
          <Pressable style={styles.toolbarBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>

          {/* Lock toggle */}
          <Pressable
            style={styles.toolbarBtn}
            onPress={() => {
              setLocked(true);
              setToolbarVisible(false);
            }}
          >
            <Ionicons name="lock-closed" size={20} color="#fff" />
          </Pressable>

          {/* Font size - */}
          <Pressable
            style={styles.toolbarBtn}
            onPress={() =>
              setFontSize((s) => Math.max(s - FONT_STEP, MIN_FONT_SIZE))
            }
          >
            <Ionicons name="remove-circle-outline" size={20} color="#fff" />
          </Pressable>

          {/* Font size + */}
          <Pressable
            style={styles.toolbarBtn}
            onPress={() =>
              setFontSize((s) => Math.min(s + FONT_STEP, MAX_FONT_SIZE))
            }
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
          </Pressable>

          {/* Prev sura (RTL: forward arrow = previous) */}
          <Pressable
            style={[styles.toolbarBtn, startSura >= 114 && { opacity: 0.3 }]}
            onPress={handleToolbarPrevSura}
            disabled={startSura >= 114}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>

          {/* Current sura name */}
          <Text style={styles.toolbarSuraName} numberOfLines={1}>
            {getSuraName(startSura)}
          </Text>

          {/* Next sura */}
          <Pressable
            style={[styles.toolbarBtn, startSura <= 1 && { opacity: 0.3 }]}
            onPress={handleToolbarNextSura}
            disabled={startSura <= 1}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  // ── Setup mode ──────────────────────────────────────
  setupContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  setupHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  setupBackBtn: {
    padding: 4,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a5c2e",
  },
  setupScroll: {
    flex: 1,
  },
  setupScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  setupSection: {
    marginBottom: 20,
  },
  setupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textAlign: "right",
    writingDirection: "rtl",
  },
  toHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  openEndedToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e8f4ed",
  },
  openEndedToggleActive: {
    backgroundColor: "#1a5c2e",
  },
  openEndedToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a5c2e",
  },
  openEndedToggleTextActive: {
    color: "#fff",
  },
  pickerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  suraChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f4ed",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
  },
  suraChipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a5c2e",
  },
  ayaControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ayaBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e8f4ed",
    alignItems: "center",
    justifyContent: "center",
  },
  ayaValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    minWidth: 28,
    textAlign: "center",
  },
  previewText: {
    fontSize: 13,
    color: "#999",
    marginTop: 6,
    textAlign: "right",
    writingDirection: "rtl",
  },
  suraDropdownContainer: {
    marginBottom: 16,
  },
  suraDropdown: {
    maxHeight: 250,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  suraDropdownContent: {
    padding: 4,
  },
  suraDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  suraDropdownItemActive: {
    backgroundColor: "#e8f4ed",
  },
  suraDropdownText: {
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },
  suraDropdownTextActive: {
    fontWeight: "700",
    color: "#1a5c2e",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircleActive: {
    borderWidth: 3,
  },
  colorInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fontRow: {
    flexDirection: "row-reverse",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  fontChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#e8f4ed",
  },
  fontChipActive: {
    backgroundColor: "#1a5c2e",
  },
  fontChipText: {
    fontSize: 15,
    color: "#1a5c2e",
  },
  fontChipTextActive: {
    color: "#fff",
  },
  fontSizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fontSizeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    minWidth: 32,
    textAlign: "center",
  },
  fontPreview: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  setupBottomBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  startBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a5c2e",
    paddingVertical: 14,
    borderRadius: 24,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  resumeBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: "#e8f4ed",
  },
  resumeBtnText: {
    color: "#1a5c2e",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Reading mode ─────────────────────────────────────
  readingContainer: {
    flex: 1,
  },
  readingContent: {
    padding: 20,
    paddingBottom: 80,
  },
  suraHeader: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 16,
  },
  basmala: {
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.85,
  },
  verseText: {
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  freeContinueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#1a5c2e",
    borderRadius: 24,
    alignSelf: "center",
  },
  freeContinueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  unlockFab: {
    position: "absolute",
    bottom: 30,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(26, 92, 46, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 20,
  },
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(26, 92, 46, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  toolbarBtn: {
    padding: 8,
  },
  toolbarSuraName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 80,
  },
});
