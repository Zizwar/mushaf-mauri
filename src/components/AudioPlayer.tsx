import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  type AudioStatus,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import { getAudioKsuUri } from "../utils/api";
import { getNextAya, getPrevAya, getPageBySuraAya } from "../utils/coordinates";
// @ts-ignore
import { QuranData } from "../data/quranData";
// @ts-ignore
import { listVoiceMoqri } from "../data/listAuthor";
import { getAyahText } from "../utils/ayahText";
import { saveRecording, getRecordingUri, createProfile, loadProfiles } from "../utils/recordings";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = "#4285f4";
const ACCENT_LIGHT = "#e8f0fe";
const RECORDING_COLOR = "#d32f2f";
const MINI_HEIGHT = 64;
const PROGRESS_HEIGHT = 3;
const USER_RECORDING_ID = "__user_recording__";

const TRANSLATION_KEYS = [
  "recite_hudhaify", "recite_husary", "recite_basfar", "recite_ayyoub",
  "recite_minshawy", "recite_abdul_basit", "recite_banna", "recite_tablawy",
  "recite_jaber", "recite_afasy", "recite_shaatree", "recite_qatami",
  "recite_khaleefa", "recite_salamah", "recite_jibreel", "recite_ghamadi",
  "recite_sudais", "recite_shuraym", "recite_maher", "recite_ajamy",
  "recite_juhanee", "recite_muhsin", "recite_abbad", "recite_yaser",
  "recite_rifai", "recite_ayman", "recite_moalim", "recite_mujawwad",
  "recite_warsh", "recite_ibrahim_dosary", "recite_yassin", "recite_user",
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AudioPlayerProps {
  onScrollToPage: (page: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AudioPlayer({ onScrollToPage }: AudioPlayerProps) {
  // -- expo-audio player & recorder (hooks manage lifecycle) --
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // -- Refs --
  const isUnmountedRef = useRef(false);
  const currentAyaRef = useRef<{ sura: number; aya: number } | null>(null);
  // Refs for values needed inside the didJustFinish listener
  const quiraRef = useRef(useAppStore.getState().quira);
  const moqriIdRef = useRef(useAppStore.getState().moqriId);
  const reciterNameRef = useRef("");
  const tekrarRef = useRef(useAppStore.getState().tekrar);

  // -- Local state --
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [listenThenRecord, setListenThenRecord] = useState(false);
  const listenThenRecordRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // -- Store --
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const moqriId = useAppStore((s) => s.moqriId);
  const selectedAya = useAppStore((s) => s.selectedAya);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const theme = useAppStore((s) => s.theme);
  const recordingState = useAppStore((s) => s.recordingState);
  const setMoqriId = useAppStore((s) => s.setMoqriId);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const setRecordingState = useAppStore((s) => s.setRecordingState);
  const markAyahRecorded = useAppStore((s) => s.markAyahRecorded);
  const tekrar = useAppStore((s) => s.tekrar);
  const setTekrar = useAppStore((s) => s.setTekrar);

  const isUserRecording = moqriId === USER_RECORDING_ID;

  // Keep refs in sync for listener access
  quiraRef.current = quira;
  moqriIdRef.current = moqriId;
  tekrarRef.current = tekrar;
  listenThenRecordRef.current = listenThenRecord;

  // -- Derived from status (replaces local state) --
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  // -- Derived theme values --
  const isDark = !!theme.night;
  const colors = useMemo(
    () => ({
      miniBar: isDark ? "#0d0d1a" : theme.backgroundColor || "#f5f5f0",
      miniText: isDark ? "#ffffff" : theme.color || "#1a1a2e",
      miniSecondary: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
      fullBg: isDark ? "#0d0d1a" : "#f8f9fa",
      fullText: isDark ? "#e8e8e8" : "#1a1a2e",
      fullSecondary: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
      fullCard: isDark ? "#1a1a2e" : "#ffffff",
      modalBg: isDark ? "#1a1a2e" : "#ffffff",
      modalText: isDark ? "#e8e8e8" : "#333333",
      modalBorder: isDark ? "rgba(255,255,255,0.08)" : "#eeeeee",
      accent: ACCENT,
      accentLight: isDark ? "rgba(66,133,244,0.2)" : ACCENT_LIGHT,
      progressTrack: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
      fullProgressTrack: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      sliderThumb: ACCENT,
    }),
    [isDark],
  );

  // -- Translations & reciters --
  const translations = useMemo(() => {
    const loc: Record<string, string> = {};
    for (const key of TRANSLATION_KEYS) {
      loc[key] = t(key, lang);
    }
    return loc;
  }, [lang]);

  const recordingProfiles = useAppStore((s) => s.recordingProfiles);

  const reciters: { id: string; voice: string; isProfile?: boolean }[] = useMemo(
    () => {
      const base = listVoiceMoqri(translations);
      // Insert recording profiles after the user recording entry
      if (recordingProfiles.length > 0) {
        const userIdx = base.findIndex((r: { id: string }) => r.id === USER_RECORDING_ID);
        const insertAt = userIdx >= 0 ? userIdx + 1 : 1;
        const profileEntries = recordingProfiles.map((p: { id: string; name: string }) => ({
          id: `__profile_${p.id}__`,
          voice: p.name,
          isProfile: true,
        }));
        return [
          ...base.slice(0, insertAt),
          ...profileEntries,
          ...base.slice(insertAt),
        ];
      }
      return base;
    },
    [translations, recordingProfiles],
  );

  const currentReciterName = useMemo(
    () => reciters.find((r) => r.id === moqriId)?.voice ?? moqriId,
    [reciters, moqriId],
  );
  reciterNameRef.current = currentReciterName;

  // -- Sura metadata --
  const suraData = selectedAya ? QuranData.Sura[selectedAya.sura] : null;
  const suraNameAr = suraData?.[0] ?? "";
  const suraNameEn = suraData?.[2] ?? "";
  const ayahText = selectedAya
    ? getAyahText(selectedAya.sura, selectedAya.aya, quira)
    : null;

  // ===========================================================================
  // Audio setup
  // ===========================================================================

  // Unmount guard
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      // Note: useAudioPlayer hook auto-releases the player on unmount
    };
  }, []);

  // Configure audio session once for background playback
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      allowsRecording: true,
      interruptionMode: "doNotMix",
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  // -- Helper: play a given sura/aya using current refs --
  const playAyaFromRef = useCallback((sura: number, aya: number, page: number) => {
    useAppStore.getState().setSelectedAya({
      sura, aya, page,
      id: `s${sura}a${aya}z`,
    });
    onScrollToPage(page);
    currentAyaRef.current = { sura, aya };

    const mid = moqriIdRef.current;
    const isUser = mid === USER_RECORDING_ID;
    const q = quiraRef.current;
    let uri: string | null;
    if (isUser) {
      const profileId = useAppStore.getState().activeProfileId;
      uri = profileId ? getRecordingUri(sura, aya, q, profileId) : null;
    } else {
      uri = getAudioKsuUri(mid, sura, aya);
    }

    if (uri) {
      player.replace({ uri });
      player.play();
      const sd = QuranData.Sura[sura];
      try { player.setActiveForLockScreen(true, {
        title: `${sd?.[0] ?? ""} - ${aya}`,
        artist: reciterNameRef.current,
      }, { showSeekForward: true, showSeekBackward: true }); } catch {}
    } else {
      useAppStore.getState().setIsPlaying(false);
    }
  }, [player, onScrollToPage]);

  // -- Auto-next listener: fires when current track finishes --
  useEffect(() => {
    const sub = player.addListener("playbackStatusUpdate", (s: AudioStatus) => {
      if (!s.didJustFinish || isUnmountedRef.current) return;

      const current = currentAyaRef.current;
      if (!current) {
        useAppStore.getState().setIsPlaying(false);
        return;
      }

      // Listen-then-record: when reciter finishes, auto-start recording
      if (listenThenRecordRef.current) {
        useAppStore.getState().setIsPlaying(false);
        // Small delay to let audio mode switch
        setTimeout(async () => {
          if (isUnmountedRef.current) return;
          try {
            const sa = useAppStore.getState().selectedAya;
            if (!sa) return;

            let profileId = useAppStore.getState().activeProfileId;
            const q = quiraRef.current;
            if (!profileId) {
              const profile = createProfile(q, "تسجيلي");
              profileId = profile.id;
              useAppStore.getState().setActiveProfileId(profileId);
              useAppStore.getState().setRecordingProfiles(loadProfiles(q));
            }

            const perm = await requestRecordingPermissionsAsync();
            if (!perm.granted) return;

            await setAudioModeAsync({
              playsInSilentMode: true,
              shouldPlayInBackground: true,
              allowsRecording: true,
              interruptionMode: "doNotMix",
              shouldRouteThroughEarpiece: false,
            });

            await recorder.prepareToRecordAsync();
            recorder.record();
            useAppStore.getState().setRecordingState("recording");
          } catch {
            // ignore
          }
        }, 300);
        return;
      }

      const q = quiraRef.current;
      const tk = tekrarRef.current;

      // -- Tekrar (repetition) mode --
      if (tk.active) {
        const atEnd =
          current.sura === tk.endSura && current.aya === tk.endAya;

        if (atEnd) {
          const nextRepeat = tk.currentRepeat + 1;
          if (nextRepeat < tk.repeatCount) {
            // More repeats to go - go back to start aya
            useAppStore.getState().setTekrar({ ...tk, currentRepeat: nextRepeat });
            const startPage = getPageBySuraAya(tk.startSura, tk.startAya, q);
            playAyaFromRef(tk.startSura, tk.startAya, startPage);
            return;
          } else {
            // All repeats done - stop
            useAppStore.getState().setTekrar({ ...tk, currentRepeat: 0, active: false });
            useAppStore.getState().setIsPlaying(false);
            try { player.clearLockScreenControls(); } catch {}
            return;
          }
        }

        // Not at end aya yet - advance to next aya within range
        const next = getNextAya(current.sura, current.aya, q);
        if (next) {
          playAyaFromRef(next.sura, next.aya, next.page);
        } else {
          useAppStore.getState().setTekrar({ ...tk, currentRepeat: 0, active: false });
          useAppStore.getState().setIsPlaying(false);
          try { player.clearLockScreenControls(); } catch {}
        }
        return;
      }

      // -- Normal mode (no tekrar) --
      const next = getNextAya(current.sura, current.aya, q);
      if (!next) {
        useAppStore.getState().setIsPlaying(false);
        try { player.clearLockScreenControls(); } catch {}
        return;
      }

      playAyaFromRef(next.sura, next.aya, next.page);
    });
    return () => sub.remove();
  }, [player, playAyaFromRef]);

  // ===========================================================================
  // Play a specific aya
  // ===========================================================================
  const playAya = useCallback(
    (sura: number, aya: number, _page: number) => {
      currentAyaRef.current = { sura, aya };

      let uri: string | null;

      if (isUserRecording) {
        const profileId = useAppStore.getState().activeProfileId;
        if (!profileId) return;
        uri = getRecordingUri(sura, aya, quira, profileId);
        if (!uri) return;
      } else {
        uri = getAudioKsuUri(moqriId, sura, aya);
      }

      player.replace({ uri });
      player.play();
      setIsPlaying(true);

      // Lock screen controls for background playback
      const sd = QuranData.Sura[sura];
      try { player.setActiveForLockScreen(true, {
        title: `${sd?.[0] ?? ""} - ${aya}`,
        artist: currentReciterName,
      }, { showSeekForward: true, showSeekBackward: true }); } catch {}
    },
    [player, moqriId, quira, isUserRecording, setIsPlaying, currentReciterName],
  );

  // -- Handle pending play requests (from action modal, etc.) --
  const pendingPlayAya = useAppStore((s) => s.pendingPlayAya);
  useEffect(() => {
    if (pendingPlayAya) {
      useAppStore.getState().setPendingPlayAya(null);
      playAya(pendingPlayAya.sura, pendingPlayAya.aya, pendingPlayAya.page);
    }
  }, [pendingPlayAya, playAya]);

  // ===========================================================================
  // Recording helpers
  // ===========================================================================
  const startRecording = useCallback(async () => {
    if (!selectedAya) return;

    // Ensure active profile exists
    let profileId = useAppStore.getState().activeProfileId;
    if (!profileId) {
      const profile = createProfile(quira, t("recite_user", lang));
      profileId = profile.id;
      useAppStore.getState().setActiveProfileId(profileId);
      useAppStore.getState().setRecordingProfiles(loadProfiles(quira));
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("mic_permission", lang), t("mic_permission_msg", lang));
        return;
      }

      // Stop playback if any
      player.pause();
      setIsPlaying(false);

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        allowsRecording: true,
        interruptionMode: "doNotMix",
        shouldRouteThroughEarpiece: false,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingState("recording");
    } catch {
      setRecordingState("idle");
    }
  }, [selectedAya, lang, quira, player, recorder, setIsPlaying, setRecordingState]);

  const stopRecording = useCallback(async () => {
    if (!selectedAya) return;

    const wasListenThenRecord = listenThenRecord;
    setListenThenRecord(false);
    setRecordingState("saving");
    try {
      await recorder.stop();
      const uri = recorder.uri;

      if (uri) {
        const profileId = useAppStore.getState().activeProfileId;
        if (profileId) {
          saveRecording(uri, selectedAya.sura, selectedAya.aya, quira, profileId);
          markAyahRecorded(selectedAya.sura, selectedAya.aya);
        }
      }

      setRecordingState("idle");

      // Auto-advance to next ayah
      const next = getNextAya(selectedAya.sura, selectedAya.aya, quira);
      if (next) {
        setSelectedAya({
          sura: next.sura,
          aya: next.aya,
          page: next.page,
          id: `s${next.sura}a${next.aya}z`,
        });
        onScrollToPage(next.page);
      }
    } catch {
      setRecordingState("idle");
    }
  }, [selectedAya, quira, recorder, listenThenRecord, setRecordingState, markAyahRecorded, setSelectedAya, onScrollToPage]);

  const handleMicPress = useCallback(() => {
    if (recordingState === "recording") {
      stopRecording();
    } else if (recordingState === "idle") {
      startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  // Listen-then-record: play the reciter first, then auto-start recording
  const handleListenThenRecord = useCallback(() => {
    if (!selectedAya || recordingState === "recording") return;

    // If currently in listen-then-record mode and playing, stop
    if (listenThenRecord && status.playing) {
      player.pause();
      setIsPlaying(false);
      setListenThenRecord(false);
      return;
    }

    // Start by playing the reciter's version
    setListenThenRecord(true);

    // Use the store's moqriId (or default to Husary if user recording is selected)
    const reciterId = moqriId === USER_RECORDING_ID ? "Husary_64kbps" : moqriId;
    const uri = getAudioKsuUri(reciterId, selectedAya.sura, selectedAya.aya);

    currentAyaRef.current = { sura: selectedAya.sura, aya: selectedAya.aya };
    player.replace({ uri });
    player.play();
    setIsPlaying(true);
  }, [selectedAya, recordingState, listenThenRecord, status.playing, moqriId, player, setIsPlaying]);

  // ===========================================================================
  // Playback controls
  // ===========================================================================
  const handlePlayPause = useCallback(() => {
    if (!selectedAya) return;
    if (status.playing) {
      player.pause();
      setIsPlaying(false);
    } else if (status.isLoaded && status.currentTime > 0) {
      // Resume existing playback
      player.play();
      setIsPlaying(true);
    } else {
      // Start fresh
      playAya(selectedAya.sura, selectedAya.aya, selectedAya.page);
    }
  }, [selectedAya, status.playing, status.isLoaded, status.currentTime, player, setIsPlaying, playAya]);

  const handleNext = useCallback(() => {
    if (!selectedAya) return;
    const next = getNextAya(selectedAya.sura, selectedAya.aya, quira);
    if (!next) return;
    setSelectedAya({
      sura: next.sura,
      aya: next.aya,
      page: next.page,
      id: `s${next.sura}a${next.aya}z`,
    });
    onScrollToPage(next.page);
    if (isPlaying) {
      playAya(next.sura, next.aya, next.page);
    }
  }, [selectedAya, quira, isPlaying, setSelectedAya, onScrollToPage, playAya]);

  const handlePrev = useCallback(() => {
    if (!selectedAya) return;
    const prev = getPrevAya(selectedAya.sura, selectedAya.aya, quira);
    if (!prev) return;
    setSelectedAya({
      sura: prev.sura,
      aya: prev.aya,
      page: prev.page,
      id: `s${prev.sura}a${prev.aya}z`,
    });
    onScrollToPage(prev.page);
    if (isPlaying) {
      playAya(prev.sura, prev.aya, prev.page);
    }
  }, [selectedAya, quira, isPlaying, setSelectedAya, onScrollToPage, playAya]);

  const handleStop = useCallback(() => {
    player.pause();
    player.replace(null);
    try { player.clearLockScreenControls(); } catch {}
    setIsPlaying(false);
    setSelectedAya(null);
  }, [player, setIsPlaying, setSelectedAya]);

  // -- Seek on progress bar tap (full player) --
  const handleSeek = useCallback(
    async (fraction: number) => {
      if (status.duration <= 0) return;
      await player.seekTo(fraction * status.duration);
    },
    [player, status.duration],
  );

  // -- Reciter change --
  const handleReciterChange = useCallback(
    (id: string) => {
      setMoqriId(id);
      setShowReciterModal(false);
      // Always stop current audio and replay with new reciter
      if (selectedAya) {
        player.pause();
        // Use `id` directly instead of `moqriId` from store (stale closure)
        const isUser = id === USER_RECORDING_ID;
        let uri: string | null;
        if (isUser) {
          const profileId = useAppStore.getState().activeProfileId;
          if (!profileId) return;
          uri = getRecordingUri(selectedAya.sura, selectedAya.aya, quira, profileId);
          if (!uri) return;
        } else {
          uri = getAudioKsuUri(id, selectedAya.sura, selectedAya.aya);
        }
        currentAyaRef.current = { sura: selectedAya.sura, aya: selectedAya.aya };
        player.replace({ uri });
        player.play();
        setIsPlaying(true);
        const sd = QuranData.Sura[selectedAya.sura];
        const name = reciters.find((r) => r.id === id)?.voice ?? id;
        try { player.setActiveForLockScreen(true, {
          title: `${sd?.[0] ?? ""} - ${selectedAya.aya}`,
          artist: name,
        }, { showSeekForward: true, showSeekBackward: true }); } catch {}
      }
    },
    [selectedAya, quira, player, setMoqriId, setIsPlaying, reciters],
  );

  // ===========================================================================
  // Full player open/close animation
  // ===========================================================================
  const openFullPlayer = useCallback(() => {
    setShowFullPlayer(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const closeFullPlayer = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFullPlayer(false);
    });
  }, [slideAnim]);

  // ===========================================================================
  // Time formatting (seconds input)
  // ===========================================================================
  const formatTime = (sec: number): string => {
    const totalSec = Math.floor(sec);
    const min = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${min}:${s < 10 ? "0" : ""}${s}`;
  };

  // ===========================================================================
  // Render nothing if no aya selected
  // ===========================================================================
  if (!selectedAya) return null;

  // ===========================================================================
  // Mini Player
  // ===========================================================================
  const renderMiniPlayer = () => (
    <View style={[styles.miniContainer, { backgroundColor: colors.miniBar }]}>
      {/* Progress bar at very top of mini player */}
      <View style={[styles.miniProgressTrack, { backgroundColor: colors.progressTrack }]}>
        <View
          style={[
            styles.miniProgressFill,
            {
              backgroundColor: recordingState === "recording" ? RECORDING_COLOR : colors.accent,
              width: `${Math.min(progress * 100, 100)}%` as any,
            },
          ]}
        />
      </View>

      <View style={styles.miniContent}>
        {/* Left: Sura info */}
        <View style={styles.miniInfo}>
          <Text style={[styles.miniSuraName, { color: colors.miniText }]} numberOfLines={1}>
            {suraNameAr}
            {recordingState === "recording" && (
              <Text style={{ color: RECORDING_COLOR }}> ● </Text>
            )}
          </Text>
          <Text style={[styles.miniAyaNumber, { color: colors.miniSecondary }]} numberOfLines={1}>
            {t("aya_s", lang)} {selectedAya.aya}
          </Text>
        </View>

        {/* Center: Controls */}
        <View style={styles.miniControls}>
          <Pressable
            onPress={handlePrev}
            hitSlop={8}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="play-skip-back" size={20} color={colors.miniText} />
          </Pressable>

          <Pressable
            onPress={handlePlayPause}
            hitSlop={4}
            style={({ pressed }) => [styles.miniPlayBtn, pressed && styles.btnPressed]}
          >
            {status.isBuffering ? (
              <Ionicons name="hourglass-outline" size={28} color={colors.accent} />
            ) : (
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={38}
                color={colors.accent}
              />
            )}
          </Pressable>

          <Pressable
            onPress={handleNext}
            hitSlop={8}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="play-skip-forward" size={20} color={colors.miniText} />
          </Pressable>
        </View>

        {/* Right: Reciter + Expand */}
        <View style={styles.miniActions}>
          <Pressable
            onPress={() => setShowReciterModal(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="mic-outline" size={20} color={colors.miniSecondary} />
          </Pressable>
          <Pressable
            onPress={openFullPlayer}
            hitSlop={8}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="chevron-up" size={20} color={colors.miniSecondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  // ===========================================================================
  // Full Player (Modal)
  // ===========================================================================
  const renderFullPlayer = () => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_HEIGHT, 0],
    });

    return (
      <Modal
        visible={showFullPlayer}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={closeFullPlayer}
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
              onPress={closeFullPlayer}
              hitSlop={12}
              style={({ pressed }) => [styles.fullHeaderBtn, pressed && styles.btnPressed]}
            >
              <Ionicons name="chevron-down" size={28} color={colors.fullText} />
            </Pressable>
            <Text style={[styles.fullHeaderTitle, { color: colors.fullSecondary }]}>
              {t("telawa", lang)}
            </Text>
            <Pressable
              onPress={handleStop}
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
              <Text style={[styles.fullSuraName, { color: colors.fullText }]}>
                {suraNameAr}
              </Text>
              <Text style={[styles.fullSuraNameEn, { color: colors.fullSecondary }]}>
                {suraNameEn}
              </Text>
              <View style={styles.fullAyaBadge}>
                <Text style={styles.fullAyaBadgeText}>
                  {t("aya_s", lang)} {selectedAya.aya}
                </Text>
              </View>
              <Text
                style={[styles.fullPageInfo, { color: colors.fullSecondary }]}
              >
                {t("page", lang)} {selectedAya.page}
              </Text>
              {ayahText ? (
                <ScrollView style={styles.fullAyahScroll} nestedScrollEnabled>
                  <Text
                    style={[styles.fullAyahText, { color: colors.fullText }]}
                  >
                    {ayahText}
                  </Text>
                </ScrollView>
              ) : null}
            </View>
          </View>

          {/* Reciter name (tappable) */}
          <Pressable
            onPress={() => setShowReciterModal(true)}
            style={({ pressed }) => [
              styles.fullReciterRow,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="mic-outline" size={18} color={colors.accent} />
            <Text
              style={[styles.fullReciterName, { color: colors.fullText }]}
              numberOfLines={1}
            >
              {currentReciterName}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.fullSecondary} />
          </Pressable>

          {/* Progress Slider */}
          <View style={styles.fullProgressSection}>
            <Pressable
              style={[
                styles.fullProgressTrack,
                { backgroundColor: colors.fullProgressTrack },
              ]}
              onPress={(e) => {
                const fraction = e.nativeEvent.locationX / (SCREEN_WIDTH - 48);
                handleSeek(Math.max(0, Math.min(1, fraction)));
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
              onPress={handlePrev}
              hitSlop={12}
              style={({ pressed }) => [styles.fullSideBtn, pressed && styles.btnPressed]}
            >
              <Ionicons name="play-skip-back" size={32} color={colors.fullText} />
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
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
              onPress={handleNext}
              hitSlop={12}
              style={({ pressed }) => [styles.fullSideBtn, pressed && styles.btnPressed]}
            >
              <Ionicons name="play-skip-forward" size={32} color={colors.fullText} />
            </Pressable>
          </View>

          {/* Recording buttons in full player */}
          <View style={styles.recordSection}>
            <View style={styles.recordButtonRow}>
              {/* Standard record button */}
              <Pressable
                onPress={handleMicPress}
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
                    {
                      color:
                        recordingState === "recording"
                          ? "#fff"
                          : colors.fullText,
                    },
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
                onPress={handleListenThenRecord}
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
                    {
                      color: listenThenRecord ? "#fff" : colors.fullText,
                      fontSize: 12,
                    },
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
  };

  // ===========================================================================
  // Reciter Selection Modal
  // ===========================================================================
  const renderReciterModal = () => (
    <Modal
      visible={showReciterModal}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={() => setShowReciterModal(false)}
    >
      <View style={styles.reciterModalOverlay}>
        <View
          style={[
            styles.reciterModalContent,
            {
              backgroundColor: colors.modalBg,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.reciterModalHandle}>
            <View
              style={[
                styles.reciterModalHandleBar,
                { backgroundColor: colors.modalBorder },
              ]}
            />
          </View>

          {/* Title */}
          <Text style={[styles.reciterModalTitle, { color: colors.modalText }]}>
            {t("chooseQaree", lang)}
          </Text>

          {/* Reciter list */}
          <FlatList
            data={reciters}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reciterListContent}
            renderItem={({ item }) => {
              const isActive = moqriId === item.id;
              const isUser = item.id === USER_RECORDING_ID;
              const isProfile = !!(item as any).isProfile;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.reciterItem,
                    {
                      borderBottomColor: colors.modalBorder,
                      backgroundColor: isActive
                        ? colors.accentLight
                        : pressed
                        ? colors.accentLight
                        : "transparent",
                    },
                    isProfile && {
                      borderLeftWidth: 3,
                      borderLeftColor: "#e91e63",
                    },
                  ]}
                  onPress={() => handleReciterChange(item.id)}
                >
                  <View style={styles.reciterItemContent}>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.accent}
                        style={styles.reciterCheckIcon}
                      />
                    )}
                    {isUser && !isActive && (
                      <Ionicons
                        name="mic"
                        size={18}
                        color={RECORDING_COLOR}
                        style={styles.reciterCheckIcon}
                      />
                    )}
                    {isProfile && !isActive && (
                      <Ionicons
                        name="person-circle-outline"
                        size={18}
                        color="#e91e63"
                        style={styles.reciterCheckIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.reciterItemText,
                        { color: colors.modalText },
                        isActive && {
                          color: colors.accent,
                          fontWeight: "700",
                        },
                        isUser && !isActive && {
                          color: RECORDING_COLOR,
                          fontWeight: "600",
                        },
                        isProfile && !isActive && {
                          color: "#e91e63",
                          fontWeight: "600",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.voice}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />

          {/* Close button */}
          <Pressable
            style={[
              styles.reciterModalClose,
              { borderTopColor: colors.modalBorder },
            ]}
            onPress={() => setShowReciterModal(false)}
          >
            <Text style={[styles.reciterModalCloseText, { color: colors.accent }]}>
              {t("close", lang)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // ===========================================================================
  // Main render
  // ===========================================================================
  return (
    <>
      {renderMiniPlayer()}
      {renderFullPlayer()}
      {renderReciterModal()}
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  // ---------- Mini Player ----------
  miniContainer: {
    height: MINI_HEIGHT + PROGRESS_HEIGHT,
    paddingBottom: Platform.OS === "ios" ? 16 : 0,
  },
  miniProgressTrack: {
    height: PROGRESS_HEIGHT,
    width: "100%",
  },
  miniProgressFill: {
    height: "100%",
    borderRadius: PROGRESS_HEIGHT / 2,
  },
  miniContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  miniInfo: {
    flex: 1,
    marginRight: 8,
  },
  miniSuraName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  miniAyaNumber: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  miniControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  miniPlayBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  miniActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 2,
  },
  btnPressed: {
    opacity: 0.5,
  },

  // ---------- Full Player ----------
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

  // Sura display
  fullSuraSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  fullSuraCard: {
    width: SCREEN_WIDTH - 64,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  fullSuraName: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  fullSuraNameEn: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 20,
    textAlign: "center",
  },
  fullAyaBadge: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  fullAyaBadgeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  fullPageInfo: {
    fontSize: 13,
    fontWeight: "500",
  },
  fullAyahScroll: {
    maxHeight: 130,
    marginTop: 12,
  },
  fullAyahText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: "center",
    writingDirection: "rtl",
    paddingHorizontal: 12,
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
  },

  // Reciter row
  fullReciterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  fullReciterName: {
    fontSize: 15,
    fontWeight: "600",
    maxWidth: SCREEN_WIDTH * 0.6,
  },

  // Progress
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

  // Transport controls
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

  // Record section
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

  // ---------- Reciter Modal ----------
  reciterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  reciterModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingTop: 8,
  },
  reciterModalHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  reciterModalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  reciterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  reciterListContent: {
    paddingBottom: 8,
  },
  reciterItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reciterItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  reciterCheckIcon: {
    marginRight: 10,
  },
  reciterItemText: {
    fontSize: 16,
    flex: 1,
    textAlign: "right",
  },
  reciterModalClose: {
    padding: 18,
    alignItems: "center",
    borderTopWidth: 1,
  },
  reciterModalCloseText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
