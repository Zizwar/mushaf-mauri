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
  Animated,
  Image,
  StatusBar,
  Platform,
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
  getPageInfo,
} from "../utils/quranHelpers";
import { getTotalPages } from "../utils/coordinates";
import { getImageUri } from "../utils/imageCache";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = "#1a5c2e";
const ACCENT_LIGHT = "#e8f5e9";
const ACCENT_DARK_BG = "#1a3a2e";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PAGE_IMAGE_HEIGHT = SCREEN_WIDTH * 1.6;
const TOTAL_PAGES = 604;

const RTL_LANGS = ["ar", "amz", "he"];

// Speed profile presets
const SPEED_PROFILES = [
  { key: "fajr_prayer", speed: 0.5, icon: "sunny-outline" as const },
  { key: "taraweeh", speed: 1.0, icon: "moon-outline" as const },
  { key: "qiyam_layl", speed: 0.7, icon: "cloudy-night-outline" as const },
  { key: "fast_reading", speed: 2.0, icon: "flash-outline" as const },
];

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
  const currentPage = useAppStore((s) => s.currentPage);
  const quira = useAppStore((s) => s.quira);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

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

  // ── Scroll state ─────────────────────────────────────────
  const [isScrolling, setIsScrolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showBrightnessBanner, setShowBrightnessBanner] = useState(true);
  const [scrollCurrentPage, setScrollCurrentPage] = useState(1);

  // ── Refs ─────────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const speedRef = useRef(speed);
  const isPausedRef = useRef(false);
  const isLockedRef = useRef(false);
  const isScrollingRef = useRef(false);

  // For double-tap detection
  const lastTapRef = useRef(0);

  // For lock mode long-press
  const lockPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rakaa timer
  const rakaaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ─────────────────────────────────────────
  const suwar = useMemo(() => allSuwar(), []);
  const startAyahs = useMemo(() => getAyahsForSura(startSura), [startSura]);

  const startPage = useMemo(
    () => getPageBySuraAya(startSura, startAya, quira),
    [startSura, startAya, quira]
  );

  // Determine end page: page containing end aya of the same sura
  const endPage = useMemo(
    () => getPageBySuraAya(startSura, endAya, quira),
    [startSura, endAya, quira]
  );

  // Pages to render for scroll mode
  const scrollPages = useMemo(() => {
    const start = Math.max(1, startPage);
    const end = Math.min(TOTAL_PAGES, Math.max(endPage, startPage + 20));
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [startPage, endPage]);

  const totalScrollHeight = scrollPages.length * PAGE_IMAGE_HEIGHT;

  // Keep speedRef synced
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    isScrollingRef.current = isScrolling;
  }, [isScrolling]);

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (rakaaTimerRef.current) {
        clearTimeout(rakaaTimerRef.current);
      }
      if (lockPressTimerRef.current) {
        clearTimeout(lockPressTimerRef.current);
      }
    };
  }, []);

  // ── Auto-scroll animation loop ──────────────────────────
  const scrollStep = useCallback(() => {
    if (!isScrollingRef.current) return;

    const now = Date.now();
    const delta =
      lastTimestampRef.current != null ? now - lastTimestampRef.current : 16;
    lastTimestampRef.current = now;

    if (!isPausedRef.current) {
      // Pixels per millisecond: speed=1.0 -> ~30px/sec -> 0.03 px/ms
      const pxPerMs = 0.03 * speedRef.current;
      scrollYRef.current += pxPerMs * delta;

      // Clamp
      const maxScroll = Math.max(0, totalScrollHeight - SCREEN_HEIGHT);
      if (scrollYRef.current >= maxScroll) {
        scrollYRef.current = maxScroll;
        // Reached the end
        setIsScrolling(false);
        setIsPaused(true);
        return;
      }

      scrollViewRef.current?.scrollTo({
        y: scrollYRef.current,
        animated: false,
      });
    }

    animFrameRef.current = requestAnimationFrame(scrollStep);
  }, [totalScrollHeight]);

  const startAutoScroll = useCallback(() => {
    lastTimestampRef.current = null;
    isScrollingRef.current = true;
    setIsScrolling(true);
    setIsPaused(false);
    isPausedRef.current = false;
    animFrameRef.current = requestAnimationFrame(scrollStep);
  }, [scrollStep]);

  const stopAutoScroll = useCallback(() => {
    isScrollingRef.current = false;
    setIsScrolling(false);
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      if (!next) {
        // Resuming - reset timestamp so delta doesn't jump
        lastTimestampRef.current = null;
      }
      return next;
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleSuraChange = useCallback((sura: number) => {
    setStartSura(sura);
    setStartAya(1);
    setEndAya(1);
  }, []);

  const handleStartPress = useCallback(() => {
    setMode("scrolling");
    setScrollCurrentPage(startPage);
    scrollYRef.current = 0;
    setShowBrightnessBanner(true);
    setShowControls(false);
    setIsLocked(false);

    // Start scrolling after a brief delay to let images load
    setTimeout(() => {
      startAutoScroll();
    }, 500);

    // Setup rakaa timer if configured
    if (rakaaMinutes > 0) {
      if (rakaaTimerRef.current) clearTimeout(rakaaTimerRef.current);
      rakaaTimerRef.current = setTimeout(() => {
        setIsPaused(true);
        isPausedRef.current = true;
        setShowControls(true);
      }, rakaaMinutes * 60 * 1000);
    }
  }, [startPage, startAutoScroll, rakaaMinutes]);

  const handleScreenTap = useCallback(() => {
    if (isLockedRef.current) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap -> toggle controls
      setShowControls((prev) => !prev);
      lastTapRef.current = 0;
    } else {
      // Single tap -> pause/resume (handled after delay to distinguish from double tap)
      lastTapRef.current = now;
      setTimeout(() => {
        // Check if a second tap happened
        if (lastTapRef.current === now) {
          togglePause();
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [togglePause]);

  const handleLockPress = useCallback(() => {
    setIsLocked(true);
    isLockedRef.current = true;
    setShowControls(false);
  }, []);

  const handleEdgeLongPressIn = useCallback(() => {
    if (!isLockedRef.current) return;
    lockPressTimerRef.current = setTimeout(() => {
      setIsLocked(false);
      isLockedRef.current = false;
      setShowControls(true);
    }, 1500);
  }, []);

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
    if (rakaaTimerRef.current) {
      clearTimeout(rakaaTimerRef.current);
    }
  }, [stopAutoScroll]);

  const handleScroll = useCallback(
    (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      scrollYRef.current = y;
      const pageIndex = Math.floor(y / PAGE_IMAGE_HEIGHT);
      const page = scrollPages[pageIndex] ?? scrollPages[0];
      if (page && page !== scrollCurrentPage) {
        setScrollCurrentPage(page);
        setCurrentPage(page);
      }
    },
    [scrollPages, scrollCurrentPage, setCurrentPage]
  );

  // ── Speed slider helpers ─────────────────────────────────
  const speedSliderWidth = SCREEN_WIDTH - 80;
  const speedToPosition = (s: number) =>
    ((s - 0.1) / (3.0 - 0.1)) * speedSliderWidth;
  const positionToSpeed = (x: number) =>
    Math.round((0.1 + (x / speedSliderWidth) * (3.0 - 0.1)) * 10) / 10;

  // ── Render helpers ───────────────────────────────────────
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
                      ? ACCENT_DARK_BG
                      : ACCENT_LIGHT
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

  const renderSpeedSlider = (
    currentSpeed: number,
    onSpeedChange: (s: number) => void,
    compact: boolean = false
  ) => {
    const sliderW = compact ? SCREEN_WIDTH - 120 : speedSliderWidth;
    const thumbLeft = ((currentSpeed - 0.1) / (3.0 - 0.1)) * sliderW;

    return (
      <View style={[styles.sliderContainer, compact && { paddingHorizontal: 8 }]}>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabelText, { color: mutedColor }]}>
            {t("slow", lang) !== "slow" ? t("slow", lang) : "\u0628\u0637\u064A\u0621"}
          </Text>
          <Text style={[styles.sliderLabelValue, { color: ACCENT }]}>
            {currentSpeed.toFixed(1)}x
          </Text>
          <Text style={[styles.sliderLabelText, { color: mutedColor }]}>
            {t("fast", lang) !== "fast" ? t("fast", lang) : "\u0633\u0631\u064A\u0639"}
          </Text>
        </View>
        <View style={[styles.sliderTrack, { width: sliderW }]}>
          <View
            style={[
              styles.sliderFill,
              { width: thumbLeft, backgroundColor: ACCENT },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              {
                left: Math.max(0, Math.min(thumbLeft - 12, sliderW - 24)),
                backgroundColor: ACCENT,
              },
            ]}
          />
        </View>
        {/* Touchable area over track */}
        <Pressable
          style={[styles.sliderTouchArea, { width: sliderW }]}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const newSpeed = Math.round(
              (0.1 + (x / sliderW) * (3.0 - 0.1)) * 10
            ) / 10;
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
    const rakaaOptions = [0, 2, 3, 5, 8, 10, 15, 20].map((m) => ({
      value: m,
      label: m === 0 ? "--" : `${m}`,
    }));

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={bgColor}
        />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons
              name={isRtl ? "arrow-forward" : "arrow-back"}
              size={24}
              color={textColor}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t("prayer_mode", lang) !== "prayer_mode"
              ? t("prayer_mode", lang)
              : "\u0648\u0636\u0639 \u0627\u0644\u0635\u0644\u0627\u0629"}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.setupContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Select Sura */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("chooseSura", lang)}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerScroll}
            >
              {suwar.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.suraChip,
                    {
                      borderColor:
                        startSura === item.value ? ACCENT : borderColor,
                      backgroundColor:
                        startSura === item.value
                          ? isDark
                            ? ACCENT_DARK_BG
                            : ACCENT_LIGHT
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleSuraChange(item.value)}
                >
                  <Text
                    style={[
                      styles.suraChipText,
                      {
                        color:
                          startSura === item.value ? ACCENT : textColor,
                        fontWeight: startSura === item.value ? "700" : "400",
                      },
                    ]}
                  >
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
                {t("select_range", lang) !== "select_range"
                  ? t("select_range", lang)
                  : "\u0646\u0637\u0627\u0642 \u0627\u0644\u0622\u064A\u0627\u062A"}
              </Text>
            </View>

            {/* Start Aya */}
            <Text style={[styles.subLabel, { color: mutedColor }]}>
              {t("from_verse", lang) !== "from_verse"
                ? t("from_verse", lang)
                : `${t("from", lang)} ${t("aya_s", lang)}`}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerScroll}
            >
              {startAyahs.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.pickerChip,
                    {
                      borderColor:
                        startAya === item.value ? ACCENT : borderColor,
                      backgroundColor:
                        startAya === item.value
                          ? isDark
                            ? ACCENT_DARK_BG
                            : ACCENT_LIGHT
                          : "transparent",
                    },
                  ]}
                  onPress={() => setStartAya(item.value)}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      {
                        color: startAya === item.value ? ACCENT : textColor,
                        fontWeight: startAya === item.value ? "700" : "400",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* End Aya */}
            <Text style={[styles.subLabel, { color: mutedColor, marginTop: 12 }]}>
              {t("to_verse", lang) !== "to_verse"
                ? t("to_verse", lang)
                : `${t("to", lang)} ${t("aya_s", lang)}`}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerScroll}
            >
              {startAyahs.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.pickerChip,
                    {
                      borderColor:
                        endAya === item.value ? ACCENT : borderColor,
                      backgroundColor:
                        endAya === item.value
                          ? isDark
                            ? ACCENT_DARK_BG
                            : ACCENT_LIGHT
                          : "transparent",
                    },
                  ]}
                  onPress={() => setEndAya(item.value)}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      {
                        color: endAya === item.value ? ACCENT : textColor,
                        fontWeight: endAya === item.value ? "700" : "400",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Section: Speed */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="speedometer-outline" size={20} color={ACCENT} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t("scroll_speed", lang) !== "scroll_speed"
                  ? t("scroll_speed", lang)
                  : "\u0633\u0631\u0639\u0629 \u0627\u0644\u062A\u0645\u0631\u064A\u0631"}
              </Text>
            </View>

            {renderSpeedSlider(speed, setSpeed)}

            {/* Speed Profiles */}
            <Text
              style={[styles.subLabel, { color: mutedColor, marginTop: 14 }]}
            >
              {t("speed_profiles", lang) !== "speed_profiles"
                ? t("speed_profiles", lang)
                : "\u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u0633\u0631\u0639\u0629"}
            </Text>
            <View style={styles.profileRow}>
              {SPEED_PROFILES.map((profile) => {
                const isActive = Math.abs(speed - profile.speed) < 0.05;
                return (
                  <Pressable
                    key={profile.key}
                    style={[
                      styles.profileBtn,
                      {
                        borderColor: isActive ? ACCENT : borderColor,
                        backgroundColor: isActive
                          ? isDark
                            ? ACCENT_DARK_BG
                            : ACCENT_LIGHT
                          : "transparent",
                      },
                    ]}
                    onPress={() => setSpeed(profile.speed)}
                  >
                    <Ionicons
                      name={profile.icon}
                      size={18}
                      color={isActive ? ACCENT : mutedColor}
                    />
                    <Text
                      style={[
                        styles.profileLabel,
                        {
                          color: isActive ? ACCENT : textColor,
                          fontWeight: isActive ? "700" : "400",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {t(profile.key, lang) !== profile.key
                        ? t(profile.key, lang)
                        : profile.key === "fajr_prayer"
                        ? "\u0627\u0644\u0641\u062C\u0631"
                        : profile.key === "taraweeh"
                        ? "\u0627\u0644\u062A\u0631\u0627\u0648\u064A\u062D"
                        : profile.key === "qiyam_layl"
                        ? "\u0642\u064A\u0627\u0645 \u0627\u0644\u0644\u064A\u0644"
                        : "\u0633\u0631\u064A\u0639"}
                    </Text>
                    <Text
                      style={[styles.profileSpeed, { color: mutedColor }]}
                    >
                      {profile.speed}x
                    </Text>
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
                {"\u0645\u0624\u0642\u062A \u0627\u0644\u0631\u0643\u0639\u0629"} ({t("pause", lang)})
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pickerScroll}
            >
              {[0, 2, 3, 5, 8, 10, 15, 20].map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.pickerChip,
                    {
                      borderColor:
                        rakaaMinutes === m ? ACCENT : borderColor,
                      backgroundColor:
                        rakaaMinutes === m
                          ? isDark
                            ? ACCENT_DARK_BG
                            : ACCENT_LIGHT
                          : "transparent",
                    },
                  ]}
                  onPress={() => setRakaaMinutes(m)}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      {
                        color: rakaaMinutes === m ? ACCENT : textColor,
                        fontWeight: rakaaMinutes === m ? "700" : "400",
                      },
                    ]}
                  >
                    {m === 0 ? "--" : `${m} ${t("page", lang) === "\u0627\u0644\u0635\u0641\u062D\u0629" ? "\u062F\u0642\u064A\u0642\u0629" : "min"}`}
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
              {t("from", lang)} {t("aya_s", lang)} {startAya} {t("to", lang)}{" "}
              {t("aya_s", lang)} {endAya}
            </Text>
            <Text style={[styles.summaryText, { color: mutedColor }]}>
              {t("page", lang)}: {startPage}
              {endPage !== startPage ? ` - ${endPage}` : ""}
              {"  |  "}
              {speed.toFixed(1)}x
            </Text>
          </View>

          {/* Start Button */}
          <Pressable
            style={[styles.startBtn, { backgroundColor: ACCENT }]}
            onPress={handleStartPress}
          >
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.startBtnText}>
              {t("start_scrolling", lang) !== "start_scrolling"
                ? t("start_scrolling", lang)
                : "\u0628\u062F\u0621 \u0627\u0644\u062A\u0645\u0631\u064A\u0631"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCROLL MODE
  // ══════════════════════════════════════════════════════════
  const pageInfo = getPageInfo(scrollCurrentPage, quira);

  return (
    <View style={[styles.scrollContainer, { backgroundColor: "#000" }]}>
      <StatusBar hidden />

      {/* Brightness reminder banner */}
      {showBrightnessBanner && (
        <View style={styles.brightnessBanner}>
          <Ionicons name="sunny-outline" size={16} color="#fff" />
          <Text style={styles.brightnessBannerText}>
            {t("brightness_reminder", lang) !== "brightness_reminder"
              ? t("brightness_reminder", lang)
              : "\u062A\u0630\u0643\u064A\u0631: \u0627\u0636\u0628\u0637 \u0633\u0637\u0648\u0639 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0631\u0627\u062D\u0629 \u0639\u064A\u0646\u064A\u0643"}
          </Text>
          <Pressable
            onPress={() => setShowBrightnessBanner(false)}
            hitSlop={10}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Main scrollable area */}
      <Pressable
        style={styles.scrollTapArea}
        onPress={handleScreenTap}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          scrollEnabled={!isLocked}
        >
          {scrollPages.map((page) => (
            <Image
              key={page}
              source={{ uri: getImageUri(page, quira) }}
              style={styles.pageImage}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
      </Pressable>

      {/* Pause indicator */}
      {isPaused && !showControls && !isLocked && (
        <View style={styles.pauseIndicator} pointerEvents="none">
          <Ionicons name="pause-circle-outline" size={60} color="rgba(255,255,255,0.6)" />
          <Text style={styles.pauseText}>
            {t("tap_to_pause", lang) !== "tap_to_pause"
              ? t("tap_to_pause", lang)
              : "\u0627\u0646\u0642\u0631 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629"}
          </Text>
        </View>
      )}

      {/* Lock mode overlay */}
      {isLocked && (
        <View style={styles.lockOverlay} pointerEvents="box-none">
          {/* Lock icon */}
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.5)" />
          </View>

          {/* Edge strip for long-press unlock (right edge) */}
          <Pressable
            style={styles.unlockStrip}
            onPressIn={handleEdgeLongPressIn}
            onPressOut={handleEdgeLongPressOut}
          >
            <View style={styles.unlockStripInner}>
              <Ionicons
                name="lock-open-outline"
                size={14}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          </Pressable>

          {/* Swipe hint */}
          <View style={styles.unlockHint}>
            <Text style={styles.unlockHintText}>
              {t("swipe_to_unlock", lang) !== "swipe_to_unlock"
                ? t("swipe_to_unlock", lang)
                : "\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u062D\u0627\u0641\u0629 \u0644\u0644\u0641\u062A\u062D"}
            </Text>
          </View>
        </View>
      )}

      {/* Controls Overlay */}
      {showControls && !isLocked && (
        <View style={styles.controlsOverlay}>
          {/* Top bar */}
          <SafeAreaView edges={["top"]} style={styles.controlsTopBar}>
            <Pressable
              onPress={handleExitScrollMode}
              hitSlop={10}
              style={styles.controlBtn}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {pageInfo.suraName} | {t("page", lang)} {scrollCurrentPage}
              </Text>
            </View>

            <Pressable
              onPress={handleLockPress}
              hitSlop={10}
              style={styles.controlBtn}
            >
              <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            </Pressable>
          </SafeAreaView>

          {/* Bottom controls */}
          <SafeAreaView edges={["bottom"]} style={styles.controlsBottomBar}>
            {/* Speed slider */}
            {renderSpeedSlider(speed, setSpeed, true)}

            {/* Action buttons */}
            <View style={styles.controlActions}>
              <Pressable
                style={[styles.controlActionBtn, { backgroundColor: ACCENT }]}
                onPress={togglePause}
              >
                <Ionicons
                  name={isPaused ? "play" : "pause"}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.controlActionText}>
                  {isPaused
                    ? t("resume_scrolling", lang) !== "resume_scrolling"
                      ? t("resume_scrolling", lang)
                      : "\u0627\u0633\u062A\u0626\u0646\u0627\u0641"
                    : t("pause_scrolling", lang) !== "pause_scrolling"
                    ? t("pause_scrolling", lang)
                    : "\u0625\u064A\u0642\u0627\u0641"}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.controlActionBtn,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
                onPress={handleLockPress}
              >
                <Ionicons name="lock-closed" size={20} color="#fff" />
                <Text style={styles.controlActionText}>
                  {t("lock_screen_mode", lang) !== "lock_screen_mode"
                    ? t("lock_screen_mode", lang)
                    : "\u0642\u0641\u0644 \u0627\u0644\u0634\u0627\u0634\u0629"}
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
  setupContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },
  pickerScroll: {
    gap: 6,
    paddingRight: 8,
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
  pickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  pickerChipText: {
    fontSize: 13,
  },
  suraChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  suraChipText: {
    fontSize: 12,
  },
  profileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  profileBtn: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 72,
    gap: 4,
  },
  profileLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  profileSpeed: {
    fontSize: 10,
  },

  // ── Slider ───────────────────────────────────────────────
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

  // ── Summary & Start ──────────────────────────────────────
  summaryCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 4,
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
    marginTop: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  // ── Scroll Mode ──────────────────────────────────────────
  scrollContainer: {
    flex: 1,
  },
  scrollTapArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "center",
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: PAGE_IMAGE_HEIGHT,
  },

  // ── Brightness Banner ────────────────────────────────────
  brightnessBanner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 10,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(26,92,46,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  brightnessBannerText: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Pause Indicator ──────────────────────────────────────
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

  // ── Lock Mode ────────────────────────────────────────────
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  lockIconContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 14,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 6,
    borderRadius: 14,
  },
  unlockStrip: {
    position: "absolute",
    right: 0,
    top: SCREEN_HEIGHT * 0.3,
    bottom: SCREEN_HEIGHT * 0.3,
    width: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockStripInner: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 20,
    paddingHorizontal: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  unlockHint: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  unlockHintText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
  },

  // ── Controls Overlay ─────────────────────────────────────
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
