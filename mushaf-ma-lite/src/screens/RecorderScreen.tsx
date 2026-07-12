import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { File } from "expo-file-system";
import { t, tf } from "../i18n";
import {
  resolveQuranFont,
  useAppStore,
  useTheme,
} from "../store/useAppStore";
import { ACCENT, RECORDING_COLOR, RECORDING_IDLE } from "../theme/themes";
import {
  BISMILLAH_HAFS,
  getAyahCount,
  getSuraName,
  getSuraVerses,
  showBismillah,
  toArabicNum,
} from "../utils/quranText";
import {
  findAyahRecording,
  getAudioUri,
  recordedAyahMap,
  saveAyahRecording,
  saveSessionRecording,
  type SessionMarker,
} from "../utils/recitationsStore";
import { useQuranRecorder } from "../hooks/useQuranRecorder";
import { usePlayer } from "../hooks/usePlayer";
import { LevelMeter } from "../components/LevelMeter";
import { formatDuration } from "../utils/format";

type TapStyle = "tap" | "hold";

interface PendingSession {
  uri: string;
  durationMs: number;
  markers: SessionMarker[];
}

interface Props {
  sura: number;
  initialAya?: number;
  onGoBack: () => void;
}

export function RecorderScreen({ sura, initialAya = 1, onGoBack }: Props) {
  useKeepAwake();
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const riwaya = useAppStore((s) => s.riwaya);
  const fontFamily = useAppStore((s) => s.textFontFamily);
  const fontSize = useAppStore((s) => s.textFontSize);
  const setTextFontSize = useAppStore((s) => s.setTextFontSize);
  const recordMode = useAppStore((s) => s.recordMode);
  const setRecordMode = useAppStore((s) => s.setRecordMode);
  const compareReciterId = useAppStore((s) => s.compareReciterId);
  const setLastPosition = useAppStore((s) => s.setLastPosition);
  const bumpDirty = useAppStore((s) => s.bumpRecitationsDirty);
  const isRTL = lang === "ar";

  const totalAyahs = getAyahCount(sura, riwaya);
  const [currentAya, setCurrentAya] = useState(
    Math.min(Math.max(1, initialAya), totalAyahs)
  );
  const [tapStyle, setTapStyle] = useState<TapStyle>("tap");
  const [recordedMap, setRecordedMap] = useState<Record<number, boolean>>({});
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(
    null
  );

  const recorderHook = useQuranRecorder();
  const {
    recorderState,
    isTaking,
    sessionState,
    startTake,
    stopTake,
    discardTake,
    startSession,
    pauseSession,
    resumeSession,
    markAyah,
    stopSession,
    discardSession,
  } = recorderHook;

  const player = usePlayer(compareReciterId);
  const flatListRef = useRef<FlatList>(null);
  const isBusyRecording = isTaking || sessionState !== "idle";

  const verses = useMemo(
    () => getSuraVerses(sura, riwaya),
    [sura, riwaya]
  );
  const quranFont = resolveQuranFont(fontFamily, riwaya);

  const refreshRecordedMap = useCallback(() => {
    setRecordedMap(recordedAyahMap(sura, riwaya));
  }, [sura, riwaya]);

  useEffect(() => {
    refreshRecordedMap();
  }, [refreshRecordedMap]);

  useEffect(() => {
    setLastPosition({ sura, aya: currentAya, riwaya });
  }, [sura, currentAya, riwaya, setLastPosition]);

  // scroll current ayah into view
  useEffect(() => {
    if (currentAya < 1 || currentAya > verses.length) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: currentAya - 1,
        animated: true,
        viewPosition: 0.3,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentAya, verses.length]);

  // ---- back handling (guard active recording) ----------------------------

  const guardedBack = useCallback(() => {
    if (!isBusyRecording) {
      player.stopPlayback();
      onGoBack();
      return;
    }
    Alert.alert(
      t("exit_recording_title", lang),
      t("exit_recording_message", lang),
      [
        { text: t("keep_recording", lang), style: "cancel" },
        {
          text: t("discard_and_exit", lang),
          style: "destructive",
          onPress: async () => {
            if (isTaking) await discardTake();
            if (sessionState !== "idle") await discardSession();
            player.stopPlayback();
            onGoBack();
          },
        },
      ]
    );
  }, [
    isBusyRecording,
    isTaking,
    sessionState,
    lang,
    onGoBack,
    player,
    discardTake,
    discardSession,
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      guardedBack();
      return true;
    });
    return () => sub.remove();
  }, [guardedBack]);

  // ---- ayah mode ----------------------------------------------------------

  const handleStartTake = useCallback(async () => {
    player.stopPlayback();
    const ok = await startTake();
    if (!ok) {
      Alert.alert(t("error", lang), t("mic_permission_needed", lang));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [player, startTake, lang]);

  const handleStopTake = useCallback(async () => {
    const result = await stopTake();
    if (!result) return;
    saveAyahRecording(result.uri, {
      sura,
      aya: currentAya,
      riwaya,
      durationMs: result.durationMs,
    });
    bumpDirty();
    refreshRecordedMap();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    if (currentAya < totalAyahs) setCurrentAya((a) => a + 1);
  }, [
    stopTake,
    sura,
    currentAya,
    riwaya,
    totalAyahs,
    bumpDirty,
    refreshRecordedMap,
  ]);

  const handleTapRecord = useCallback(() => {
    if (isTaking) void handleStopTake();
    else void handleStartTake();
  }, [isTaking, handleStopTake, handleStartTake]);

  // ---- session mode -------------------------------------------------------

  const handleSessionMain = useCallback(async () => {
    if (sessionState === "idle") {
      player.stopPlayback();
      const ok = await startSession(currentAya);
      if (!ok) {
        Alert.alert(t("error", lang), t("mic_permission_needed", lang));
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (sessionState === "recording") {
      pauseSession();
    } else {
      resumeSession();
    }
  }, [sessionState, player, startSession, currentAya, lang, pauseSession, resumeSession]);

  const handleSessionStop = useCallback(async () => {
    const result = await stopSession();
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    setPendingSession(result);
  }, [stopSession]);

  const advanceAyah = useCallback(() => {
    if (currentAya >= totalAyahs) return;
    const next = currentAya + 1;
    setCurrentAya(next);
    if (sessionState === "recording") markAyah(next);
  }, [currentAya, totalAyahs, sessionState, markAyah]);

  const goPrevAyah = useCallback(() => {
    if (currentAya <= 1) return;
    const prev = currentAya - 1;
    setCurrentAya(prev);
    if (sessionState === "recording") markAyah(prev);
  }, [currentAya, sessionState, markAyah]);

  const handleSaveSession = useCallback(() => {
    if (!pendingSession) return;
    const ayas = pendingSession.markers.map((m) => m.aya);
    saveSessionRecording(pendingSession.uri, {
      sura,
      ayaFrom: Math.min(...ayas),
      ayaTo: Math.max(...ayas),
      riwaya,
      durationMs: pendingSession.durationMs,
      markers: pendingSession.markers,
    });
    bumpDirty();
    setPendingSession(null);
  }, [pendingSession, sura, riwaya, bumpDirty]);

  // ---- playback helpers ---------------------------------------------------

  const playMyTake = useCallback(() => {
    const meta = findAyahRecording(sura, currentAya, riwaya);
    if (!meta) return;
    const uri = getAudioUri(meta.id);
    if (!uri) return;
    player.togglePlay({ key: meta.id, uri, sura, aya: currentAya });
  }, [sura, currentAya, riwaya, player]);

  const playReciter = useCallback(() => {
    player.playComparison({
      key: `reciter-${sura}-${currentAya}`,
      uri: "",
      sura,
      aya: currentAya,
    });
  }, [player, sura, currentAya]);

  // ---- render -------------------------------------------------------------

  const hasMyTake = !!recordedMap[currentAya];

  const renderVerse = ({ item, index }: { item: { aya: number; text: string }; index: number }) => {
    const isCurrent = item.aya === currentAya;
    const isRecorded = !!recordedMap[item.aya];
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (isTaking) return; // don't switch target mid-take
          setCurrentAya(item.aya);
          if (sessionState === "recording") markAyah(item.aya);
        }}
        style={[
          styles.verseBlock,
          {
            backgroundColor: isCurrent
              ? "rgba(26, 92, 46, 0.14)"
              : "transparent",
            borderColor: isCurrent ? ACCENT : "transparent",
          },
        ]}
      >
        {index === 0 && showBismillah(sura, riwaya) ? (
          <Text
            style={[
              styles.bismillah,
              { color: theme.color, fontFamily: quranFont, fontSize: fontSize - 2 },
            ]}
          >
            {BISMILLAH_HAFS}
          </Text>
        ) : null}
        <Text
          style={[
            styles.verseText,
            {
              color: theme.color,
              fontFamily: quranFont,
              fontSize,
              lineHeight: fontSize * 1.9,
            },
          ]}
        >
          {item.text}
        </Text>
        {isRecorded && recordMode === "ayah" ? (
          <View style={[styles.recordedBadge, isRTL ? { left: 6 } : { right: 6 }]}>
            <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const timerMs =
    sessionState !== "idle" || isTaking ? recorderState.durationMillis : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardColor,
            borderBottomColor: theme.borderColor,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity onPress={guardedBack} style={styles.headerBtn}>
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={theme.color}
          />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={[styles.headerTitle, { color: theme.color, fontFamily: quranFont }]}
            numberOfLines={1}
          >
            {getSuraName(sura, lang)}
          </Text>
          <Text style={[styles.headerSub, { color: theme.subColor }]}>
            {t(riwaya, lang)}
            {" · "}
            {tf("ayah_of", lang, {
              n: isRTL ? toArabicNum(currentAya) : currentAya,
              total: isRTL ? toArabicNum(totalAyahs) : totalAyahs,
            })}
          </Text>
        </View>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
          <TouchableOpacity
            onPress={() => setTextFontSize(Math.max(18, fontSize - 2))}
            style={styles.headerBtn}
          >
            <Ionicons name="remove-circle-outline" size={22} color={theme.color} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTextFontSize(Math.min(40, fontSize + 2))}
            style={styles.headerBtn}
          >
            <Ionicons name="add-circle-outline" size={22} color={theme.color} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode switcher */}
      <View
        style={[
          styles.modeRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {(
          [
            { key: "ayah", icon: "mic-outline", label: t("ayah_mode", lang) },
            { key: "session", icon: "radio-outline", label: t("session_mode", lang) },
          ] as const
        ).map((m) => {
          const active = recordMode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              disabled={isBusyRecording}
              style={[
                styles.modePill,
                {
                  backgroundColor: active ? ACCENT : theme.cardColor,
                  borderColor: active ? ACCENT : theme.borderColor,
                  opacity: isBusyRecording && !active ? 0.4 : 1,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              onPress={() => setRecordMode(m.key)}
            >
              <Ionicons
                name={m.icon}
                size={16}
                color={active ? "#fff" : theme.color}
              />
              <Text
                style={[
                  styles.modePillText,
                  { color: active ? "#fff" : theme.color },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Verses */}
      <FlatList
        ref={flatListRef}
        data={verses}
        keyExtractor={(item) => String(item.aya)}
        renderItem={renderVerse}
        contentContainerStyle={styles.versesContent}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.3 });
          }, 250);
        }}
        initialNumToRender={12}
        windowSize={10}
      />

      {/* Bottom control panel */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.cardColor,
            borderTopColor: theme.borderColor,
          },
        ]}
      >
        {recordMode === "ayah" ? (
          <>
            {/* helper row: prev / play mine / compare / next */}
            <View
              style={[
                styles.helperRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <RoundBtn
                icon={isRTL ? "chevron-forward" : "chevron-back"}
                disabled={currentAya <= 1 || isTaking}
                color={theme.color}
                border={theme.borderColor}
                onPress={goPrevAyah}
              />
              <RoundBtn
                icon={
                  player.playingKey && player.playMode === "user"
                    ? "stop"
                    : "play"
                }
                disabled={!hasMyTake || isTaking}
                color={ACCENT}
                border={theme.borderColor}
                onPress={playMyTake}
              />
              <RoundBtn
                icon="headset"
                disabled={isTaking}
                active={player.playMode === "compare" && !!player.playingKey}
                color="#336699"
                border={theme.borderColor}
                onPress={playReciter}
              />
              <RoundBtn
                icon={isRTL ? "chevron-back" : "chevron-forward"}
                disabled={currentAya >= totalAyahs || isTaking}
                color={theme.color}
                border={theme.borderColor}
                onPress={advanceAyah}
              />
            </View>

            {/* main record button */}
            <View style={styles.mainRow}>
              {tapStyle === "tap" ? (
                <TouchableOpacity
                  style={[
                    styles.recordBtn,
                    {
                      backgroundColor: isTaking
                        ? RECORDING_COLOR
                        : RECORDING_IDLE,
                      borderColor: isTaking ? "#b71c1c" : "#ef9a9a",
                    },
                  ]}
                  onPress={handleTapRecord}
                >
                  <Ionicons
                    name={isTaking ? "stop" : "mic"}
                    size={34}
                    color="#fff"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.recordBtn,
                    {
                      backgroundColor: isTaking
                        ? RECORDING_COLOR
                        : RECORDING_IDLE,
                      borderColor: isTaking ? "#b71c1c" : "#ef9a9a",
                    },
                  ]}
                  onPressIn={handleStartTake}
                  onPressOut={handleStopTake}
                >
                  <Ionicons
                    name={isTaking ? "mic" : "hand-left"}
                    size={34}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* caption + timer + tap/hold toggle */}
            <View
              style={[
                styles.captionRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[styles.caption, { color: theme.subColor }]}>
                  {isTaking
                    ? tapStyle === "tap"
                      ? t("tap_to_stop", lang)
                      : t("recording", lang)
                    : tapStyle === "tap"
                      ? t("tap_to_record", lang)
                      : t("hold_to_record", lang)}
                </Text>
                {isTaking ? (
                  <Text style={[styles.timerSmall, { color: RECORDING_COLOR }]}>
                    {formatDuration(timerMs)}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.tapHoldWrap,
                  { borderColor: theme.borderColor, flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                {(
                  [
                    { key: "tap", icon: "finger-print-outline", label: t("tap_mode", lang) },
                    { key: "hold", icon: "hand-left-outline", label: t("hold_mode", lang) },
                  ] as const
                ).map((s) => {
                  const active = tapStyle === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      disabled={isTaking}
                      style={[
                        styles.tapHoldPill,
                        { backgroundColor: active ? ACCENT : "transparent" },
                      ]}
                      onPress={() => setTapStyle(s.key)}
                    >
                      <Ionicons
                        name={s.icon}
                        size={14}
                        color={active ? "#fff" : theme.subColor}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: active ? "#fff" : theme.subColor,
                        }}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* session status row */}
            <View
              style={[
                styles.sessionStatusRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View
                style={[
                  styles.sessionTimerWrap,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                {sessionState === "recording" ? (
                  <View style={styles.recDot} />
                ) : null}
                <Text
                  style={[
                    styles.timer,
                    {
                      color:
                        sessionState === "recording"
                          ? RECORDING_COLOR
                          : theme.color,
                    },
                  ]}
                >
                  {formatDuration(timerMs)}
                </Text>
              </View>
              <LevelMeter
                metering={recorderState.metering}
                active={sessionState === "recording"}
              />
              <Text style={[styles.caption, { color: theme.subColor }]}>
                {sessionState === "recording"
                  ? t("recording", lang)
                  : sessionState === "paused"
                    ? t("paused", lang)
                    : t("session_mode", lang)}
              </Text>
            </View>

            {/* session buttons */}
            <View
              style={[
                styles.sessionBtnRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              {sessionState !== "idle" ? (
                <TouchableOpacity
                  style={[styles.stopBtn, { borderColor: RECORDING_COLOR }]}
                  onPress={handleSessionStop}
                >
                  <Ionicons name="stop" size={24} color={RECORDING_COLOR} />
                </TouchableOpacity>
              ) : (
                <View style={styles.stopBtnPlaceholder} />
              )}

              <TouchableOpacity
                style={[
                  styles.recordBtn,
                  {
                    backgroundColor:
                      sessionState === "recording"
                        ? RECORDING_COLOR
                        : sessionState === "paused"
                          ? "#ef6c00"
                          : RECORDING_IDLE,
                    borderColor:
                      sessionState === "recording" ? "#b71c1c" : "#ef9a9a",
                  },
                ]}
                onPress={handleSessionMain}
              >
                <Ionicons
                  name={
                    sessionState === "recording"
                      ? "pause"
                      : "mic"
                  }
                  size={34}
                  color="#fff"
                />
              </TouchableOpacity>

              {sessionState === "recording" ? (
                <TouchableOpacity
                  style={[
                    styles.nextAyahBtn,
                    { borderColor: ACCENT, flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                  disabled={currentAya >= totalAyahs}
                  onPress={advanceAyah}
                >
                  <Ionicons
                    name={isRTL ? "chevron-back" : "chevron-forward"}
                    size={18}
                    color={ACCENT}
                  />
                  <Text style={[styles.nextAyahText, { color: ACCENT }]}>
                    {t("next_ayah", lang)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.stopBtnPlaceholder} />
              )}
            </View>

            <Text
              style={[styles.caption, { color: theme.subColor, textAlign: "center" }]}
            >
              {sessionState === "idle"
                ? t("start_session", lang)
                : sessionState === "recording"
                  ? t("stop_save", lang) + " ⏹"
                  : t("resume", lang) + " 🎙"}
            </Text>
          </>
        )}
      </View>

      {/* Save-session modal */}
      <Modal
        visible={!!pendingSession}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
            ]}
          >
            <Ionicons name="checkmark-done-circle" size={40} color={ACCENT} />
            <Text style={[styles.modalTitle, { color: theme.color }]}>
              {t("save_session", lang)}
            </Text>
            {pendingSession ? (
              <Text style={[styles.modalInfo, { color: theme.subColor }]}>
                {getSuraName(sura, lang)}
                {" · "}
                {t("session_range", lang)}{" "}
                {isRTL
                  ? `${toArabicNum(Math.min(...pendingSession.markers.map((m) => m.aya)))}-${toArabicNum(Math.max(...pendingSession.markers.map((m) => m.aya)))}`
                  : `${Math.min(...pendingSession.markers.map((m) => m.aya))}-${Math.max(...pendingSession.markers.map((m) => m.aya))}`}
                {"\n"}
                {t("duration", lang)}: {formatDuration(pendingSession.durationMs)}
              </Text>
            ) : null}
            <View
              style={[
                styles.modalBtnRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: ACCENT }]}
                onPress={handleSaveSession}
              >
                <Text style={styles.modalBtnText}>{t("save", lang)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: "transparent", borderWidth: 1, borderColor: RECORDING_COLOR },
                ]}
                onPress={() => {
                  if (pendingSession) {
                    try {
                      const f = new File(pendingSession.uri);
                      if (f.exists) f.delete();
                    } catch {
                      // ignore
                    }
                  }
                  setPendingSession(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: RECORDING_COLOR }]}>
                  {t("discard", lang)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RoundBtn({
  icon,
  onPress,
  color,
  border,
  disabled,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
  border: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.roundBtn,
        {
          borderColor: active ? color : border,
          backgroundColor: active ? `${color}22` : "transparent",
          opacity: disabled ? 0.35 : 1,
        },
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  modeRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    justifyContent: "center",
  },
  modePill: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  modePillText: { fontSize: 13, fontWeight: "700" },
  versesContent: { paddingHorizontal: 16, paddingBottom: 12 },
  verseBlock: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
  },
  bismillah: {
    textAlign: "center",
    writingDirection: "rtl",
    marginVertical: 8,
  },
  verseText: {
    textAlign: "justify",
    writingDirection: "rtl",
  },
  recordedBadge: {
    position: "absolute",
    top: 6,
  },
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  helperRow: {
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 8,
  },
  roundBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  mainRow: { alignItems: "center", marginVertical: 2 },
  recordBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  captionRow: {
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  caption: { fontSize: 12 },
  timerSmall: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  tapHoldWrap: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  tapHoldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sessionStatusRow: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sessionTimerWrap: { alignItems: "center", gap: 6 },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RECORDING_COLOR,
  },
  timer: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  sessionBtnRow: {
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  stopBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stopBtnPlaceholder: { width: 52, height: 52 },
  nextAyahBtn: {
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nextAyahText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalInfo: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  modalBtnRow: { gap: 10, marginTop: 8 },
  modalBtn: {
    borderRadius: 10,
    paddingHorizontal: 26,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
