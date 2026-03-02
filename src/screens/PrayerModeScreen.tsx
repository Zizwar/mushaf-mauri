import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
  Dimensions,
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

// ==================== CONSTANTS ====================

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const SCROLL_INTERVAL = 150; // ms between scroll updates

const SPEED_PROFILES = [
  { key: "fajr_prayer", speed: 0.5, icon: "sunny-outline" as const },
  { key: "taraweeh", speed: 1.0, icon: "moon-outline" as const },
  { key: "qiyam_layl", speed: 0.7, icon: "cloudy-night-outline" as const },
];

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

interface Verse {
  sura: number;
  aya: number;
  text: string;
  suraName: string;
}

interface SuraGroup {
  sura: number;
  suraName: string;
  verses: Verse[];
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

  // ── Speed state ────────────────────────────────────────
  const [speed, setSpeed] = useState(1.0);

  // ── Reading state ────────────────────────────────────
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadedUpToSura, setLoadedUpToSura] = useState(0);
  const [locked, setLocked] = useState(false);
  const [freeContinuation, setFreeContinuation] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // ── Auto-scroll state ──────────────────────────────────
  const [isScrolling, setIsScrolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // ── Ayah previews ────────────────────────────────────
  const [fromPreview, setFromPreview] = useState("");
  const [toPreview, setToPreview] = useState("");

  // ── Sura picker state ────────────────────────────────
  const [showSuraPicker, setShowSuraPicker] = useState<"start" | "end" | null>(null);

  // ── Saved state ──────────────────────────────────────
  const [hasSavedState, setHasSavedState] = useState(false);
  const [lastReadingSura, setLastReadingSura] = useState(0);
  const [lastReadingAya, setLastReadingAya] = useState(0);

  // ── Refs ──────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(speed);
  const isPausedRef = useRef(false);
  const isScrollingRef = useRef(false);
  const lastTapRef = useRef(0);
  const totalContentHeightRef = useRef(0);
  const loadingRef = useRef(false);

  // ── Derived data ──────────────────────────────────────
  const suwarList = useMemo(() => allSuwar(), []);
  const startAyahCount = useMemo(() => getAyahCount(startSura), [startSura]);
  const endAyahCount = useMemo(() => getAyahCount(endSura), [endSura]);

  // ── Keep refs synced ────────────────────────────────────
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isScrollingRef.current = isScrolling; }, [isScrolling]);

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
      if (saved.speed) setSpeed(saved.speed);
      if (saved.lastReadingSura) setLastReadingSura(saved.lastReadingSura);
      if (saved.lastReadingAya) setLastReadingAya(saved.lastReadingAya);
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

  // ── Auto-hide controls after 5s ─────────────────────────
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  // ── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

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
        speed,
      },
    });
  }, [startSura, startAya, endSura, endAya, isOpenEnded, fontSize, fontFamily, colorTheme.id, speed]);

  // ── Auto-scroll engine ─────────────────────────────────
  const startAutoScroll = useCallback(() => {
    isScrollingRef.current = true;
    setIsScrolling(true);
    setIsPaused(false);
    isPausedRef.current = false;

    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

    scrollIntervalRef.current = setInterval(() => {
      if (!isScrollingRef.current) {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        return;
      }
      if (isPausedRef.current) return;

      const pxPerInterval = 0.03 * speedRef.current * SCROLL_INTERVAL;
      scrollYRef.current += pxPerInterval;

      const maxScroll = Math.max(0, totalContentHeightRef.current - SCREEN_HEIGHT);
      if (scrollYRef.current >= maxScroll) {
        scrollYRef.current = maxScroll;
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        isScrollingRef.current = false;
        setIsScrolling(false);
        setIsPaused(true);
        return;
      }

      scrollViewRef.current?.scrollTo({ y: scrollYRef.current, animated: true });
    }, SCROLL_INTERVAL);
  }, []);

  const stopAutoScroll = useCallback(() => {
    isScrollingRef.current = false;
    setIsScrolling(false);
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
  }, []);

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

    if (nextSura >= limit) {
      setAllLoaded(true);
    }
  }, [loadedUpToSura, endSura, endAya, freeContinuation, isOpenEnded, quira]);

  // ── Group verses by sura for inline rendering ──────────
  const suraGroups: SuraGroup[] = useMemo(() => {
    const groups: SuraGroup[] = [];
    let current: SuraGroup | null = null;

    for (const v of verses) {
      if (!current || current.sura !== v.sura) {
        current = { sura: v.sura, suraName: v.suraName, verses: [] };
        groups.push(current);
      }
      current.verses.push(v);
    }
    return groups;
  }, [verses]);

  // ── ScrollView lazy loading handlers ───────────────────
  const viewportHeightRef = useRef(SCREEN_HEIGHT);

  const handleScroll = useCallback(
    (e: any) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      viewportHeightRef.current = e.nativeEvent.layoutMeasurement.height;

      // Lazy load when near bottom
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      if (
        contentOffset.y + layoutMeasurement.height > contentSize.height - 500 &&
        !allLoaded &&
        !isLoadingMore
      ) {
        loadNextSura();
      }
    },
    [allLoaded, isLoadingMore, loadNextSura]
  );

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    totalContentHeightRef.current = h;
  }, []);

  // ── Start reading ──────────────────────────────────────
  const handleStartReading = useCallback(async () => {
    await loadInitialVerses();
    setMode("reading");
    setShowControls(false);
    setLocked(false);
    setFreeContinuation(false);
    setIsPaused(false);
    scrollYRef.current = 0;
    savePrayerState();

    // Start auto-scroll after a short delay
    setTimeout(() => { startAutoScroll(); }, 500);
  }, [loadInitialVerses, savePrayerState, startAutoScroll]);

  // ── Resume from last reading position ────────────────
  const handleResumeFromLastPosition = useCallback(async () => {
    if (lastReadingSura > 0) {
      // Load from the saved sura/aya position
      setStartSura(lastReadingSura);
      setStartAya(lastReadingAya || 1);

      const count = getAyahCount(lastReadingSura);
      const from = lastReadingAya || 1;
      const to =
        lastReadingSura === endSura && !isOpenEnded
          ? Math.min(endAya, count)
          : count;

      const newVerses = await getSuraVerses(lastReadingSura, from, to, quira);
      const name = getSuraName(lastReadingSura);
      const mapped: Verse[] = newVerses.map((v) => ({
        sura: lastReadingSura,
        aya: v.aya,
        text: v.text,
        suraName: name,
      }));

      setVerses(mapped);
      setLoadedUpToSura(lastReadingSura);
      if (lastReadingSura === endSura && !isOpenEnded) {
        setAllLoaded(true);
      } else {
        setAllLoaded(false);
      }
    } else {
      await loadInitialVerses();
    }
    setMode("reading");
    setShowControls(false);
    setLocked(false);
    setFreeContinuation(false);
    setIsPaused(false);
    scrollYRef.current = 0;

    setTimeout(() => { startAutoScroll(); }, 500);
  }, [lastReadingSura, lastReadingAya, endSura, endAya, isOpenEnded, quira, loadInitialVerses, startAutoScroll]);

  // ── Save reading position on exit ─────────────────────
  const saveReadingPosition = useCallback(() => {
    // Estimate which sura/aya the user is at based on verses array
    // Use loadedUpToSura and approximate position
    const lastVerse = verses[verses.length - 1];
    if (lastVerse) {
      // Find approximate first visible verse based on scroll ratio
      const ratio = totalContentHeightRef.current > 0
        ? scrollYRef.current / totalContentHeightRef.current
        : 0;
      const approxIndex = Math.min(
        Math.floor(ratio * verses.length),
        verses.length - 1
      );
      const currentVerse = verses[Math.max(0, approxIndex)];
      if (currentVerse) {
        setLastReadingSura(currentVerse.sura);
        setLastReadingAya(currentVerse.aya);
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
            speed,
            lastReadingSura: currentVerse.sura,
            lastReadingAya: currentVerse.aya,
          },
        });
      }
    }
  }, [verses, startSura, startAya, endSura, endAya, isOpenEnded, fontSize, fontFamily, colorTheme.id, speed]);

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
              saveReadingPosition();
              stopAutoScroll();
              StatusBar.setHidden(false);
              setMode("setup");
            },
          },
        ]
      );
    } else {
      onGoBack();
    }
  }, [mode, lang, onGoBack, stopAutoScroll, saveReadingPosition]);

  // ── Tap handler: single=pause, double=controls ─────────
  const handleScreenTap = useCallback(() => {
    if (locked) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap → toggle controls overlay
      setShowControls((prev) => !prev);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          // Single tap → pause/resume
          togglePause();
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [locked, togglePause]);

  // ── Free continuation: load beyond original range ──────
  const handleFreeContinuation = useCallback(() => {
    setFreeContinuation(true);
    setAllLoaded(false);
  }, []);

  // ── Sura navigation from toolbar ───────────────────────
  const handleToolbarPrevSura = useCallback(() => {
    if (loadedUpToSura < 114) {
      const nextSura = loadedUpToSura + 1;
      setStartSura(nextSura);
      setStartAya(1);
      setEndSura(nextSura);
      setEndAya(getAyahCount(nextSura));
      setIsOpenEnded(false);
      setFreeContinuation(false);
      setAllLoaded(false);
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
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        scrollYRef.current = 0;
      })();
    }
  }, [loadedUpToSura, quira]);

  const handleToolbarNextSura = useCallback(() => {
    if (startSura > 1) {
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
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        scrollYRef.current = 0;
      })();
    }
  }, [startSura, quira]);

  // ── Lock handlers ───────────────────────────────────────
  const handleLockPress = useCallback(() => {
    setLocked(true);
    setShowControls(false);
  }, []);

  const handleUnlock = useCallback(() => {
    setLocked(false);
  }, []);

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

  // ── Speed slider renderer ──────────────────────────────
  const renderSpeedSlider = (
    currentSpeed: number,
    onSpeedChange: (s: number) => void,
    compact: boolean = false
  ) => {
    const sliderW = compact ? SCREEN_WIDTH - 120 : SCREEN_WIDTH - 80;
    const thumbLeft = ((currentSpeed - 0.1) / (3.0 - 0.1)) * sliderW;

    return (
      <View style={[styles.sliderContainer, compact && { paddingHorizontal: 8 }]}>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabelText, { color: compact ? "#aaa" : "#999" }]}>
            {t("slow", lang)}
          </Text>
          <Text style={[styles.sliderLabelValue, { color: compact ? "#fff" : "#1a5c2e" }]}>
            {currentSpeed.toFixed(1)}x
          </Text>
          <Text style={[styles.sliderLabelText, { color: compact ? "#aaa" : "#999" }]}>
            {t("fast", lang)}
          </Text>
        </View>
        <View style={[styles.sliderTrack, { width: sliderW }]}>
          <View style={[styles.sliderFill, { width: thumbLeft, backgroundColor: compact ? "#fff" : "#1a5c2e" }]} />
          <View style={[styles.sliderThumb, { left: Math.max(0, Math.min(thumbLeft - 12, sliderW - 24)), backgroundColor: compact ? "#fff" : "#1a5c2e" }]} />
        </View>
        <Pressable
          style={[styles.sliderTouchArea, { width: sliderW }]}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const newSpeed = Math.round((0.1 + (x / sliderW) * (3.0 - 0.1)) * 10) / 10;
            onSpeedChange(Math.max(0.1, Math.min(3.0, newSpeed)));
          }}
        />
      </View>
    );
  };

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

          {/* Speed controls section */}
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>{t("scroll_speed", lang)}</Text>
            {renderSpeedSlider(speed, setSpeed)}
            <Text style={[styles.setupSubLabel, { marginTop: 14 }]}>
              {t("speed_profiles", lang)}
            </Text>
            <View style={styles.profileRow}>
              {SPEED_PROFILES.map((profile) => {
                const isActive = Math.abs(speed - profile.speed) < 0.05;
                return (
                  <Pressable
                    key={profile.key}
                    style={[
                      styles.profileBtn,
                      isActive && styles.profileBtnActive,
                    ]}
                    onPress={() => setSpeed(profile.speed)}
                  >
                    <Ionicons
                      name={profile.icon}
                      size={18}
                      color={isActive ? "#1a5c2e" : "#999"}
                    />
                    <Text
                      style={[
                        styles.profileLabel,
                        isActive && styles.profileLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {t(profile.key, lang)}
                    </Text>
                    <Text style={styles.profileSpeed}>{profile.speed}x</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.setupBottomBar}>
          {hasSavedState && lastReadingSura > 0 && (
            <Pressable
              style={styles.resumeBtn}
              onPress={handleResumeFromLastPosition}
            >
              <Ionicons name="play" size={18} color="#1a5c2e" />
              <Text style={styles.resumeBtnText}>
                {getSuraName(lastReadingSura)} - {t("aya_s", lang)} {lastReadingAya}
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

      {/* Main scrollable text area */}
      <Pressable style={{ flex: 1 }} onPress={handleScreenTap}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.readingContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEnabled={!locked}
        >
          {suraGroups.map((group) => (
            <View key={`sura_${group.sura}`}>
              {/* Sura header */}
              <Text
                style={[
                  styles.suraHeader,
                  { color: colorTheme.textColor, fontFamily },
                ]}
              >
                {"\u0633\u0648\u0631\u0629"} {group.suraName}
              </Text>

              {/* Inline flowing text — all verses in ONE <Text> (basmala is already in verse text) */}
              <Text
                style={[
                  styles.verseText,
                  {
                    color: colorTheme.textColor,
                    fontFamily,
                    fontSize,
                    lineHeight: fontSize * 2.2,
                  },
                ]}
              >
                {group.verses.map((v) => (
                  <React.Fragment key={`${v.sura}_${v.aya}`}>
                    {v.text}{" "}
                  </React.Fragment>
                ))}
              </Text>
            </View>
          ))}

          {/* Continuation button at end of loaded range */}
          {allLoaded && !isOpenEnded && !freeContinuation && verses.length > 0 && (
            <Pressable
              style={styles.freeContinueBtn}
              onPress={handleFreeContinuation}
            >
              <Text style={styles.freeContinueBtnText}>
                {t("free_continuation", lang)}
              </Text>
              <Ionicons name="arrow-down" size={18} color="#fff" />
            </Pressable>
          )}

          {/* Bottom spacer for auto-scroll clearance */}
          <View style={{ height: SCREEN_HEIGHT * 0.5 }} />
        </ScrollView>
      </Pressable>

      {/* Pause indicator */}
      {isPaused && !showControls && !locked && (
        <View style={styles.pauseIndicator} pointerEvents="none">
          <Ionicons name="pause-circle-outline" size={60} color="rgba(255,255,255,0.6)" />
          <Text style={styles.pauseText}>{t("tap_to_pause", lang)}</Text>
        </View>
      )}

      {/* Lock overlay — blocks all touches on content */}
      {locked && (
        <View style={styles.lockOverlay} pointerEvents="box-only" />
      )}

      {/* Floating unlock FAB — OUTSIDE overlay, always tappable */}
      {locked && (
        <Pressable
          style={styles.unlockFab}
          onPress={handleUnlock}
        >
          <Ionicons name="lock-open" size={20} color="#fff" />
        </Pressable>
      )}

      {/* Controls Overlay — toggled by double-tap */}
      {showControls && !locked && (
        <View style={styles.controlsOverlay}>
          {/* Top bar */}
          <SafeAreaView edges={["top"]} style={styles.controlsTopBar}>
            <Pressable onPress={handleGoBack} hitSlop={10} style={styles.controlBtn}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {getSuraName(startSura)}
              </Text>
            </View>

            <Pressable onPress={handleLockPress} hitSlop={10} style={styles.controlBtn}>
              <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            </Pressable>
          </SafeAreaView>

          {/* Bottom controls */}
          <SafeAreaView edges={["bottom"]} style={styles.controlsBottomBar}>
            {renderSpeedSlider(speed, setSpeed, true)}

            {/* Font size in controls */}
            <View style={styles.controlFontRow}>
              <Pressable
                style={styles.controlFontBtn}
                onPress={() => setFontSize((s) => Math.max(s - FONT_STEP, MIN_FONT_SIZE))}
              >
                <Text style={styles.controlFontBtnText}>A-</Text>
              </Pressable>
              <Text style={styles.controlFontSizeText}>{fontSize}</Text>
              <Pressable
                style={styles.controlFontBtn}
                onPress={() => setFontSize((s) => Math.min(s + FONT_STEP, MAX_FONT_SIZE))}
              >
                <Text style={styles.controlFontBtnText}>A+</Text>
              </Pressable>
            </View>

            {/* Action buttons */}
            <View style={styles.controlActions}>
              <Pressable
                style={[styles.controlActionBtn, { backgroundColor: "#1a5c2e" }]}
                onPress={togglePause}
              >
                <Ionicons name={isPaused ? "play" : "pause"} size={22} color="#fff" />
                <Text style={styles.controlActionText}>
                  {isPaused ? t("resume_scrolling", lang) : t("pause_scrolling", lang)}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlActionBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                onPress={handleLockPress}
              >
                <Ionicons name="lock-closed" size={20} color="#fff" />
                <Text style={styles.controlActionText}>
                  {t("lock_screen_mode", lang)}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
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
  setupSubLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
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

  // ── Speed controls (setup) ────────────────────────────
  sliderContainer: {
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  sliderLabelValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  sliderTrack: {
    height: 6,
    backgroundColor: "rgba(128,128,128,0.2)",
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sliderTouchArea: {
    position: "absolute",
    top: 20,
    height: 36,
    left: 4,
  },
  profileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  profileBtn: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "transparent",
    minWidth: 72,
    gap: 4,
  },
  profileBtnActive: {
    borderColor: "#1a5c2e",
    backgroundColor: "#e8f4ed",
  },
  profileLabel: {
    fontSize: 11,
    textAlign: "center",
    color: "#333",
  },
  profileLabelActive: {
    color: "#1a5c2e",
    fontWeight: "700",
  },
  profileSpeed: {
    fontSize: 10,
    color: "#999",
  },

  // ── Reading mode ─────────────────────────────────────
  readingContainer: {
    flex: 1,
  },
  readingContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  suraHeader: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 16,
  },
  verseText: {
    textAlign: "right",
    writingDirection: "rtl",
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

  // ── Pause indicator ────────────────────────────────────
  pauseIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  pauseText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 8,
  },

  // ── Lock mode ─────────────────────────────────────────
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

  // ── Controls overlay ──────────────────────────────────
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "space-between",
  },
  controlsTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  controlBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pageIndicator: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  pageIndicatorText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  controlsBottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  controlFontRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  controlFontBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlFontBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  controlFontSizeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  controlActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  controlActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  controlActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
