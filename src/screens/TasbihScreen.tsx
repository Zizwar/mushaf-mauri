import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";

const ACCENT = "#1a5c2e";

// Progress ring dimensions
const RING_SIZE = 220;
const RING_STROKE = 8;

// Try to load expo-haptics; gracefully degrade if not available
let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch (_) {
  // expo-haptics not installed - haptics will be silently skipped
}

interface DhikrPreset {
  key: string;
  arabic: string;
  target: number;
}

const DHIKR_PRESETS: DhikrPreset[] = [
  { key: "subhanallah", arabic: "\u0633\u0628\u062D\u0627\u0646 \u0627\u0644\u0644\u0647", target: 33 },
  { key: "alhamdulillah", arabic: "\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647", target: 33 },
  { key: "allahu_akbar", arabic: "\u0627\u0644\u0644\u0647 \u0623\u0643\u0628\u0631", target: 34 },
  { key: "la_ilaha", arabic: "\u0644\u0627 \u0625\u0644\u0647 \u0625\u0644\u0627 \u0627\u0644\u0644\u0647", target: 100 },
  { key: "astaghfirullah", arabic: "\u0623\u0633\u062A\u063A\u0641\u0631 \u0627\u0644\u0644\u0647", target: 100 },
  { key: "la_hawla", arabic: "\u0644\u0627 \u062D\u0648\u0644 \u0648\u0644\u0627 \u0642\u0648\u0629 \u0625\u0644\u0627 \u0628\u0627\u0644\u0644\u0647", target: 100 },
  { key: "salawat", arabic: "\u0627\u0644\u0644\u0647\u0645 \u0635\u0644 \u0639\u0644\u0649 \u0645\u062D\u0645\u062F", target: 100 },
];

// Number of segments to render for the progress ring
const SEGMENT_COUNT = 72;

interface TasbihScreenProps {
  onGoBack: () => void;
}

/**
 * Pure View-based circular progress ring component.
 * Renders a ring of small segments, coloring them based on progress.
 */
function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const segmentAngle = 360 / SEGMENT_COUNT;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);

  return (
    <View style={{ width: size, height: size, position: "absolute" }}>
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
        const angleDeg = i * segmentAngle - 90; // Start from top
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = center + radius * Math.cos(angleRad) - strokeWidth / 2;
        const y = center + radius * Math.sin(angleRad) - strokeWidth / 2;
        const isFilled = i < filledSegments;

        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: strokeWidth,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: isFilled ? color : trackColor,
            }}
          />
        );
      })}
    </View>
  );
}

export default function TasbihScreen({ onGoBack }: TasbihScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);

  const isRTL = lang === "ar" || lang === "amz";
  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [totalSession, setTotalSession] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const selectedDhikr = DHIKR_PRESETS[selectedIndex];
  const progress = Math.min(count / selectedDhikr.target, 1);
  const isCompleted = count >= selectedDhikr.target;

  const triggerHaptic = useCallback(() => {
    try {
      if (Haptics && Haptics.impactAsync) {
        Haptics.impactAsync(
          Haptics.ImpactFeedbackStyle?.Light ?? "light"
        );
      }
    } catch (_) {
      // Haptics not available on this device
    }
  }, []);

  const handleTap = useCallback(() => {
    // Haptic feedback
    triggerHaptic();

    // Pulse animation
    pulseAnim.setValue(0.93);
    Animated.spring(pulseAnim, {
      toValue: 1,
      friction: 3,
      tension: 120,
      useNativeDriver: true,
    }).start();

    setCount((prev) => prev + 1);
    setTotalSession((prev) => prev + 1);
  }, [pulseAnim, triggerHaptic]);

  const handleReset = useCallback(() => {
    setCount(0);
  }, []);

  const handleSelectDhikr = useCallback((index: number) => {
    setSelectedIndex(index);
    setCount(0);
  }, []);

  const accentFaded = isDark ? "rgba(26,92,46,0.25)" : "rgba(26,92,46,0.08)";
  const completedColor = "#d4af37"; // Gold for completed state
  const ringTrackColor = isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(0,0,0,0.06)";
  const ringFillColor = isCompleted ? completedColor : ACCENT;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={textColor}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("tasbih_title", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Dhikr Preset Selector */}
      <View style={styles.presetContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.presetScroll,
            isRTL && styles.presetScrollRTL,
          ]}
        >
          {DHIKR_PRESETS.map((preset, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Pressable
                key={preset.key}
                style={[
                  styles.presetChip,
                  {
                    borderColor: isSelected ? ACCENT : borderColor,
                    backgroundColor: isSelected
                      ? isDark
                        ? "#1a3a2e"
                        : "#e8f5e9"
                      : cardBg,
                  },
                ]}
                onPress={() => handleSelectDhikr(index)}
              >
                <Text
                  style={[
                    styles.presetArabic,
                    {
                      color: isSelected ? ACCENT : textColor,
                    },
                  ]}
                >
                  {preset.arabic}
                </Text>
                <Text
                  style={[
                    styles.presetTarget,
                    {
                      color: isSelected ? ACCENT : mutedColor,
                    },
                  ]}
                >
                  {preset.target}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Selected Dhikr Name */}
        <Text style={[styles.dhikrName, { color: textColor }]}>
          {t(selectedDhikr.key, lang)}
        </Text>

        {/* Tap Area with Progress Ring */}
        <Pressable onPress={handleTap} style={styles.tapArea}>
          <Animated.View
            style={[
              styles.tapCircleOuter,
              {
                backgroundColor: isCompleted
                  ? completedColor + "15"
                  : accentFaded,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Progress Ring */}
            <View style={styles.ringContainer}>
              <ProgressRing
                progress={progress}
                size={RING_SIZE}
                strokeWidth={RING_STROKE}
                color={ringFillColor}
                trackColor={ringTrackColor}
              />

              {/* Count Display */}
              <View style={styles.countContainer}>
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isCompleted ? completedColor : ACCENT,
                    },
                  ]}
                >
                  {count}
                </Text>
                {isCompleted && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={completedColor}
                    style={styles.completedIcon}
                  />
                )}
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* Target Display */}
        <Text style={[styles.targetText, { color: mutedColor }]}>
          {count} / {selectedDhikr.target}
          {isCompleted ? `  \u2022  ${t("completed", lang)}` : ""}
        </Text>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {/* Reset Button */}
          <Pressable
            style={[
              styles.controlBtn,
              {
                backgroundColor: cardBg,
                borderColor,
              },
            ]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={22} color={ACCENT} />
            <Text style={[styles.controlBtnText, { color: textColor }]}>
              {t("reset", lang)}
            </Text>
          </Pressable>

          {/* Total Session Counter */}
          <View
            style={[
              styles.controlBtn,
              {
                backgroundColor: cardBg,
                borderColor,
              },
            ]}
          >
            <Ionicons name="analytics-outline" size={22} color={ACCENT} />
            <Text style={[styles.controlBtnText, { color: textColor }]}>
              {t("total_count", lang)}: {totalSession}
            </Text>
          </View>
        </View>
      </View>
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
  presetContainer: {
    paddingVertical: 12,
  },
  presetScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  presetScrollRTL: {
    flexDirection: "row-reverse",
  },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 80,
  },
  presetArabic: {
    fontSize: 16,
    fontWeight: "600",
    writingDirection: "rtl",
    textAlign: "center",
  },
  presetTarget: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dhikrName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  tapArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  tapCircleOuter: {
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  countContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 56,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  completedIcon: {
    marginTop: 4,
  },
  targetText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 32,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 400,
  },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  controlBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
