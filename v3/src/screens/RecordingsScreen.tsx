import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, type RecordingProfile } from "../store/useAppStore";
import { t } from "../i18n";
import {
  loadProfiles,
  createProfile,
  renameProfile,
  deleteProfile,
  countRecordings,
  exportProfile,
  importProfile,
  exportSelectedRecordings,
  listRecordings,
  deleteRecording,
  saveRecording,
  buildRecordedAyahSet,
  loadNotes,
  saveNote,
} from "../utils/recordings";
import { getAyahText } from "../utils/ayahText";
import { getAudioKsuUri } from "../utils/api";
import { getPageBySuraAya } from "../utils/coordinates";
// @ts-ignore
import { QuranData } from "../data/quranData";
// @ts-ignore
import { listVoiceMoqri } from "../data/listAuthor";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = "#1a5c2e";
const RECORDING_COLOR = "#d32f2f";

const TRANSLATION_KEYS = [
  "recite_hudhaify", "recite_husary", "recite_basfar", "recite_ayyoub",
  "recite_minshawy", "recite_abdul_basit", "recite_banna", "recite_tablawy",
  "recite_jaber", "recite_afasy", "recite_shaatree", "recite_qatami",
  "recite_khaleefa", "recite_salamah", "recite_jibreel", "recite_ghamadi",
  "recite_sudais", "recite_shuraym", "recite_maher", "recite_ajamy",
  "recite_juhanee", "recite_muhsin", "recite_abbad", "recite_yaser",
  "recite_rifai", "recite_ayman", "recite_moalim", "recite_mujawwad",
  "recite_warsh", "recite_ibrahim_dosary", "recite_yassin",
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RecordingsScreenProps {
  onGoBack: () => void;
}

interface RecordingItem {
  sura: number;
  aya: number;
  uri: string;
  key: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RecordingsScreen({ onGoBack }: RecordingsScreenProps) {
  // -- Store --
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const recordingProfiles = useAppStore((s) => s.recordingProfiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const showRecordingHighlights = useAppStore((s) => s.showRecordingHighlights);
  const setRecordingProfiles = useAppStore((s) => s.setRecordingProfiles);
  const setActiveProfileId = useAppStore((s) => s.setActiveProfileId);
  const setShowRecordingHighlights = useAppStore((s) => s.setShowRecordingHighlights);
  const setRecordedAyahs = useAppStore((s) => s.setRecordedAyahs);

  // -- Refs --
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isUnmountedRef = useRef(false);
  const isSequentialRef = useRef(false);
  const sequentialIndexRef = useRef(0);
  const sortedRecsRef = useRef<RecordingItem[]>([]);

  // -- Local state: data --
  const [refreshKey, setRefreshKey] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // -- Local state: playback --
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<"user" | "compare">("user");
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);

  // -- Local state: re-record --
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  // -- Local state: selection --
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // -- Local state: compare reciter --
  const [compareReciterId, setCompareReciterId] = useState("Husary_64kbps");
  const [showReciterPicker, setShowReciterPicker] = useState(false);

  // -- Local state: profile management --
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileNameModal, setShowProfileNameModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // -- Local state: note modal --
  const [noteModalKey, setNoteModalKey] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // -- Local state: export --
  const [isExporting, setIsExporting] = useState(false);

  // -- Theme --
  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "#2a2a3e" : "#e0e0e0";
  const inputBg = isDark ? "#2a2a3e" : "#f0f0f0";

  // -- Reciters list --
  const translations = useMemo(() => {
    const loc: Record<string, string> = {};
    for (const key of TRANSLATION_KEYS) {
      loc[key] = t(key, lang);
    }
    return loc;
  }, [lang]);

  const reciters: { id: string; voice: string }[] = useMemo(
    () =>
      (listVoiceMoqri(translations) as { id: string; voice: string }[]).filter(
        (r) => r.id !== "__user_recording__"
      ),
    [translations]
  );

  const compareReciterName = useMemo(
    () => reciters.find((r) => r.id === compareReciterId)?.voice ?? compareReciterId,
    [reciters, compareReciterId]
  );

  // -- Recordings data --
  const recordings: RecordingItem[] = useMemo(() => {
    if (!activeProfileId) return [];
    return listRecordings(quira, activeProfileId)
      .map((r) => ({ ...r, key: `s${r.sura}a${r.aya}` }))
      .sort((a, b) => (a.sura !== b.sura ? a.sura - b.sura : a.aya - b.aya));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quira, activeProfileId, refreshKey]);

  // Keep ref in sync for sequential playback
  useEffect(() => {
    sortedRecsRef.current = recordings;
  }, [recordings]);

  // -- Load data --
  const refreshProfiles = useCallback(() => {
    const profiles = loadProfiles(quira);
    setRecordingProfiles(profiles);
  }, [quira, setRecordingProfiles]);

  const refreshData = useCallback(() => {
    setRefreshKey((k) => k + 1);
    if (activeProfileId) {
      setNotes(loadNotes(quira, activeProfileId));
      setRecordedAyahs(buildRecordedAyahSet(quira, activeProfileId));
    }
  }, [quira, activeProfileId, setRecordedAyahs]);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  useEffect(() => {
    if (activeProfileId) {
      setNotes(loadNotes(quira, activeProfileId));
      setRecordedAyahs(buildRecordedAyahSet(quira, activeProfileId));
    } else {
      setNotes({});
      setRecordedAyahs({});
    }
    setRefreshKey((k) => k + 1);
    setSelectedKeys(new Set());
  }, [quira, activeProfileId, setRecordedAyahs]);

  // -- Cleanup on unmount --
  useEffect(() => {
    isUnmountedRef.current = false;
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      allowsRecordingIOS: true,
    }).catch(() => {});
    return () => {
      isUnmountedRef.current = true;
      isSequentialRef.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  // =========================================================================
  // Audio Playback
  // =========================================================================
  const stopPlayback = useCallback(async () => {
    isSequentialRef.current = false;
    setIsSequentialPlaying(false);
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        /* ignore */
      }
      soundRef.current = null;
    }
    if (!isUnmountedRef.current) {
      setPlayingKey(null);
    }
  }, []);

  const playSound = useCallback(
    async (uri: string, key: string, mode: "user" | "compare") => {
      await stopPlayback();
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        if (isUnmountedRef.current) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        setPlayingKey(key);
        setPlayMode(mode);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (isUnmountedRef.current) return;
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            setPlayingKey(null);
            soundRef.current = null;
            // Sequential advance
            if (isSequentialRef.current) {
              sequentialIndexRef.current++;
              const recs = sortedRecsRef.current;
              if (sequentialIndexRef.current < recs.length) {
                const next = recs[sequentialIndexRef.current];
                playSound(next.uri, next.key, "user");
                // Auto-scroll
                flatListRef.current?.scrollToIndex({
                  index: sequentialIndexRef.current,
                  animated: true,
                  viewPosition: 0.3,
                });
              } else {
                isSequentialRef.current = false;
                setIsSequentialPlaying(false);
              }
            }
          }
        });
      } catch {
        if (!isUnmountedRef.current) {
          setPlayingKey(null);
        }
      }
    },
    [stopPlayback]
  );

  const handlePlayRecording = useCallback(
    (item: RecordingItem) => {
      if (playingKey === item.key && playMode === "user") {
        stopPlayback();
      } else {
        playSound(item.uri, item.key, "user");
      }
    },
    [playingKey, playMode, playSound, stopPlayback]
  );

  const handlePlayComparison = useCallback(
    (item: RecordingItem) => {
      if (playingKey === item.key && playMode === "compare") {
        stopPlayback();
      } else {
        const uri = getAudioKsuUri(compareReciterId, item.sura, item.aya);
        playSound(uri, item.key, "compare");
      }
    },
    [playingKey, playMode, compareReciterId, playSound, stopPlayback]
  );

  const handlePlayAll = useCallback(() => {
    if (isSequentialPlaying) {
      stopPlayback();
      return;
    }
    if (recordings.length === 0) return;
    isSequentialRef.current = true;
    setIsSequentialPlaying(true);
    sequentialIndexRef.current = 0;
    playSound(recordings[0].uri, recordings[0].key, "user");
  }, [isSequentialPlaying, recordings, playSound, stopPlayback]);

  // =========================================================================
  // Re-record
  // =========================================================================
  const handleReRecord = useCallback(
    async (item: RecordingItem) => {
      if (!activeProfileId) return;
      if (recordingKey) return; // already recording

      await stopPlayback();

      try {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t("mic_permission", lang), t("mic_permission_msg", lang));
          return;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          allowsRecordingIOS: true,
        });

        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        recordingRef.current = rec;
        setRecordingKey(item.key);
      } catch {
        setRecordingKey(null);
      }
    },
    [activeProfileId, recordingKey, lang, stopPlayback]
  );

  const handleStopReRecord = useCallback(
    async (sura: number, aya: number) => {
      if (!recordingRef.current || !activeProfileId) return;
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        if (uri) {
          saveRecording(uri, sura, aya, quira, activeProfileId);
        }
      } catch {
        recordingRef.current = null;
      }
      setRecordingKey(null);
      refreshData();
    },
    [activeProfileId, quira, refreshData]
  );

  // =========================================================================
  // Navigation
  // =========================================================================
  const handleGoToAyah = useCallback(
    (sura: number, aya: number) => {
      const page = getPageBySuraAya(sura, aya, quira);
      useAppStore.getState().setSelectedAya({
        sura,
        aya,
        page,
        id: `s${sura}a${aya}z`,
      });
      useAppStore.getState().setCurrentPage(page);
      onGoBack();
    },
    [quira, onGoBack]
  );

  // =========================================================================
  // Delete recording
  // =========================================================================
  const handleDeleteRecording = useCallback(
    (item: RecordingItem) => {
      if (!activeProfileId) return;
      Alert.alert(t("delete_recording", lang), t("confirm_delete_recording", lang), [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("yes", lang),
          style: "destructive",
          onPress: () => {
            deleteRecording(item.sura, item.aya, quira, activeProfileId);
            setSelectedKeys((prev) => {
              const next = new Set(prev);
              next.delete(item.key);
              return next;
            });
            refreshData();
          },
        },
      ]);
    },
    [activeProfileId, quira, lang, refreshData]
  );

  // =========================================================================
  // Selection & Export
  // =========================================================================
  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedKeys.size === recordings.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(recordings.map((r) => r.key)));
    }
  }, [selectedKeys.size, recordings]);

  const handleExportSelected = useCallback(async () => {
    if (!activeProfileId || selectedKeys.size === 0) return;
    const profile = recordingProfiles.find((p) => p.id === activeProfileId);
    if (!profile) return;
    setIsExporting(true);
    try {
      const ayahs = recordings
        .filter((r) => selectedKeys.has(r.key))
        .map((r) => ({ sura: r.sura, aya: r.aya }));
      await exportSelectedRecordings(quira, profile, ayahs);
    } catch {
      /* ignore */
    }
    setIsExporting(false);
  }, [activeProfileId, selectedKeys, recordingProfiles, recordings, quira]);

  const handleExportAll = useCallback(async () => {
    if (!activeProfileId) return;
    const profile = recordingProfiles.find((p) => p.id === activeProfileId);
    if (!profile) return;
    setIsExporting(true);
    try {
      await exportProfile(quira, profile);
    } catch {
      /* ignore */
    }
    setIsExporting(false);
  }, [activeProfileId, recordingProfiles, quira]);

  // =========================================================================
  // Notes
  // =========================================================================
  const handleOpenNote = useCallback(
    (key: string) => {
      setNoteModalKey(key);
      setNoteInput(notes[key] ?? "");
    },
    [notes]
  );

  const handleSaveNote = useCallback(() => {
    if (!noteModalKey || !activeProfileId) return;
    const match = noteModalKey.match(/^s(\d+)a(\d+)$/);
    if (!match) return;
    const sura = parseInt(match[1], 10);
    const aya = parseInt(match[2], 10);
    saveNote(quira, activeProfileId, sura, aya, noteInput);
    setNotes((prev) => {
      const next = { ...prev };
      if (noteInput.trim()) {
        next[noteModalKey] = noteInput.trim();
      } else {
        delete next[noteModalKey];
      }
      return next;
    });
    setNoteModalKey(null);
  }, [noteModalKey, noteInput, activeProfileId, quira]);

  // =========================================================================
  // Profile Management
  // =========================================================================
  const handleCreateProfile = useCallback(() => {
    setEditingProfileId(null);
    setProfileNameInput("");
    setShowProfileNameModal(true);
  }, []);

  const handleRenameProfile = useCallback(
    (profileId: string, name: string) => {
      setEditingProfileId(profileId);
      setProfileNameInput(name);
      setShowProfileNameModal(true);
    },
    []
  );

  const handleProfileNameSubmit = useCallback(() => {
    const name = profileNameInput.trim();
    if (!name) return;
    if (editingProfileId) {
      renameProfile(quira, editingProfileId, name);
    } else {
      const profile = createProfile(quira, name);
      if (!activeProfileId) setActiveProfileId(profile.id);
    }
    setShowProfileNameModal(false);
    refreshProfiles();
  }, [profileNameInput, editingProfileId, quira, activeProfileId, setActiveProfileId, refreshProfiles]);

  const handleDeleteProfile = useCallback(
    (profile: RecordingProfile) => {
      Alert.alert(t("delete_profile", lang), t("confirm_delete_profile", lang), [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("yes", lang),
          style: "destructive",
          onPress: () => {
            deleteProfile(quira, profile.id);
            if (activeProfileId === profile.id) setActiveProfileId(null);
            refreshProfiles();
          },
        },
      ]);
    },
    [quira, lang, activeProfileId, setActiveProfileId, refreshProfiles]
  );

  const handleImport = useCallback(async () => {
    try {
      const profile = await importProfile(quira);
      if (profile) {
        refreshProfiles();
        refreshData();
        Alert.alert(t("import_profile", lang), t("import_success", lang));
      }
    } catch {
      Alert.alert(t("import_profile", lang), t("import_failed", lang));
    }
  }, [quira, lang, refreshProfiles, refreshData]);

  // =========================================================================
  // Render: Header
  // =========================================================================
  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: borderColor }]}>
      <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
        <Ionicons name="arrow-back" size={22} color={textColor} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: textColor }]}>
        {t("my_recordings", lang)}
      </Text>
      <View style={styles.headerRight}>
        <Pressable
          onPress={() => setShowProfileModal(true)}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons name="settings-outline" size={20} color={mutedColor} />
        </Pressable>
        <Pressable onPress={handleImport} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="download-outline" size={20} color={ACCENT} />
        </Pressable>
      </View>
    </View>
  );

  // =========================================================================
  // Render: Profile Bar
  // =========================================================================
  const renderProfileBar = () => (
    <View style={[styles.profileBar, { borderBottomColor: borderColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.profileBarContent}
      >
        {recordingProfiles.map((p) => {
          const isActive = activeProfileId === p.id;
          return (
            <Pressable
              key={p.id}
              style={[
                styles.profileChip,
                {
                  backgroundColor: isActive ? ACCENT : inputBg,
                  borderColor: isActive ? ACCENT : borderColor,
                },
              ]}
              onPress={() => setActiveProfileId(p.id)}
            >
              <Text
                style={[
                  styles.profileChipText,
                  { color: isActive ? "#fff" : textColor },
                ]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
              <Text
                style={[
                  styles.profileChipCount,
                  { color: isActive ? "rgba(255,255,255,0.7)" : mutedColor },
                ]}
              >
                {countRecordings(quira, p.id)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.addChip, { borderColor }]}
          onPress={handleCreateProfile}
        >
          <Ionicons name="add" size={18} color={ACCENT} />
        </Pressable>
      </ScrollView>
    </View>
  );

  // =========================================================================
  // Render: Toolbar
  // =========================================================================
  const renderToolbar = () => (
    <View style={[styles.toolbar, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
      {/* Play All / Stop */}
      <Pressable
        style={[
          styles.toolBtn,
          {
            backgroundColor: isSequentialPlaying ? RECORDING_COLOR : ACCENT,
          },
        ]}
        onPress={handlePlayAll}
        disabled={recordings.length === 0}
      >
        <Ionicons
          name={isSequentialPlaying ? "stop" : "play"}
          size={14}
          color="#fff"
        />
        <Text style={styles.toolBtnText}>
          {isSequentialPlaying ? t("stop_playback", lang) : t("play_all", lang)}
        </Text>
      </Pressable>

      {/* Compare Reciter */}
      <Pressable
        style={[styles.toolBtnOutline, { borderColor }]}
        onPress={() => setShowReciterPicker(true)}
      >
        <Ionicons name="headset-outline" size={14} color={ACCENT} />
        <Text
          style={[styles.toolBtnOutlineText, { color: textColor }]}
          numberOfLines={1}
        >
          {compareReciterName}
        </Text>
      </Pressable>

      {/* Highlights Toggle */}
      <Pressable
        style={[styles.toolIcon, { backgroundColor: inputBg }]}
        onPress={() => setShowRecordingHighlights(!showRecordingHighlights)}
      >
        <Ionicons
          name={showRecordingHighlights ? "eye" : "eye-off-outline"}
          size={18}
          color={showRecordingHighlights ? ACCENT : mutedColor}
        />
      </Pressable>

      {/* Select All */}
      <Pressable
        style={[styles.toolIcon, { backgroundColor: inputBg }]}
        onPress={handleSelectAll}
        disabled={recordings.length === 0}
      >
        <Ionicons
          name={
            selectedKeys.size > 0 && selectedKeys.size === recordings.length
              ? "checkbox"
              : "square-outline"
          }
          size={18}
          color={selectedKeys.size > 0 ? ACCENT : mutedColor}
        />
      </Pressable>
    </View>
  );

  // =========================================================================
  // Render: Recording Item
  // =========================================================================
  const renderRecordingItem = useCallback(
    ({ item }: { item: RecordingItem }) => {
      const suraData = QuranData.Sura[item.sura];
      const suraName = suraData?.[0] ?? "";
      const page = getPageBySuraAya(item.sura, item.aya, quira);
      const ayahText = getAyahText(item.sura, item.aya, quira);
      const isPlaying = playingKey === item.key;
      const isRecording = recordingKey === item.key;
      const isSelected = selectedKeys.has(item.key);
      const note = notes[item.key];

      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: isPlaying
                ? playMode === "compare"
                  ? "#4285f4"
                  : ACCENT
                : isRecording
                ? RECORDING_COLOR
                : borderColor,
              borderWidth: isPlaying || isRecording ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          {/* Top row: checkbox + sura/ayah info */}
          <View style={styles.cardHeader}>
            <Pressable
              style={styles.checkbox}
              onPress={() => toggleSelect(item.key)}
            >
              <Ionicons
                name={isSelected ? "checkbox" : "square-outline"}
                size={20}
                color={isSelected ? ACCENT : mutedColor}
              />
            </Pressable>
            <Text style={[styles.cardSura, { color: textColor }]}>
              {suraName}
            </Text>
            <Text style={[styles.cardAya, { color: ACCENT }]}>
              {t("aya_s", lang)} {item.aya}
            </Text>
            <Text style={[styles.cardPage, { color: mutedColor }]}>
              {t("page", lang)} {page}
            </Text>
            {isPlaying && (
              <View
                style={[
                  styles.playingBadge,
                  {
                    backgroundColor:
                      playMode === "compare" ? "#4285f4" : ACCENT,
                  },
                ]}
              >
                <Ionicons name="volume-high" size={10} color="#fff" />
              </View>
            )}
            {isRecording && (
              <View style={[styles.playingBadge, { backgroundColor: RECORDING_COLOR }]}>
                <Ionicons name="mic" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Ayah text */}
          {ayahText && (
            <Text
              style={[styles.cardAyahText, { color: textColor }]}
              numberOfLines={2}
            >
              {ayahText}
            </Text>
          )}

          {/* Action buttons */}
          <View style={[styles.cardActions, { borderTopColor: borderColor }]}>
            {/* Play */}
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    isPlaying && playMode === "user"
                      ? ACCENT
                      : inputBg,
                },
              ]}
              onPress={() => handlePlayRecording(item)}
            >
              <Ionicons
                name={isPlaying && playMode === "user" ? "stop" : "play"}
                size={15}
                color={isPlaying && playMode === "user" ? "#fff" : ACCENT}
              />
            </Pressable>

            {/* Compare */}
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    isPlaying && playMode === "compare"
                      ? "#4285f4"
                      : inputBg,
                },
              ]}
              onPress={() => handlePlayComparison(item)}
            >
              <Ionicons
                name={isPlaying && playMode === "compare" ? "stop" : "headset"}
                size={15}
                color={isPlaying && playMode === "compare" ? "#fff" : "#4285f4"}
              />
            </Pressable>

            {/* Re-record */}
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isRecording ? RECORDING_COLOR : inputBg,
                },
              ]}
              onPress={() =>
                isRecording
                  ? handleStopReRecord(item.sura, item.aya)
                  : handleReRecord(item)
              }
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={15}
                color={isRecording ? "#fff" : RECORDING_COLOR}
              />
            </Pressable>

            {/* Go to ayah */}
            <Pressable
              style={[styles.actionBtn, { backgroundColor: inputBg }]}
              onPress={() => handleGoToAyah(item.sura, item.aya)}
            >
              <Ionicons name="open-outline" size={15} color={textColor} />
            </Pressable>

            {/* Note */}
            <Pressable
              style={[styles.actionBtn, { backgroundColor: inputBg }]}
              onPress={() => handleOpenNote(item.key)}
            >
              <Ionicons
                name={note ? "document-text" : "document-text-outline"}
                size={15}
                color={note ? "#ff9800" : mutedColor}
              />
            </Pressable>

            {/* Delete */}
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: isDark ? "#2a1a1a" : "#fff0f0" },
              ]}
              onPress={() => handleDeleteRecording(item)}
            >
              <Ionicons name="trash-outline" size={15} color={RECORDING_COLOR} />
            </Pressable>
          </View>

          {/* Note text */}
          {note ? (
            <Pressable
              style={[styles.noteRow, { borderTopColor: borderColor }]}
              onPress={() => handleOpenNote(item.key)}
            >
              <Ionicons name="document-text" size={14} color="#ff9800" />
              <Text
                style={[styles.noteText, { color: mutedColor }]}
                numberOfLines={2}
              >
                {note}
              </Text>
            </Pressable>
          ) : null}
        </View>
      );
    },
    [
      quira,
      lang,
      playingKey,
      playMode,
      recordingKey,
      selectedKeys,
      notes,
      cardBg,
      textColor,
      mutedColor,
      borderColor,
      inputBg,
      isDark,
      toggleSelect,
      handlePlayRecording,
      handlePlayComparison,
      handleReRecord,
      handleStopReRecord,
      handleGoToAyah,
      handleOpenNote,
      handleDeleteRecording,
    ]
  );

  // =========================================================================
  // Render: Empty
  // =========================================================================
  const renderEmpty = () => (
    <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
      <Ionicons name="mic-off-outline" size={48} color={mutedColor} />
      <Text style={[styles.emptyText, { color: mutedColor }]}>
        {activeProfileId
          ? t("no_recordings", lang)
          : t("recording_profiles", lang)}
      </Text>
      {!activeProfileId && recordingProfiles.length === 0 && (
        <Pressable
          style={[styles.emptyBtn, { backgroundColor: ACCENT }]}
          onPress={handleCreateProfile}
        >
          <Text style={styles.emptyBtnText}>{t("new_profile", lang)}</Text>
        </Pressable>
      )}
    </View>
  );

  // =========================================================================
  // Render: Bottom Bar (selection actions)
  // =========================================================================
  const renderBottomBar = () => {
    if (selectedKeys.size === 0) return null;
    return (
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: cardBg, borderTopColor: borderColor },
        ]}
      >
        <Text style={[styles.bottomBarCount, { color: mutedColor }]}>
          {selectedKeys.size} {t("select_for_export", lang)}
        </Text>
        <Pressable
          style={[styles.bottomBtn, { backgroundColor: ACCENT }]}
          onPress={handleExportSelected}
          disabled={isExporting}
        >
          <Ionicons name="share-outline" size={16} color="#fff" />
          <Text style={styles.bottomBtnText}>
            {t("export_selected", lang)}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.bottomBtn, { backgroundColor: inputBg }]}
          onPress={handleExportAll}
          disabled={isExporting}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={ACCENT} />
          <Text style={[styles.bottomBtnText, { color: ACCENT }]}>
            {t("export_profile", lang)}
          </Text>
        </Pressable>
      </View>
    );
  };

  // =========================================================================
  // Render: Profile Management Modal
  // =========================================================================
  const renderProfileModal = () => (
    <Modal
      visible={showProfileModal}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setShowProfileModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.profileModalContent, { backgroundColor: cardBg }]}>
          <View style={styles.modalHandle}>
            <View style={[styles.handleBar, { backgroundColor: borderColor }]} />
          </View>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            {t("profile_settings", lang)}
          </Text>

          <ScrollView style={styles.profileModalScroll}>
            {recordingProfiles.map((p) => {
              const isActive = activeProfileId === p.id;
              const count = countRecordings(quira, p.id);
              return (
                <View
                  key={p.id}
                  style={[
                    styles.profileModalItem,
                    { borderBottomColor: borderColor },
                  ]}
                >
                  <View style={styles.profileModalInfo}>
                    <Ionicons
                      name={isActive ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={isActive ? ACCENT : mutedColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.profileModalName, { color: textColor }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.profileModalCount, { color: mutedColor }]}>
                        {count} {t("recorded_ayahs", lang)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.profileModalActions}>
                    <Pressable
                      style={[styles.pmBtn, { backgroundColor: inputBg }]}
                      onPress={() => {
                        setShowProfileModal(false);
                        handleRenameProfile(p.id, p.name);
                      }}
                    >
                      <Ionicons name="pencil-outline" size={14} color={textColor} />
                    </Pressable>
                    <Pressable
                      style={[styles.pmBtn, { backgroundColor: isDark ? "#2a1a1a" : "#fff0f0" }]}
                      onPress={() => {
                        setShowProfileModal(false);
                        handleDeleteProfile(p);
                      }}
                    >
                      <Ionicons name="trash-outline" size={14} color={RECORDING_COLOR} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.profileModalCreate, { backgroundColor: ACCENT }]}
            onPress={() => {
              setShowProfileModal(false);
              handleCreateProfile();
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.profileModalCreateText}>
              {t("new_profile", lang)}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.profileModalClose, { borderTopColor: borderColor }]}
            onPress={() => setShowProfileModal(false)}
          >
            <Text style={[styles.profileModalCloseText, { color: ACCENT }]}>
              {t("close", lang)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // =========================================================================
  // Render: Profile Name Modal (create / rename)
  // =========================================================================
  const renderProfileNameModal = () => (
    <Modal
      visible={showProfileNameModal}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowProfileNameModal(false)}
    >
      <View style={styles.centerModalOverlay}>
        <View style={[styles.centerModalContent, { backgroundColor: cardBg }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            {editingProfileId ? t("rename_profile", lang) : t("new_profile", lang)}
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={profileNameInput}
            onChangeText={setProfileNameInput}
            placeholder={t("profile_name", lang)}
            placeholderTextColor={mutedColor}
            autoFocus
            maxLength={50}
          />
          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: inputBg }]}
              onPress={() => setShowProfileNameModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: textColor }]}>
                {t("cancel", lang)}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: ACCENT }]}
              onPress={handleProfileNameSubmit}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                {editingProfileId ? t("rename_profile", lang) : t("create_profile", lang)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // =========================================================================
  // Render: Note Modal
  // =========================================================================
  const renderNoteModal = () => (
    <Modal
      visible={noteModalKey !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setNoteModalKey(null)}
    >
      <View style={styles.centerModalOverlay}>
        <View style={[styles.centerModalContent, { backgroundColor: cardBg }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            {notes[noteModalKey ?? ""]
              ? t("edit_note", lang)
              : t("add_note", lang)}
          </Text>
          <TextInput
            style={[
              styles.noteModalInput,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={noteInput}
            onChangeText={setNoteInput}
            placeholder={t("note_placeholder", lang)}
            placeholderTextColor={mutedColor}
            multiline
            autoFocus
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: inputBg }]}
              onPress={() => setNoteModalKey(null)}
            >
              <Text style={[styles.modalBtnText, { color: textColor }]}>
                {t("cancel", lang)}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: ACCENT }]}
              onPress={handleSaveNote}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                {t("save_note", lang)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // =========================================================================
  // Render: Reciter Picker Modal
  // =========================================================================
  const renderReciterModal = () => (
    <Modal
      visible={showReciterPicker}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setShowReciterPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.profileModalContent, { backgroundColor: cardBg }]}>
          <View style={styles.modalHandle}>
            <View style={[styles.handleBar, { backgroundColor: borderColor }]} />
          </View>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            {t("compare_with_reciter", lang)}
          </Text>
          <FlatList
            data={reciters}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = compareReciterId === item.id;
              return (
                <Pressable
                  style={[
                    styles.reciterItem,
                    {
                      borderBottomColor: borderColor,
                      backgroundColor: isActive
                        ? isDark
                          ? "rgba(26,92,46,0.2)"
                          : "rgba(26,92,46,0.08)"
                        : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setCompareReciterId(item.id);
                    setShowReciterPicker(false);
                  }}
                >
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={ACCENT}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.reciterItemText,
                      { color: isActive ? ACCENT : textColor },
                      isActive && { fontWeight: "700" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.voice}
                  </Text>
                </Pressable>
              );
            }}
          />
          <Pressable
            style={[styles.profileModalClose, { borderTopColor: borderColor }]}
            onPress={() => setShowReciterPicker(false)}
          >
            <Text style={[styles.profileModalCloseText, { color: ACCENT }]}>
              {t("close", lang)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // =========================================================================
  // Main Render
  // =========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />
      {renderHeader()}
      {renderProfileBar()}
      {renderToolbar()}
      <FlatList
        ref={flatListRef}
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {}}
      />
      {renderBottomBar()}
      {renderProfileModal()}
      {renderProfileNameModal()}
      {renderNoteModal()}
      {renderReciterModal()}
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerRight: { flexDirection: "row", gap: 4 },

  // Profile bar
  profileBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  profileBarContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  profileChipText: { fontSize: 13, fontWeight: "600", maxWidth: 120 },
  profileChipCount: { fontSize: 11, fontWeight: "500" },
  addChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  toolBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  toolBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  toolBtnOutlineText: { fontSize: 12, fontWeight: "500", flex: 1 },
  toolIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // List
  listContent: {
    padding: 10,
    paddingBottom: 100,
  },

  // Card
  card: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardSura: { fontSize: 14, fontWeight: "700" },
  cardAya: { fontSize: 13, fontWeight: "600" },
  cardPage: { fontSize: 11 },
  playingBadge: {
    marginLeft: "auto",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardAyahText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: "right",
    writingDirection: "rtl",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
  },
  cardActions: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 16 },

  // Empty
  emptyCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 48,
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  emptyText: { fontSize: 15, fontWeight: "500", textAlign: "center" },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
  },
  bottomBarCount: { fontSize: 12, fontWeight: "500" },
  bottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  bottomBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Modals shared
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  centerModalContent: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "right",
  },
  noteModalInput: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 15,
    marginBottom: 20,
    textAlign: "right",
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 15, fontWeight: "700" },
  modalHandle: { alignItems: "center", paddingVertical: 8 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },

  // Profile modal
  profileModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingTop: 8,
  },
  profileModalScroll: { maxHeight: 300 },
  profileModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profileModalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  profileModalName: { fontSize: 15, fontWeight: "600" },
  profileModalCount: { fontSize: 12, marginTop: 1 },
  profileModalActions: { flexDirection: "row", gap: 6 },
  pmBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  profileModalCreate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  profileModalCreateText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  profileModalClose: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
  },
  profileModalCloseText: { fontSize: 16, fontWeight: "700" },

  // Reciter modal
  reciterItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  reciterItemText: { fontSize: 15, flex: 1, textAlign: "right" },
});
