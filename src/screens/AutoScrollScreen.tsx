import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, type Quira } from "../store/useAppStore";
import { t } from "../i18n";
import {
  allSuwar,
  getAyahsForSura,
  getSuraName,
  getAyahCount,
} from "../utils/quranHelpers";
import { getSuraVerses } from "../utils/ayahText";
import { initWarshDB, getDebugLog, getWarshSuraText } from "../utils/warshAudioDB";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = "#1a5c2e";
const ACCENT_LIGHT = "#e8f5e9";
const ACCENT_DARK_BG = "#1a3a2e";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const RTL_LANGS = ["ar", "amz", "he"];

const SPEED_PROFILES = [
  { key: "fajr_prayer", speed: 0.5, icon: "sunny-outline" as const },
  { key: "taraweeh", speed: 1.0, icon: "moon-outline" as const },
  { key: "qiyam_layl", speed: 0.7, icon: "cloudy-night-outline" as const },
  { key: "fast_reading", speed: 2.0, icon: "flash-outline" as const },
];

// ---------------------------------------------------------------------------
// Color themes for text display
// ---------------------------------------------------------------------------
interface ColorTheme {
  id: string;
  label: string;
  textColor: string;
  backgroundColor: string;
}

const COLOR_THEMES: ColorTheme[] = [
  { id: "white_black", label: "أبيض/أسود", textColor: "#ffffff", backgroundColor: "#000000" },
  { id: "gold_green", label: "ذهبي/أخضر", textColor: "#ffd700", backgroundColor: "#1a3c2a" },
  { id: "blue_cream", label: "أزرق/كريمي", textColor: "#1a4a80", backgroundColor: "#fdf5e6" },
  { id: "white_blue", label: "أبيض/أزرق", textColor: "#ffffff", backgroundColor: "#1a2744" },
  { id: "black_white", label: "أسود/أبيض", textColor: "#000000", backgroundColor: "#ffffff" },
  { id: "amber_brown", label: "عنبري/بني", textColor: "#ffbf00", backgroundColor: "#3b2f2f" },
  { id: "green_gray", label: "أخضر/رمادي", textColor: "#90ee90", backgroundColor: "#2d2d2d" },
  { id: "pink_purple", label: "وردي/بنفسجي", textColor: "#ffb6c1", backgroundColor: "#2d1b3d" },
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AutoScrollScreenProps {
  onGoBack: () => void;
}

type ScreenMode = "setup" | "scrolling";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AutoScrollScreen({ onGoBack }: AutoScrollScreenProps) {
  // Store
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const storeQuira = useAppStore((s) => s.quira);

  // Theme
  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";
  const isRtl = RTL_LANGS.includes(lang);

  // ── Setup state ──────────────────────────────────────────
  const [mode, setMode] = useState<ScreenMode>("setup");
  const [startSura, setStartSura] = useState(1);
  const [startAya, setStartAya] = useState(1);
  const [endAya, setEndAya] = useState(7);
  const [speed, setSpeed] = useState(1.0);
  const [rakaaMinutes, setRakaaMinutes] = useState(0);

  // ── Text display settings ─────────────────────────────────
  const [quira, setQuira] = useState<Quira>(storeQuira);
  const [fontFamily, setFontFamily] = useState("Maghribi");
  const [fontSize, setFontSize] = useState(32);
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0]);
  const [showFontPicker, setShowFontPicker] = useState(false);

  // ── Scroll state ─────────────────────────────────────────
  const [isScrolling, setIsScrolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showBrightnessBanner, setShowBrightnessBanner] = useState(true);

  // ── Verses data ──────────────────────────────────────────
  const [verses, setVerses] = useState<{ aya: number; text: string }[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);

  // ── Debug state ──────────────────────────────────────────
  const [showDebug, setShowDebug] = useState(false);
  const [debugText, setDebugText] = useState("");

  // ── Refs ─────────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(speed);
  const isPausedRef = useRef(false);
  const isLockedRef = useRef(false);
  const isScrollingRef = useRef(false);
  const lastTapRef = useRef(0);
  const lockPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rakaaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalContentHeightRef = useRef(0);

  // ── Derived data ─────────────────────────────────────────
  const suwar = useMemo(() => allSuwar(), []);
  const startAyahs = useMemo(() => getAyahsForSura(startSura), [startSura]);
  const ayahCount = useMemo(() => getAyahCount(startSura), [startSura]);

  // Keep speedRef synced
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);
  useEffect(() => { isScrollingRef.current = isScrolling; }, [isScrolling]);

  // Load verses when entering scroll mode
  // ── Debug function ────────────────────────────────────────
  const runDebug = useCallback(async () => {
    const lines: string[] = [];
    lines.push("=== DB Debug ===");

    // Re-init DB
    try {
      await initWarshDB();
      lines.push("initWarshDB: OK");
    } catch (e: any) {
      lines.push(`initWarshDB ERROR: ${e.message}`);
    }

    // Get debug log from warshAudioDB
    const dbLog = getDebugLog();
    lines.push("--- DB Log ---");
    lines.push(...dbLog);

    // Test direct query
    lines.push("--- Direct Query Test ---");
    try {
      const result = await getWarshSuraText(1, 1, 3);
      lines.push(`getWarshSuraText(1,1,3): ${result.length} results`);
      result.forEach((v) => lines.push(`  aya ${v.aya}: ${v.text.substring(0, 50)}`));
    } catch (e: any) {
      lines.push(`Query ERROR: ${e.message}`);
    }

    // Test getSuraVerses (the function used by this screen)
    lines.push("--- getSuraVerses Test ---");
    try {
      const result2 = await getSuraVerses(1, 1, 7, "warsh");
      lines.push(`getSuraVerses(1,1,7,"warsh"): ${result2.length} results`);
      result2.forEach((v) => lines.push(`  aya ${v.aya}: ${v.text.substring(0, 50)}`));
    } catch (e: any) {
      lines.push(`getSuraVerses ERROR: ${e.message}`);
    }

    // Test Hafs too
    lines.push("--- Hafs Test ---");
    try {
      const result3 = await getSuraVerses(1, 1, 3, "madina");
      lines.push(`getSuraVerses(1,1,3,"madina"): ${result3.length} results`);
      result3.forEach((v) => lines.push(`  aya ${v.aya}: ${v.text.substring(0, 50)}`));
    } catch (e: any) {
      lines.push(`Hafs ERROR: ${e.message}`);
    }

    setDebugText(lines.join("\n"));
    setShowDebug(true);
  }, []);

  const loadVerses = useCallback(async () => {
    setVersesLoading(true);
    const from = startAya;
    const to = Math.min(endAya, ayahCount);
    const result = await getSuraVerses(startSura, from, to, quira);
    setVerses(result);
    setVersesLoading(false);
  }, [startSura, startAya, endAya, ayahCount, quira]);

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      if (rakaaTimerRef.current) clearTimeout(rakaaTimerRef.current);
      if (lockPressTimerRef.current) clearTimeout(lockPressTimerRef.current);
    };
  }, []);

  // ── Auto-scroll using setInterval for smooth text rendering ──
  // Using 150ms interval with animated:true avoids text tearing/doubling
  const SCROLL_INTERVAL = 150; // ms between scroll updates

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

      // pixels per interval: speed=1.0 -> ~30px/sec -> 4.5px per 150ms
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
      // resuming scroll - no extra action needed
      return next;
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleSuraChange = useCallback((sura: number) => {
    setStartSura(sura);
    const count = getAyahCount(sura);
    setStartAya(1);
    setEndAya(count);
  }, []);

  const handleStartPress = useCallback(async () => {
    await loadVerses();
    setMode("scrolling");
    scrollYRef.current = 0;
    setShowBrightnessBanner(true);
    setShowControls(false);
    setIsLocked(false);

    setTimeout(() => { startAutoScroll(); }, 500);

    if (rakaaMinutes > 0) {
      if (rakaaTimerRef.current) clearTimeout(rakaaTimerRef.current);
      rakaaTimerRef.current = setTimeout(() => {
        setIsPaused(true);
        isPausedRef.current = true;
        setShowControls(true);
      }, rakaaMinutes * 60 * 1000);
    }
  }, [loadVerses, startAutoScroll, rakaaMinutes]);

  const handleScreenTap = useCallback(() => {
    if (isLockedRef.current) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setShowControls((prev) => !prev);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) togglePause();
      }, DOUBLE_TAP_DELAY);
    }
  }, [togglePause]);

  const handleLockPress = useCallback(() => {
    setIsLocked(true);
    isLockedRef.current = true;
    setShowControls(false);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    isLockedRef.current = false;
    setShowControls(true);
  }, []);

  const handleEdgeLongPressIn = useCallback(() => {
    if (!isLockedRef.current) return;
    lockPressTimerRef.current = setTimeout(() => {
      handleUnlock();
    }, 1500);
  }, [handleUnlock]);

  const handleEdgeLongPressOut = useCallback(() => {
    if (lockPressTimerRef.current) {
      clearTimeout(lockPressTimerRef.current);
      lockPressTimerRef.current = null;
    }
  }, []);

  const handleExitScrollMode = useCallback(() => {
    stopAutoScroll();
    setMode("setup");
    setIsLocked(false);
    setShowControls(false);
    if (rakaaTimerRef.current) clearTimeout(rakaaTimerRef.current);
  }, [stopAutoScroll]);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    totalContentHeightRef.current = h;
  }, []);

  // ── Speed slider ─────────────────────────────────────────
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
          <Text style={[styles.sliderLabelText, { color: compact ? "#aaa" : mutedColor }]}>
            {t("slow", lang)}
          </Text>
          <Text style={[styles.sliderLabelValue, { color: compact ? "#fff" : ACCENT }]}>
            {currentSpeed.toFixed(1)}x
          </Text>
          <Text style={[styles.sliderLabelText, { color: compact ? "#aaa" : mutedColor }]}>
            {t("fast", lang)}
          </Text>
        </View>
        <View style={[styles.sliderTrack, { width: sliderW }]}>
          <View style={[styles.sliderFill, { width: thumbLeft, backgroundColor: compact ? "#fff" : ACCENT }]} />
          <View style={[styles.sliderThumb, { left: Math.max(0, Math.min(thumbLeft - 12, sliderW - 24)), backgroundColor: compact ? "#fff" : ACCENT }]} />
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

  // ══════════════════════════════════════════════════════════
  // SETUP PANEL
  // ══════════════════════════════════════════════════════════
  if (mode === "setup") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={24} color={textColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t("prayer_mode", lang)}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.setupContent} showsVerticalScrollIndicator={false}>

          {/* Section: Warsh/Hafs Selection */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("mosshaf_type", lang)}
              </Text>
            </View>
            <View style={styles.quiraRow}>
              {(["madina", "warsh"] as Quira[]).map((q) => (
                <Pressable
                  key={q}
                  style={[
                    styles.quiraChip,
                    {
                      borderColor: quira === q ? ACCENT : borderColor,
                      backgroundColor: quira === q ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent",
                    },
                  ]}
                  onPress={() => setQuira(q)}
                >
                  {quira === q && <Ionicons name="checkmark-circle" size={16} color={ACCENT} />}
                  <Text style={[styles.quiraChipText, { color: quira === q ? ACCENT : textColor, fontWeight: quira === q ? "700" : "400" }]}>
                    {t(q === "madina" ? "mosshaf_hafs" : "mosshaf_warsh", lang)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Section: Select Sura */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("chooseSura", lang)}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
              {suwar.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.suraChip,
                    {
                      borderColor: startSura === item.value ? ACCENT : borderColor,
                      backgroundColor: startSura === item.value ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent",
                    },
                  ]}
                  onPress={() => handleSuraChange(item.value)}
                >
                  <Text style={[styles.suraChipText, { color: startSura === item.value ? ACCENT : textColor, fontWeight: startSura === item.value ? "700" : "400" }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Section: Aya Range */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="git-compare-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("select_range", lang)}
              </Text>
            </View>
            <Text style={[styles.subLabel, { color: mutedColor }]}>{t("from_verse", lang)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
              {startAyahs.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.pickerChip, { borderColor: startAya === item.value ? ACCENT : borderColor, backgroundColor: startAya === item.value ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent" }]}
                  onPress={() => setStartAya(item.value)}
                >
                  <Text style={[styles.pickerChipText, { color: startAya === item.value ? ACCENT : textColor, fontWeight: startAya === item.value ? "700" : "400" }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.subLabel, { color: mutedColor, marginTop: 12 }]}>{t("to_verse", lang)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
              {startAyahs.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.pickerChip, { borderColor: endAya === item.value ? ACCENT : borderColor, backgroundColor: endAya === item.value ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent" }]}
                  onPress={() => setEndAya(item.value)}
                >
                  <Text style={[styles.pickerChipText, { color: endAya === item.value ? ACCENT : textColor, fontWeight: endAya === item.value ? "700" : "400" }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Section: Font & Colors */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="text-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("font_selection", lang)}
              </Text>
            </View>

            {/* Font size */}
            <View style={styles.fontSizeRow}>
              <Text style={[styles.subLabel, { color: mutedColor, marginBottom: 0 }]}>
                {fontSize}
              </Text>
              <Pressable
                style={[styles.fontSizeBtn, { backgroundColor: isDark ? "#333" : "#e8f4ed" }]}
                onPress={() => setFontSize((s) => Math.max(s - FONT_STEP, MIN_FONT_SIZE))}
              >
                <Ionicons name="remove" size={18} color={ACCENT} />
              </Pressable>
              <View style={styles.fontSizeBarWrap}>
                <View
                  style={[
                    styles.fontSizeBar,
                    { width: `${((fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) * 100}%`, backgroundColor: ACCENT },
                  ]}
                />
              </View>
              <Pressable
                style={[styles.fontSizeBtn, { backgroundColor: isDark ? "#333" : "#e8f4ed" }]}
                onPress={() => setFontSize((s) => Math.min(s + FONT_STEP, MAX_FONT_SIZE))}
              >
                <Ionicons name="add" size={18} color={ACCENT} />
              </Pressable>
            </View>

            {/* Font family */}
            <View style={styles.fontFamilyRow}>
              {FONT_OPTIONS.map((f) => (
                <Pressable
                  key={f.id}
                  style={[
                    styles.fontChip,
                    {
                      borderColor: fontFamily === f.id ? ACCENT : borderColor,
                      backgroundColor: fontFamily === f.id ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent",
                    },
                  ]}
                  onPress={() => setFontFamily(f.id)}
                >
                  <Text style={[styles.fontChipText, { color: fontFamily === f.id ? ACCENT : textColor, fontWeight: fontFamily === f.id ? "700" : "400", fontFamily: f.id }]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Color themes */}
            <Text style={[styles.subLabel, { color: mutedColor, marginTop: 10 }]}>{t("color", lang)}</Text>
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
                  <View style={[styles.colorInner, { backgroundColor: ct.textColor }]} />
                </Pressable>
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.previewBox, { backgroundColor: colorTheme.backgroundColor }]}>
              <Text style={{ color: colorTheme.textColor, fontFamily, fontSize: Math.min(fontSize, 28), textAlign: "center" }}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </Text>
            </View>
          </View>

          {/* Section: Speed */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="speedometer-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("scroll_speed", lang)}
              </Text>
            </View>
            {renderSpeedSlider(speed, setSpeed)}
            <Text style={[styles.subLabel, { color: mutedColor, marginTop: 14 }]}>
              {t("speed_profiles", lang)}
            </Text>
            <View style={styles.profileRow}>
              {SPEED_PROFILES.map((profile) => {
                const isActive = Math.abs(speed - profile.speed) < 0.05;
                return (
                  <Pressable
                    key={profile.key}
                    style={[styles.profileBtn, { borderColor: isActive ? ACCENT : borderColor, backgroundColor: isActive ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent" }]}
                    onPress={() => setSpeed(profile.speed)}
                  >
                    <Ionicons name={profile.icon} size={18} color={isActive ? ACCENT : mutedColor} />
                    <Text style={[styles.profileLabel, { color: isActive ? ACCENT : textColor, fontWeight: isActive ? "700" : "400" }]} numberOfLines={1}>
                      {t(profile.key, lang)}
                    </Text>
                    <Text style={[styles.profileSpeed, { color: mutedColor }]}>{profile.speed}x</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section: Rakaa Timer */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="timer-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("rakaa_timer", lang)}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
              {[0, 2, 3, 5, 8, 10, 15, 20].map((m) => (
                <Pressable
                  key={m}
                  style={[styles.pickerChip, { borderColor: rakaaMinutes === m ? ACCENT : borderColor, backgroundColor: rakaaMinutes === m ? (isDark ? ACCENT_DARK_BG : ACCENT_LIGHT) : "transparent" }]}
                  onPress={() => setRakaaMinutes(m)}
                >
                  <Text style={[styles.pickerChipText, { color: rakaaMinutes === m ? ACCENT : textColor, fontWeight: rakaaMinutes === m ? "700" : "400" }]}>
                    {m === 0 ? "--" : `${m} ${lang === "ar" ? "دقيقة" : "min"}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.summaryText, { color: textColor }]}>
              {t("sura_s", lang)} {getSuraName(startSura)}
            </Text>
            <Text style={[styles.summaryText, { color: mutedColor }]}>
              {t("from", lang)} {t("aya_s", lang)} {startAya} {t("to", lang)} {t("aya_s", lang)} {endAya}
            </Text>
            <Text style={[styles.summaryText, { color: mutedColor }]}>
              {quira === "warsh" ? t("mosshaf_warsh", lang) : t("mosshaf_hafs", lang)} | {speed.toFixed(1)}x
            </Text>
          </View>

          {/* Start Button */}
          <Pressable style={[styles.startBtn, { backgroundColor: ACCENT }]} onPress={handleStartPress}>
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.startBtnText}>{t("start_scrolling", lang)}</Text>
          </Pressable>

          {/* Debug Button */}
          <Pressable
            style={[styles.debugBtn, { borderColor }]}
            onPress={runDebug}
          >
            <Ionicons name="bug-outline" size={18} color={mutedColor} />
            <Text style={[styles.debugBtnText, { color: mutedColor }]}>Debug DB</Text>
          </Pressable>

          {/* Debug Modal */}
          <Modal visible={showDebug} transparent animationType="slide">
            <View style={styles.debugOverlay}>
              <View style={[styles.debugModal, { backgroundColor: cardBg }]}>
                <View style={styles.debugHeader}>
                  <Text style={[styles.debugTitle, { color: textColor }]}>DB Debug</Text>
                  <Pressable onPress={() => setShowDebug(false)}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </Pressable>
                </View>
                <ScrollView style={styles.debugScroll}>
                  <Text style={[styles.debugLog, { color: textColor }]} selectable>
                    {debugText}
                  </Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCROLL MODE - TEXT DISPLAY
  // ══════════════════════════════════════════════════════════
  return (
    <View style={[styles.scrollContainer, { backgroundColor: colorTheme.backgroundColor }]}>
      <StatusBar hidden />

      {/* Brightness reminder banner */}
      {showBrightnessBanner && (
        <View style={styles.brightnessBanner}>
          <Ionicons name="sunny-outline" size={16} color="#fff" />
          <Text style={styles.brightnessBannerText}>
            {t("brightness_reminder", lang)}
          </Text>
          <Pressable onPress={() => setShowBrightnessBanner(false)} hitSlop={10}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Main scrollable text area */}
      <Pressable style={styles.scrollTapArea} onPress={handleScreenTap}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.textScrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
          onContentSizeChange={handleContentSizeChange}
          scrollEnabled={!isLocked}
        >
          {/* Sura header */}
          <Text style={[styles.suraHeaderText, { color: colorTheme.textColor, fontFamily, fontSize: fontSize + 4 }]}>
            {t("sura_s", lang)} {getSuraName(startSura)}
          </Text>

          {/* Basmala */}
          {startSura !== 9 && startAya === 1 && (
            <Text style={[styles.basmalaText, { color: colorTheme.textColor, fontFamily, fontSize: fontSize - 2, opacity: 0.85 }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </Text>
          )}

          {/* Verses */}
          {verses.map((v) => (
            <Text
              key={v.aya}
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
              {v.text}{" "}
              <Text style={{ fontSize: fontSize * 0.55, opacity: 0.6 }}>﴿{v.aya}﴾</Text>
            </Text>
          ))}

          {/* Bottom spacer */}
          <View style={{ height: SCREEN_HEIGHT * 0.5 }} />
        </ScrollView>
      </Pressable>

      {/* Pause indicator */}
      {isPaused && !showControls && !isLocked && (
        <View style={styles.pauseIndicator} pointerEvents="none">
          <Ionicons name="pause-circle-outline" size={60} color="rgba(255,255,255,0.6)" />
          <Text style={styles.pauseText}>{t("tap_to_pause", lang)}</Text>
        </View>
      )}

      {/* Lock mode overlay - visible unlock button */}
      {isLocked && (
        <View style={styles.lockOverlay} pointerEvents="box-none">
          {/* Lock icon top-left */}
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={20} color="#fff" />
          </View>

          {/* Unlock button - clearly visible at bottom center */}
          <View style={styles.unlockButtonWrap}>
            <Pressable
              style={styles.unlockButton}
              onPressIn={handleEdgeLongPressIn}
              onPressOut={handleEdgeLongPressOut}
            >
              <Ionicons name="lock-open-outline" size={20} color="#fff" />
              <Text style={styles.unlockButtonText}>
                {t("swipe_to_unlock", lang)}
              </Text>
            </Pressable>
          </View>

          {/* Edge strip for long-press unlock (right edge) */}
          <Pressable
            style={styles.unlockStrip}
            onPressIn={handleEdgeLongPressIn}
            onPressOut={handleEdgeLongPressOut}
          >
            <View style={styles.unlockStripInner}>
              <Ionicons name="lock-open-outline" size={16} color="rgba(255,255,255,0.5)" />
            </View>
          </Pressable>
        </View>
      )}

      {/* Controls Overlay */}
      {showControls && !isLocked && (
        <View style={styles.controlsOverlay}>
          {/* Top bar */}
          <SafeAreaView edges={["top"]} style={styles.controlsTopBar}>
            <Pressable onPress={handleExitScrollMode} hitSlop={10} style={styles.controlBtn}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {getSuraName(startSura)} | {t("aya_s", lang)} {startAya}-{endAya}
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
              <Pressable style={[styles.controlActionBtn, { backgroundColor: ACCENT }]} onPress={togglePause}>
                <Ionicons name={isPaused ? "play" : "pause"} size={22} color="#fff" />
                <Text style={styles.controlActionText}>
                  {isPaused ? t("resume_scrolling", lang) : t("pause_scrolling", lang)}
                </Text>
              </Pressable>

              <Pressable style={[styles.controlActionBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]} onPress={handleLockPress}>
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Setup ────────────────────────────────────────────────
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  setupContent: { padding: 16, gap: 14, paddingBottom: 40 },

  sectionCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  subLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 4 },

  pickerScroll: { gap: 6, paddingRight: 8 },
  pickerChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5 },
  pickerChipText: { fontSize: 13 },
  suraChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5 },
  suraChipText: { fontSize: 12 },

  // Quira row
  quiraRow: { flexDirection: "row", gap: 10 },
  quiraChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, gap: 6,
  },
  quiraChipText: { fontSize: 14 },

  // Font settings
  fontSizeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  fontSizeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  fontSizeBarWrap: { flex: 1, height: 6, backgroundColor: "rgba(128,128,128,0.2)", borderRadius: 3, overflow: "hidden" },
  fontSizeBar: { height: 6, borderRadius: 3 },

  fontFamilyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  fontChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5 },
  fontChipText: { fontSize: 15 },

  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  colorCircleActive: { borderWidth: 3, width: 32, height: 32, borderRadius: 16 },
  colorInner: { width: 10, height: 10, borderRadius: 5 },

  previewBox: { marginTop: 10, padding: 14, borderRadius: 10, alignItems: "center" },

  // Speed
  profileRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  profileBtn: {
    flexDirection: "column", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5, minWidth: 72, gap: 4,
  },
  profileLabel: { fontSize: 11, textAlign: "center" },
  profileSpeed: { fontSize: 10 },

  // Slider
  sliderContainer: { paddingHorizontal: 4, paddingTop: 2 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sliderLabelText: { fontSize: 12, fontWeight: "500" },
  sliderLabelValue: { fontSize: 14, fontWeight: "700" },
  sliderTrack: { height: 6, backgroundColor: "rgba(128,128,128,0.2)", borderRadius: 3, overflow: "visible", position: "relative" },
  sliderFill: { height: 6, borderRadius: 3 },
  sliderThumb: {
    position: "absolute", top: -9, width: 24, height: 24, borderRadius: 12,
    borderWidth: 3, borderColor: "#fff", elevation: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  sliderTouchArea: { position: "absolute", top: 20, height: 36, left: 4 },

  // Summary
  summaryCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 4 },
  summaryText: { fontSize: 14, textAlign: "right" },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 14, gap: 8, marginTop: 4,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  startBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // ── Scroll Mode ──────────────────────────────────────────
  scrollContainer: { flex: 1 },
  scrollTapArea: { flex: 1 },
  scrollView: { flex: 1 },
  textScrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  suraHeaderText: { textAlign: "center", fontWeight: "700", marginBottom: 16 },
  basmalaText: { textAlign: "center", marginBottom: 20 },
  verseText: { textAlign: "right", writingDirection: "rtl", marginBottom: 8 },

  // Brightness Banner
  brightnessBanner: {
    position: "absolute", top: Platform.OS === "ios" ? 50 : 10, left: 20, right: 20, zIndex: 100,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(26,92,46,0.9)", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
  },
  brightnessBannerText: { flex: 1, color: "#fff", fontSize: 12, fontWeight: "500" },

  // Pause Indicator
  pauseIndicator: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  pauseText: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 8 },

  // Lock Mode
  lockOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  lockIconContainer: {
    position: "absolute", top: Platform.OS === "ios" ? 54 : 14, left: 16,
    backgroundColor: "rgba(0,0,0,0.5)", padding: 8, borderRadius: 20,
  },
  unlockButtonWrap: {
    position: "absolute", bottom: Platform.OS === "ios" ? 50 : 30,
    left: 0, right: 0, alignItems: "center",
  },
  unlockButton: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  unlockButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  unlockStrip: {
    position: "absolute", right: 0, top: SCREEN_HEIGHT * 0.3, bottom: SCREEN_HEIGHT * 0.3,
    width: 40, justifyContent: "center", alignItems: "center",
  },
  unlockStripInner: {
    backgroundColor: "rgba(255,255,255,0.12)", paddingVertical: 24, paddingHorizontal: 8,
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
  },

  // Controls Overlay
  controlsOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 150, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "space-between" },
  controlsTopBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  controlBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)" },
  pageIndicator: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  pageIndicatorText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  controlsBottomBar: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.3)", borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  controlFontRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 10 },
  controlFontBtn: {
    width: 40, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  controlFontBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  controlFontSizeText: { color: "#fff", fontSize: 16, fontWeight: "600", minWidth: 30, textAlign: "center" },
  controlActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  controlActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  controlActionText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Debug
  debugBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 6, marginTop: 8,
  },
  debugBtnText: { fontSize: 13, fontWeight: "600" },
  debugOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20,
  },
  debugModal: {
    borderRadius: 16, padding: 16, maxHeight: "80%",
  },
  debugHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  debugTitle: { fontSize: 18, fontWeight: "700" },
  debugScroll: { maxHeight: 500 },
  debugLog: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 18 },
});
