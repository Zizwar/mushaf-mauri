import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  Image,
} from "react-native";
import FullPlayerModal from "./player/FullPlayerModal";
import ReciterModal from "./player/ReciterModal";
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
import { warshToHafsAyahs } from "../utils/tafsir";
import { saveRecording, getRecordingUri, createProfile, loadProfiles } from "../utils/recordings";
import * as WarshEngine from "../utils/warshAudioEngine";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = "#4285f4";
const ACCENT_LIGHT = "#e8f0fe";
const RECORDING_COLOR = "#d32f2f";
const MINI_HEIGHT = 64;
const PROGRESS_HEIGHT = 3;
const USER_RECORDING_ID = "__user_recording__";
// App icon for lock screen / notification artwork
const APP_ICON_URL = Image.resolveAssetSource(require("../../assets/icon.png"))?.uri ?? "";

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

  const warshRecitorId = useAppStore((s) => s.warshRecitorId);
  const quranFont = useAppStore((s) => s.quranFont);
  const warshRecitorIdRef = useRef(warshRecitorId);

  const isUserRecording = moqriId === USER_RECORDING_ID;
  const isWarshDbMode = quira === "warsh" && (moqriId === "__warsh_db_1__" || moqriId === "__warsh_db_2__");
  const isWarshCdnMode = quira === "warsh" && moqriId.startsWith("warsh_");

  // Queue of pending Hafs ayah URIs when a Warsh CDN merged ayah plays
  const warshCdnQueueRef = useRef<string[]>([]);

  // Keep refs in sync for listener access
  quiraRef.current = quira;
  moqriIdRef.current = moqriId;
  warshRecitorIdRef.current = warshRecitorId;
  tekrarRef.current = tekrar;
  listenThenRecordRef.current = listenThenRecord;

  // Warsh pending seek: after loading a new file, seek to the target verse once duration is known
  const warshPendingSeekRef = useRef<{ sura: number; aya: number } | null>(null);

  // -- Derived from status (replaces local state) --
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  // -- Derived theme values --
  const isDark = !!theme.night;
  const colors = useMemo(
    () => ({
      miniBar: theme.backgroundColor,
      miniText: isDark ? "#ffffff" : theme.color,
      miniSecondary: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
      fullBg: theme.backgroundColor,
      fullText: isDark ? "#e8e8e8" : theme.color,
      fullSecondary: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
      fullCard: isDark ? "#1a1a2e" : theme.backgroundColor,
      modalBg: isDark ? "#1a1a2e" : theme.backgroundColor,
      modalText: isDark ? "#e8e8e8" : theme.color,
      modalBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      accent: ACCENT,
      accentLight: isDark ? "rgba(66,133,244,0.2)" : ACCENT_LIGHT,
      progressTrack: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
      fullProgressTrack: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      sliderThumb: ACCENT,
      buttonBg: theme.borderColor,
    }),
    [isDark, theme],
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

  const reciters: { id: string; voice: string; isProfile?: boolean; type?: string }[] = useMemo(
    () => {
      const all = listVoiceMoqri(translations);
      // Filter by mushaf type:
      // - Warsh mode: user recording + DB reciters + separator + CDN reciters
      // - Hafs mode: show user recording + all non-warsh reciters
      let base: typeof all;
      if (quira === "warsh") {
        const dbReciters = all.filter((r: { id: string; type?: string }) =>
          r.id === USER_RECORDING_ID || r.type === "warsh_db"
        );
        const cdnReciters = all.filter((r: { type?: string }) => r.type === "warsh_cdn");
        if (cdnReciters.length > 0) {
          base = [
            ...dbReciters,
            { id: "__separator__", voice: "", type: "separator" },
            ...cdnReciters,
          ];
        } else {
          base = dbReciters;
        }
      } else {
        base = all.filter((r: { id: string; type?: string }) =>
          r.type !== "warsh_db" && r.type !== "warsh_cdn"
        );
      }

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
    [translations, recordingProfiles, quira],
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

  const [ayahText, setAyahText] = useState<string | null>(null);
  useEffect(() => {
    if (selectedAya) {
      getAyahText(selectedAya.sura, selectedAya.aya, quira).then(setAyahText);
    } else {
      setAyahText(null);
    }
  }, [selectedAya?.sura, selectedAya?.aya, quira]);

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

  // Initialize Warsh engine + callbacks
  useEffect(() => {
    if (quira === "warsh") {
      WarshEngine.initWarshEngine().catch(() => {});
      WarshEngine.setCallbacks(
        // onVerseChange
        (v) => {
          const store = useAppStore.getState();
          const sel = store.selectedAya;
          // DB pageNum is 2-639, app pages are 1-638 → offset -1
          const appPage = v.pageNum - 1;
          if (!sel || sel.sura !== v.suraID || sel.aya !== v.ayaNum) {
            store.setSelectedAya({
              sura: v.suraID,
              aya: v.ayaNum,
              page: appPage,
              id: `s${v.suraID}a${v.ayaNum}z`,
            });
            currentAyaRef.current = { sura: v.suraID, aya: v.ayaNum };
            if (sel && sel.page !== appPage) {
              onScrollToPage(appPage);
            }
          }
        },
        // onFinished (no-op; didJustFinish listener handles it)
        () => {}
      );
    }
    return () => {
      WarshEngine.stopWarsh();
    };
  }, [quira, onScrollToPage]);

  // Warsh: once duration is available and we have a pending seek, compute and seek
  useEffect(() => {
    if (!isWarshDbMode || !warshPendingSeekRef.current) return;
    if (status.isLoaded && status.duration > 0) {
      WarshEngine.setDuration(status.duration);
      const { sura, aya } = warshPendingSeekRef.current;
      warshPendingSeekRef.current = null;
      const seekTime = WarshEngine.computeSeekTime(sura, aya);
      if (seekTime > 0) {
        player.seekTo(seekTime);
      }
    }
  }, [isWarshDbMode, status.isLoaded, status.duration, player]);

  // Warsh: track verse position based on currentTime
  useEffect(() => {
    if (!isWarshDbMode || !status.playing || status.duration <= 0) return;
    WarshEngine.updatePosition(status.currentTime);
  }, [isWarshDbMode, status.currentTime, status.playing, status.duration]);

  // Reset recitor folder cache when warshRecitorId changes
  useEffect(() => {
    WarshEngine.resetRecitorCache();
  }, [warshRecitorId]);

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
    const q = quiraRef.current;

    // Warsh DB mode: use hook player with WarshEngine data
    if (q === "warsh" && (mid === "__warsh_db_1__" || mid === "__warsh_db_2__")) {
      WarshEngine.getWarshPlayInfo(sura, aya, page, warshRecitorIdRef.current).then((info) => {
        if (!info) {
          useAppStore.getState().setIsPlaying(false);
          return;
        }
        if (info.isNewFile) {
          warshPendingSeekRef.current = { sura, aya };
          player.replace({ uri: info.uri });
          player.play();
        } else {
          // Same file - just seek
          if (WarshEngine.getTotalDuration() > 0) {
            const seekTime = WarshEngine.computeSeekTime(sura, aya);
            player.seekTo(seekTime);
            if (!player.playing) player.play();
          }
        }
      });
      return;
    }

    // Warsh CDN mode: map Warsh ayah to Hafs ayah(s) for audio URL
    if (q === "warsh" && mid.startsWith("warsh_")) {
      const hafsAyahs = warshToHafsAyahs(sura, aya);
      warshCdnQueueRef.current = hafsAyahs.slice(1).map(h => getAudioKsuUri(mid, sura, h));
      const uri = getAudioKsuUri(mid, sura, hafsAyahs[0]);
      player.replace({ uri });
      player.play();
      return;
    }

    const isUser = mid === USER_RECORDING_ID;
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
        artworkUrl: APP_ICON_URL,
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

      // Warsh CDN queue: play next queued merged ayah audio before advancing
      if (warshCdnQueueRef.current.length > 0) {
        const queuedUri = warshCdnQueueRef.current.shift()!;
        player.replace({ uri: queuedUri });
        player.play();
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
      const mid = moqriIdRef.current;

      // -- Warsh DB mode: auto-advance to next file --
      if (q === "warsh" && (mid === "__warsh_db_1__" || mid === "__warsh_db_2__")) {
        const dbId = mid === "__warsh_db_1__" ? 1 : 2;
        WarshEngine.getNextFileInfo(dbId).then((nextInfo) => {
          if (nextInfo) {
            const firstV = WarshEngine.getFirstVerse();
            if (firstV) {
              warshPendingSeekRef.current = { sura: firstV.suraID, aya: firstV.ayaNum };
            }
            player.replace({ uri: nextInfo.uri });
            player.play();
          } else {
            useAppStore.getState().setIsPlaying(false);
            try { player.clearLockScreenControls(); } catch {}
          }
        });
        return;
      }

      const tk = tekrarRef.current;

      // -- Tekrar (repetition) mode --
      if (tk.active) {
        // 1. Per-ayah repeat: replay the current aya if more ayah-repeats remain
        const nextAyahRepeat = tk.currentAyahRepeat + 1;
        if (nextAyahRepeat < tk.ayahRepeat) {
          useAppStore.getState().setTekrar({ ...tk, currentAyahRepeat: nextAyahRepeat });
          playAyaFromRef(current.sura, current.aya, current.page);
          return;
        }

        // Ayah repeats exhausted - reset ayah counter and check range progress
        const atEnd =
          current.sura === tk.endSura && current.aya === tk.endAya;

        if (atEnd) {
          const nextRepeat = tk.currentRepeat + 1;
          if (nextRepeat < tk.repeatCount) {
            // More full-range repeats - go back to start aya
            useAppStore.getState().setTekrar({ ...tk, currentRepeat: nextRepeat, currentAyahRepeat: 0 });
            const startPage = getPageBySuraAya(tk.startSura, tk.startAya, q);
            playAyaFromRef(tk.startSura, tk.startAya, startPage);
            return;
          } else {
            // All repeats done - stop
            useAppStore.getState().setTekrar({ ...tk, currentRepeat: 0, currentAyahRepeat: 0, active: false });
            useAppStore.getState().setIsPlaying(false);
            try { player.clearLockScreenControls(); } catch {}
            return;
          }
        }

        // Not at end aya yet - advance to next aya within range
        const next = getNextAya(current.sura, current.aya, q);
        if (next) {
          useAppStore.getState().setTekrar({ ...tk, currentAyahRepeat: 0 });
          playAyaFromRef(next.sura, next.aya, next.page);
        } else {
          useAppStore.getState().setTekrar({ ...tk, currentRepeat: 0, currentAyahRepeat: 0, active: false });
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

      // Warsh DB mode: use hook player with WarshEngine data
      if (isWarshDbMode) {
        WarshEngine.getWarshPlayInfo(sura, aya, _page, warshRecitorId).then((info) => {
          if (!info) return;
          if (info.isNewFile) {
            warshPendingSeekRef.current = { sura, aya };
            player.replace({ uri: info.uri });
            player.play();
          } else {
            if (WarshEngine.getTotalDuration() > 0) {
              const seekTime = WarshEngine.computeSeekTime(sura, aya);
              player.seekTo(seekTime);
              if (!player.playing) player.play();
            }
          }
          setIsPlaying(true);
        });
        return;
      }

      // Warsh CDN mode: map Warsh ayah to Hafs ayah(s) for audio URL
      if (isWarshCdnMode) {
        const hafsAyahs = warshToHafsAyahs(sura, aya);
        warshCdnQueueRef.current = hafsAyahs.slice(1).map(h => getAudioKsuUri(moqriId, sura, h));
        const mappedUri = getAudioKsuUri(moqriId, sura, hafsAyahs[0]);
        player.replace({ uri: mappedUri });
        player.play();
        setIsPlaying(true);
        const sd = QuranData.Sura[sura];
        try { player.setActiveForLockScreen(true, {
          title: `${sd?.[0] ?? ""} - ${aya}`,
          artist: currentReciterName,
          artworkUrl: APP_ICON_URL,
        }, { showSeekForward: true, showSeekBackward: true }); } catch {}
        return;
      }

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
        artworkUrl: APP_ICON_URL,
      }, { showSeekForward: true, showSeekBackward: true }); } catch {}
    },
    [player, moqriId, quira, isUserRecording, isWarshDbMode, isWarshCdnMode, warshRecitorId, setIsPlaying, currentReciterName],
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
      // Check if selectedAya changed since last play — if so, play the new ayah
      const cur = currentAyaRef.current;
      if (cur && (cur.sura !== selectedAya.sura || cur.aya !== selectedAya.aya)) {
        playAya(selectedAya.sura, selectedAya.aya, selectedAya.page);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } else {
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
    WarshEngine.stopWarsh();
    player.pause();
    player.replace(null);
    try { player.clearLockScreenControls(); } catch {}
    setIsPlaying(false);
    setSelectedAya(null);
  }, [player, setIsPlaying, setSelectedAya]);

  // -- Seek on progress bar tap (full player) --
  const handleSeek = useCallback(
    async (fraction: number) => {
      if (isWarshDbMode && WarshEngine.getTotalDuration() > 0) {
        await player.seekTo(fraction * WarshEngine.getTotalDuration());
        return;
      }
      if (status.duration <= 0) return;
      await player.seekTo(fraction * status.duration);
    },
    [player, status.duration, isWarshDbMode],
  );

  // -- Reciter change --
  const handleReciterChange = useCallback(
    (id: string) => {
      // Handle Warsh DB reciters
      if (id === "__warsh_db_1__" || id === "__warsh_db_2__") {
        const dbId = id === "__warsh_db_1__" ? 1 : 2;
        useAppStore.getState().setWarshRecitorId(dbId);
        WarshEngine.resetRecitorCache();
        setMoqriId(id);
        setShowReciterModal(false);
        // Stop current & play with hook player via WarshEngine data
        if (selectedAya) {
          player.pause();
          WarshEngine.stopWarsh();
          WarshEngine.getWarshPlayInfo(
            selectedAya.sura, selectedAya.aya, selectedAya.page, dbId
          ).then((info) => {
            if (!info) return;
            warshPendingSeekRef.current = { sura: selectedAya.sura, aya: selectedAya.aya };
            player.replace({ uri: info.uri });
            player.play();
            setIsPlaying(true);
          });
        }
        return;
      }

      // Handle Warsh CDN reciters
      if (id.startsWith("warsh_")) {
        WarshEngine.stopWarsh();
        setMoqriId(id);
        setShowReciterModal(false);
        if (selectedAya) {
          player.pause();
          currentAyaRef.current = { sura: selectedAya.sura, aya: selectedAya.aya };
          const hafsAyahs = warshToHafsAyahs(selectedAya.sura, selectedAya.aya);
          warshCdnQueueRef.current = hafsAyahs.slice(1).map(h => getAudioKsuUri(id, selectedAya.sura, h));
          const uri = getAudioKsuUri(id, selectedAya.sura, hafsAyahs[0]);
          player.replace({ uri });
          player.play();
          setIsPlaying(true);
          const sd = QuranData.Sura[selectedAya.sura];
          const name = reciters.find((r) => r.id === id)?.voice ?? id;
          try { player.setActiveForLockScreen(true, {
            title: `${sd?.[0] ?? ""} - ${selectedAya.aya}`,
            artist: name,
            artworkUrl: APP_ICON_URL,
          }, { showSeekForward: true, showSeekBackward: true }); } catch {}
        }
        return;
      }

      // Stop Warsh engine if switching away from it
      WarshEngine.stopWarsh();

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
          artworkUrl: APP_ICON_URL,
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
  // Render nothing if no aya selected
  // ===========================================================================
  if (!selectedAya) return null;

  // ===========================================================================
  // Mini Player
  // ===========================================================================
  const renderMiniPlayer = () => (
    <View style={[styles.miniContainer, { backgroundColor: colors.miniBar }]}>
      {/* Tekrar mode indicator bar */}
      {tekrar.active && (
        <View style={styles.tekrarBar}>
          <Ionicons name="repeat" size={14} color="#fff" />
          <Text style={styles.tekrarBarText}>
            {t("tekrar_mode", lang)}
            {"  "}
            <Text style={styles.tekrarBarCounter}>
              {tekrar.ayahRepeat > 1 ? `×${tekrar.ayahRepeat} ` : ""}
              {tekrar.repeatCount > 1 ? `(${tekrar.currentRepeat + 1}/${tekrar.repeatCount})` : ""}
            </Text>
          </Text>
          <Pressable
            onPress={() => {
              useAppStore.getState().setTekrar({
                ...tekrar,
                active: false,
                currentRepeat: 0,
                currentAyahRepeat: 0,
              });
            }}
            hitSlop={8}
            style={styles.tekrarBarClose}
          >
            <Ionicons name="close-circle" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
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
  // Main render
  // ===========================================================================
  return (
    <>
      {renderMiniPlayer()}
      <FullPlayerModal
        visible={showFullPlayer}
        slideAnim={slideAnim}
        colors={colors}
        isDark={isDark}
        lang={lang}
        suraNameAr={suraNameAr}
        suraNameEn={suraNameEn}
        quranFont={quranFont}
        ayahText={ayahText}
        selectedAya={selectedAya}
        currentReciterName={currentReciterName}
        status={status}
        isPlaying={isPlaying}
        recordingState={recordingState}
        listenThenRecord={listenThenRecord}
        progress={progress}
        onClose={closeFullPlayer}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onMicPress={handleMicPress}
        onListenThenRecord={handleListenThenRecord}
        onReciterPress={() => setShowReciterModal(true)}
      />
      <ReciterModal
        visible={showReciterModal}
        colors={colors}
        lang={lang}
        reciters={reciters}
        moqriId={moqriId}
        onClose={() => setShowReciterModal(false)}
        onSelect={handleReciterChange}
      />
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  // ---------- Mini Player ----------
  miniContainer: {
    paddingBottom: Platform.OS === "ios" ? 16 : 0,
  },
  tekrarBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a5c2e",
    paddingHorizontal: 14,
    paddingVertical: 5,
    gap: 6,
  },
  tekrarBarText: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  tekrarBarCounter: {
    color: "#a5d6b0",
    fontWeight: "700",
  },
  tekrarBarClose: {
    padding: 2,
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
    height: MINI_HEIGHT,
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
});
