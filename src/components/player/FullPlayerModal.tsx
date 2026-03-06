import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type LangKey } from "../../i18n";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ACCENT = "#4285f4";
const RECORDING_COLOR = "#d32f2f";

export interface FullPlayerColors {
  fullBg: string;
  fullText: string;
  fullSecondary: string;
  fullCard: string;
  fullProgressTrack: string;
  accent: string;
  sliderThumb: string;
}

export interface SelectedAya {
  sura: number;
  aya: number;
  page: number;
}

export interface PlayerStatus {
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playing: boolean;
  isLoaded: boolean;
}

interface FullPlayerModalProps {
  visible: boolean;
  slideAnim: Animated.Value;
  colors: FullPlayerColors;
  isDark: boolean;
  lang: LangKey;
  suraNameAr: string;
  suraNameEn: string;
  quranFont: string;
  ayahText: string | null;
  selectedAya: SelectedAya;
  currentReciterName: string;
  status: PlayerStatus;
  isPlaying: boolean;
  recordingState: "idle" | "recording" | "saving";
  listenThenRecord: boolean;
  progress: number;
  onClose: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onSeek: (fraction: number) => void;
  onMicPress: () => void;
  onListenThenRecord: () => void;
  onReciterPress: () => void;
}

const formatTime = (sec: number) => {
  if (!sec || isNaN(sec)) return "0:00";
  const totalSec = Math.floor(sec);
  const min = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${min}:${s < 10 ? "0" : ""}${s}`;
};

export default function FullPlayerModal({
  visible,
  slideAnim,
  colors,
  isDark,
  lang,
  suraNameAr,
  suraNameEn,
  quranFont,
  ayahText,
  selectedAya,
  currentReciterName,
  status,
  isPlaying,
  recordingState,
  listenThenRecord,
  progress,
  onClose,
  onStop,
  onPrev,
  onNext,
  onPlayPause,
  onSeek,
  onMicPress,
  onListenThenRecord,
  onReciterPress,
}: FullPlayerModalProps) {
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.fullContainer,
          {
            backgroundColor: colors.fullBg,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.fullHeader}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.fullHeaderBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="chevron-down" size={28} color={colors.fullText} />
          </Pressable>
          <Text style={[styles.fullHeaderTitle, { color: colors.fullSecondary }]}>
            {t("telawa", lang)}
          </Text>
          <Pressable
            onPress={onStop}
            hitSlop={12}
            style={({ pressed }) => [styles.fullHeaderBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="stop-circle" size={28} color={colors.fullSecondary} />
          </Pressable>
        </View>

        {/* Sura Display Card */}
        <View style={styles.fullSuraSection}>
          <View
            style={[
              styles.fullSuraCard,
              {
                backgroundColor: colors.fullCard,
                shadowColor: isDark ? "transparent" : "#000",
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "transparent",
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.fullSuraName,
                { color: colors.fullText },
                quranFont !== "default" && { fontFamily: quranFont },
              ]}
            >
              {suraNameAr}
            </Text>
            {lang !== "ar" && (
              <Text style={[styles.fullSuraNameEn, { color: colors.fullSecondary }]}>
                {suraNameEn}
              </Text>
            )}
            {ayahText ? (
              <ScrollView style={styles.fullAyahScroll} nestedScrollEnabled>
                <Text
                  style={[
                    styles.fullAyahText,
                    { color: colors.fullText },
                    quranFont !== "default" && { fontFamily: quranFont },
                  ]}
                >
                  {ayahText}
                </Text>
              </ScrollView>
            ) : null}
            <View style={styles.fullCardFooter}>
              <View style={styles.fullAyaBadge}>
                <Text style={styles.fullAyaBadgeText}>
                  {t("aya_s", lang)} {selectedAya.aya}
                </Text>
              </View>
              <Text style={[styles.fullPageInfo, { color: colors.fullSecondary }]}>
                {t("page", lang)} {selectedAya.page}
              </Text>
            </View>
          </View>
        </View>

        {/* Reciter name (tappable) */}
        <Pressable
          onPress={onReciterPress}
          style={({ pressed }) => [styles.fullReciterRow, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="mic-outline" size={18} color={colors.accent} />
          <Text style={[styles.fullReciterName, { color: colors.fullText }]} numberOfLines={1}>
            {currentReciterName}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.fullSecondary} />
        </Pressable>

        {/* Progress Slider */}
        <View style={styles.fullProgressSection}>
          <Pressable
            style={[styles.fullProgressTrack, { backgroundColor: colors.fullProgressTrack }]}
            onPress={(e) => {
              const fraction = e.nativeEvent.locationX / (SCREEN_WIDTH - 48);
              onSeek(Math.max(0, Math.min(1, fraction)));
            }}
          >
            <View
              style={[
                styles.fullProgressFill,
                {
                  backgroundColor: colors.accent,
                  width: `${Math.min(progress * 100, 100)}%` as any,
                },
              ]}
            />
            <View
              style={[
                styles.fullProgressThumb,
                {
                  backgroundColor: colors.sliderThumb,
                  left: `${Math.min(progress * 100, 100)}%` as any,
                },
              ]}
            />
          </Pressable>
          <View style={styles.fullTimeRow}>
            <Text style={[styles.fullTimeText, { color: colors.fullSecondary }]}>
              {formatTime(status.currentTime)}
            </Text>
            <Text style={[styles.fullTimeText, { color: colors.fullSecondary }]}>
              {formatTime(status.duration)}
            </Text>
          </View>
        </View>

        {/* Transport Controls */}
        <View style={styles.fullControls}>
          <Pressable
            onPress={onPrev}
            hitSlop={12}
            style={({ pressed }) => [styles.fullSideBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="play-skip-back" size={32} color={colors.fullText} />
          </Pressable>

          <Pressable
            onPress={onPlayPause}
            style={({ pressed }) => [
              styles.fullPlayBtn,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.85 },
            ]}
          >
            {status.isBuffering ? (
              <Ionicons name="hourglass-outline" size={38} color="#ffffff" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={60}
                color="#ffffff"
              />
            )}
          </Pressable>

          <Pressable
            onPress={onNext}
            hitSlop={12}
            style={({ pressed }) => [styles.fullSideBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="play-skip-forward" size={32} color={colors.fullText} />
          </Pressable>
        </View>

        {/* Recording buttons */}
        <View style={styles.recordSection}>
          <View style={styles.recordButtonRow}>
            {/* Standard record button */}
            <Pressable
              onPress={onMicPress}
              style={({ pressed }) => [
                styles.recordBtn,
                {
                  backgroundColor:
                    recordingState === "recording" && !listenThenRecord
                      ? RECORDING_COLOR
                      : isDark
                      ? "#2a2a3e"
                      : "#f0f0f0",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={
                  recordingState === "recording"
                    ? "stop"
                    : recordingState === "saving"
                    ? "hourglass-outline"
                    : "mic"
                }
                size={22}
                color={recordingState === "recording" ? "#fff" : RECORDING_COLOR}
              />
              <Text
                style={[
                  styles.recordBtnText,
                  { color: recordingState === "recording" ? "#fff" : colors.fullText },
                ]}
              >
                {recordingState === "recording"
                  ? t("stop_recording", lang)
                  : recordingState === "saving"
                  ? t("recording_saved", lang)
                  : t("start_recording", lang)}
              </Text>
            </Pressable>

            {/* Listen-then-record button */}
            <Pressable
              onPress={onListenThenRecord}
              style={({ pressed }) => [
                styles.recordBtn,
                {
                  backgroundColor: listenThenRecord
                    ? "#ff9800"
                    : isDark
                    ? "#2a2a3e"
                    : "#f0f0f0",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={listenThenRecord ? "stop" : "ear"}
                size={20}
                color={listenThenRecord ? "#fff" : "#ff9800"}
              />
              <Text
                style={[
                  styles.recordBtnText,
                  { color: listenThenRecord ? "#fff" : colors.fullText, fontSize: 12 },
                ]}
              >
                {t("listen_then_record", lang)}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingHorizontal: 24,
  },
  fullHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    zIndex: 10,
    elevation: 10,
  },
  fullHeaderBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  fullHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  fullSuraSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    overflow: "hidden",
  },
  fullSuraCard: {
    width: SCREEN_WIDTH - 64,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  fullSuraName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  fullSuraNameEn: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 10,
    textAlign: "center",
    opacity: 0.7,
  },
  fullCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  fullAyaBadge: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  fullAyaBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  fullPageInfo: {
    fontSize: 12,
    fontWeight: "500",
  },
  fullAyahScroll: {
    maxHeight: 120,
    marginTop: 10,
    width: "100%",
  },
  fullAyahText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: "center",
    writingDirection: "rtl",
    paddingHorizontal: 12,
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
  },
  fullReciterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  fullReciterName: {
    fontSize: 15,
    fontWeight: "600",
    maxWidth: SCREEN_WIDTH * 0.6,
    flex: 1,
    textAlign: "center",
  },
  fullProgressSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  fullProgressTrack: {
    height: 6,
    borderRadius: 3,
    position: "relative",
    justifyContent: "center",
  },
  fullProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  fullProgressThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    top: -5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  fullTimeText: {
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  fullControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 16,
  },
  fullSideBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fullPlayBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPressed: {
    opacity: 0.5,
  },
  recordSection: {
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingHorizontal: 16,
  },
  recordButtonRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    width: "100%",
  },
  recordBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
  },
  recordBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
