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
} from "react-native";
import {
  useAudioRecorder,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
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
  importProfileFromUri,
  exportSelectedRecordings,
  listRecordings,
  deleteRecording,
  saveRecording,
  buildRecordedAyahSet,
  loadNotes,
  saveNote,
} from "../utils/recordings";
import { getAyahText } from "../utils/ayahText";
import { getPageBySuraAya } from "../utils/coordinates";
// @ts-ignore
import { QuranData } from "../data/quranData";
// @ts-ignore
import { listVoiceMoqri } from "../data/listAuthor";

import { useRecordingsPlayer } from "../hooks/useRecordingsPlayer";
import { styles, ACCENT, RECORDING_COLOR } from "./recordings/styles";
import type { RecordingItem } from "./recordings/types";
import RecordingDetailModal from "./recordings/RecordingDetailModal";
import RecordNewModal from "./recordings/RecordNewModal";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
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

  // -- expo-audio recorder hook (for re-record) --
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // -- Refs --
  const flatListRef = useRef<FlatList>(null);

  // -- Compare reciter --
  const [compareReciterId, setCompareReciterId] = useState("Husary_64kbps");
  const [showReciterPicker, setShowReciterPicker] = useState(false);

  // -- Player hook --
  const player = useRecordingsPlayer(compareReciterId);

  // -- Local state: data --
  const [refreshKey, setRefreshKey] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // -- Local state: re-record --
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  // -- Local state: selection --
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // -- Local state: profile management --
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileNameModal, setShowProfileNameModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // -- Local state: note modal --
  const [noteModalKey, setNoteModalKey] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // -- Help modal --
  const [showHelp, setShowHelp] = useState(false);

  // -- Local state: export --
  const [isExporting, setIsExporting] = useState(false);

  // -- Detail modal --
  const [detailItem, setDetailItem] = useState<RecordingItem | null>(null);

  // -- Record New modal --
  const [showRecordNew, setShowRecordNew] = useState(false);

  // -- Theme --
  const isDark = !!theme.night;
  const isRTL = lang === "ar" || lang === "he";
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;
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

  // Keep player in sync
  useEffect(() => {
    player.setSortedRecs(recordings);
  }, [recordings, player]);

  // Cache ayah texts
  const [ayahTexts, setAyahTexts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (recordings.length === 0) { setAyahTexts({}); return; }
    Promise.all(
      recordings.map((r) =>
        getAyahText(r.sura, r.aya, quira).then((text) => [r.key, text ?? ""] as const)
      )
    ).then((entries) => setAyahTexts(Object.fromEntries(entries)));
  }, [recordings, quira]);

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

  useEffect(() => { refreshProfiles(); }, [refreshProfiles]);

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

  // -- Init / cleanup --
  useEffect(() => {
    player.init();
    return () => { player.cleanup(); };
  }, []);

  // =========================================================================
  // Re-record
  // =========================================================================
  const handleReRecord = useCallback(
    async (item: RecordingItem) => {
      if (!activeProfileId) return;
      if (recordingKey) return;
      player.stopPlayback();
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t("mic_permission", lang), t("mic_permission_msg", lang));
          return;
        }
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          allowsRecording: true,
          interruptionMode: "doNotMix",
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setRecordingKey(item.key);
      } catch {
        setRecordingKey(null);
      }
    },
    [activeProfileId, recordingKey, lang, recorder, player]
  );

  const handleStopReRecord = useCallback(
    async (sura: number, aya: number) => {
      if (!activeProfileId) return;
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          saveRecording(uri, sura, aya, quira, activeProfileId);
        }
      } catch { /* ignore */ }
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
      useAppStore.getState().setSelectedAya({ sura, aya, page, id: `s${sura}a${aya}z` });
      useAppStore.getState().setCurrentPage(page);
      onGoBack();
    },
    [quira, onGoBack]
  );

  // =========================================================================
  // Delete
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
            setSelectedKeys((prev) => { const next = new Set(prev); next.delete(item.key); return next; });
            setDetailItem(null);
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
      if (next.has(key)) next.delete(key); else next.add(key);
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
      const ayahs = recordings.filter((r) => selectedKeys.has(r.key)).map((r) => ({ sura: r.sura, aya: r.aya }));
      await exportSelectedRecordings(quira, profile, ayahs);
    } catch { /* ignore */ }
    setIsExporting(false);
  }, [activeProfileId, selectedKeys, recordingProfiles, recordings, quira]);

  const handleExportAll = useCallback(async () => {
    if (!activeProfileId) return;
    const profile = recordingProfiles.find((p) => p.id === activeProfileId);
    if (!profile) return;
    setIsExporting(true);
    try { await exportProfile(quira, profile); } catch { /* ignore */ }
    setIsExporting(false);
  }, [activeProfileId, recordingProfiles, quira]);

  // =========================================================================
  // Notes
  // =========================================================================
  const handleOpenNote = useCallback(
    (key: string) => { setNoteModalKey(key); setNoteInput(notes[key] ?? ""); },
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
      if (noteInput.trim()) { next[noteModalKey] = noteInput.trim(); } else { delete next[noteModalKey]; }
      return next;
    });
    setNoteModalKey(null);
  }, [noteModalKey, noteInput, activeProfileId, quira]);

  // =========================================================================
  // Profile Management
  // =========================================================================
  const handleCreateProfile = useCallback(() => {
    setEditingProfileId(null); setProfileNameInput(""); setShowProfileNameModal(true);
  }, []);

  const handleRenameProfile = useCallback((profileId: string, name: string) => {
    setEditingProfileId(profileId); setProfileNameInput(name); setShowProfileNameModal(true);
  }, []);

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

  const handleImportFile = useCallback(async () => {
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

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [importUrl, setImportUrl] = useState("");

  const handleImportFromUrl = useCallback(() => {
    setImportUrl("");
    setShowUrlInput(true);
  }, []);

  const handleSubmitUrl = useCallback(async () => {
    const url = importUrl.trim();
    setShowUrlInput(false);
    if (!url) return;
    try {
      const profile = await importProfileFromUri(url, quira);
      if (profile) {
        refreshProfiles();
        refreshData();
        Alert.alert(t("import_profile", lang), t("import_success", lang));
      } else {
        Alert.alert(t("import_profile", lang), t("import_failed", lang));
      }
    } catch {
      Alert.alert(t("import_profile", lang), t("import_failed", lang));
    }
  }, [importUrl, quira, lang, refreshProfiles, refreshData]);

  const handleImport = useCallback(() => {
    Alert.alert(
      t("import_profile", lang),
      undefined,
      [
        { text: t("import_from_file", lang), onPress: handleImportFile },
        { text: t("import_from_url", lang), onPress: handleImportFromUrl },
        { text: t("cancel", lang), style: "cancel" },
      ]
    );
  }, [lang, handleImportFile, handleImportFromUrl]);

  // =========================================================================
  // Simplified Card
  // =========================================================================
  const renderRecordingItem = useCallback(
    ({ item }: { item: RecordingItem }) => {
      const suraData = QuranData.Sura[item.sura];
      const suraName = suraData?.[0] ?? "";
      const ayahText = ayahTexts[item.key] ?? null;
      const isPlaying = player.playingKey === item.key;
      const isRecording = recordingKey === item.key;
      const isSelected = selectedKeys.has(item.key);

      return (
        <Pressable
          onPress={() => setDetailItem(item)}
          onLongPress={() => toggleSelect(item.key)}
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: isPlaying
                ? player.playMode === "compare" ? "#336699" : ACCENT
                : isRecording ? RECORDING_COLOR : isSelected ? ACCENT : borderColor,
              borderWidth: isPlaying || isRecording || isSelected ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <View style={styles.cardBody}>
            {/* Sura badge */}
            <View style={styles.cardSuraBadge}>
              <Text style={styles.cardSuraBadgeText}>{suraName}</Text>
            </View>

            {/* Aya number */}
            <Text style={[styles.cardAya, { color: ACCENT }]}>{item.aya}</Text>

            {/* Ayah text preview (1 line) */}
            {ayahText ? (
              <Text style={[styles.cardTextPreview, { color: textColor }]} numberOfLines={1}>
                {ayahText}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {/* Playing / recording indicator */}
            {isPlaying && (
              <View style={[styles.playingBadge, { backgroundColor: player.playMode === "compare" ? "#336699" : ACCENT }]}>
                <Ionicons name="volume-high" size={10} color="#fff" />
              </View>
            )}
            {isRecording && (
              <View style={[styles.playingBadge, { backgroundColor: RECORDING_COLOR }]}>
                <Ionicons name="mic" size={10} color="#fff" />
              </View>
            )}

            {/* Small play/stop button */}
            <Pressable
              style={[
                styles.cardPlayBtn,
                {
                  backgroundColor:
                    isPlaying && player.playMode === "user" ? ACCENT : inputBg,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                player.handlePlayRecording(item);
              }}
              hitSlop={6}
            >
              <Ionicons
                name={isPlaying && player.playMode === "user" ? "stop" : "play"}
                size={16}
                color={isPlaying && player.playMode === "user" ? "#fff" : ACCENT}
              />
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [
      ayahTexts, player.playingKey, player.playMode, recordingKey, selectedKeys,
      cardBg, textColor, borderColor, inputBg, toggleSelect, player,
    ]
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t("my_recordings", lang)}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setShowHelp(true)} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="help-circle-outline" size={22} color={ACCENT} />
          </Pressable>
          <Pressable onPress={() => setShowProfileModal(true)} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="settings-outline" size={20} color={mutedColor} />
          </Pressable>
          <Pressable onPress={handleImport} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="download-outline" size={20} color={ACCENT} />
          </Pressable>
        </View>
      </View>

      {/* Profile bar */}
      <View style={[styles.profileBar, { borderBottomColor: borderColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileBarContent}>
          {recordingProfiles.map((p) => {
            const isActive = activeProfileId === p.id;
            return (
              <Pressable
                key={p.id}
                style={[styles.profileChip, { backgroundColor: isActive ? ACCENT : inputBg, borderColor: isActive ? ACCENT : borderColor }]}
                onPress={() => setActiveProfileId(p.id)}
              >
                <Text style={[styles.profileChipText, { color: isActive ? "#fff" : textColor }]} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={[styles.profileChipCount, { color: isActive ? "rgba(255,255,255,0.7)" : mutedColor }]}>
                  {countRecordings(quira, p.id)}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={[styles.addChip, { borderColor }]} onPress={handleCreateProfile}>
            <Ionicons name="add" size={18} color={ACCENT} />
          </Pressable>
        </ScrollView>
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Pressable
          style={[styles.toolBtn, { backgroundColor: player.isSequentialPlaying ? RECORDING_COLOR : ACCENT }]}
          onPress={() => player.handlePlayAll(recordings, flatListRef)}
          disabled={recordings.length === 0}
        >
          <Ionicons name={player.isSequentialPlaying ? "stop" : "play"} size={14} color="#fff" />
          <Text style={styles.toolBtnText}>
            {player.isSequentialPlaying ? t("stop_playback", lang) : t("play_all", lang)}
          </Text>
        </Pressable>
        <Pressable style={[styles.toolBtnOutline, { borderColor }]} onPress={() => setShowReciterPicker(true)}>
          <Ionicons name="headset-outline" size={14} color={ACCENT} />
          <Text style={[styles.toolBtnOutlineText, { color: textColor }]} numberOfLines={1}>{compareReciterName}</Text>
        </Pressable>
        <Pressable style={[styles.toolIcon, { backgroundColor: inputBg }]} onPress={() => setShowRecordingHighlights(!showRecordingHighlights)}>
          <Ionicons name={showRecordingHighlights ? "eye" : "eye-off-outline"} size={18} color={showRecordingHighlights ? ACCENT : mutedColor} />
        </Pressable>
        <Pressable style={[styles.toolIcon, { backgroundColor: inputBg }]} onPress={handleSelectAll} disabled={recordings.length === 0}>
          <Ionicons name={selectedKeys.size > 0 && selectedKeys.size === recordings.length ? "checkbox" : "square-outline"} size={18} color={selectedKeys.size > 0 ? ACCENT : mutedColor} />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        ref={flatListRef}
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="mic-off-outline" size={48} color={mutedColor} />
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              {activeProfileId ? t("no_recordings", lang) : t("recording_profiles", lang)}
            </Text>
            {!activeProfileId && recordingProfiles.length === 0 && (
              <Pressable style={[styles.emptyBtn, { backgroundColor: ACCENT }]} onPress={handleCreateProfile}>
                <Text style={styles.emptyBtnText}>{t("new_profile", lang)}</Text>
              </Pressable>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {}}
      />

      {/* Bottom bar (selection) */}
      {selectedKeys.size > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
          <Text style={[styles.bottomBarCount, { color: mutedColor }]}>{selectedKeys.size} {t("select_for_export", lang)}</Text>
          <Pressable style={[styles.bottomBtn, { backgroundColor: ACCENT }]} onPress={handleExportSelected} disabled={isExporting}>
            <Ionicons name="share-outline" size={16} color="#fff" />
            <Text style={styles.bottomBtnText}>{t("export_selected", lang)}</Text>
          </Pressable>
          <Pressable style={[styles.bottomBtn, { backgroundColor: inputBg }]} onPress={handleExportAll} disabled={isExporting}>
            <Ionicons name="cloud-upload-outline" size={16} color={ACCENT} />
            <Text style={[styles.bottomBtnText, { color: ACCENT }]}>{t("export_profile", lang)}</Text>
          </Pressable>
        </View>
      )}

      {/* FAB: Record New */}
      {activeProfileId && (
        <Pressable
          style={[styles.recordFab, { backgroundColor: RECORDING_COLOR }]}
          onPress={() => setShowRecordNew(true)}
        >
          <Ionicons name="mic" size={26} color="#fff" />
        </Pressable>
      )}

      {/* Detail modal */}
      <RecordingDetailModal
        visible={detailItem !== null}
        item={detailItem}
        ayahText={detailItem ? (ayahTexts[detailItem.key] ?? "") : ""}
        note={detailItem ? notes[detailItem.key] : undefined}
        isPlaying={detailItem ? player.playingKey === detailItem.key : false}
        playMode={player.playMode}
        isRecording={detailItem ? recordingKey === detailItem.key : false}
        isDark={isDark}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        cardBg={cardBg}
        inputBg={inputBg}
        lang={lang}
        quira={quira}
        onClose={() => setDetailItem(null)}
        onPlay={() => detailItem && player.handlePlayRecording(detailItem)}
        onCompare={() => detailItem && player.handlePlayComparison(detailItem)}
        onSideBySide={() => detailItem && player.handleSideBySide(detailItem)}
        onReRecord={() => detailItem && handleReRecord(detailItem)}
        onStopReRecord={() => detailItem && handleStopReRecord(detailItem.sura, detailItem.aya)}
        onGoToAyah={() => detailItem && handleGoToAyah(detailItem.sura, detailItem.aya)}
        onOpenNote={() => detailItem && handleOpenNote(detailItem.key)}
        onDelete={() => detailItem && handleDeleteRecording(detailItem)}
      />

      {/* Record New modal */}
      <RecordNewModal
        visible={showRecordNew}
        isDark={isDark}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        cardBg={cardBg}
        inputBg={inputBg}
        lang={lang}
        quira={quira}
        activeProfileId={activeProfileId}
        onClose={() => setShowRecordNew(false)}
        onRecordingSaved={refreshData}
      />

      {/* Profile Management Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHandle}>
              <View style={[styles.handleBar, { backgroundColor: borderColor }]} />
            </View>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t("profile_settings", lang)}</Text>
            <ScrollView style={styles.profileModalScroll}>
              {recordingProfiles.map((p) => {
                const isActive = activeProfileId === p.id;
                const count = countRecordings(quira, p.id);
                return (
                  <View key={p.id} style={[styles.profileModalItem, { borderBottomColor: borderColor }]}>
                    <View style={styles.profileModalInfo}>
                      <Ionicons name={isActive ? "radio-button-on" : "radio-button-off"} size={18} color={isActive ? ACCENT : mutedColor} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.profileModalName, { color: textColor }]}>{p.name}</Text>
                        <Text style={[styles.profileModalCount, { color: mutedColor }]}>{count} {t("recorded_ayahs", lang)}</Text>
                      </View>
                    </View>
                    <View style={styles.profileModalActions}>
                      <Pressable style={[styles.pmBtn, { backgroundColor: inputBg }]} onPress={() => { setShowProfileModal(false); handleRenameProfile(p.id, p.name); }}>
                        <Ionicons name="pencil-outline" size={14} color={textColor} />
                      </Pressable>
                      <Pressable style={[styles.pmBtn, { backgroundColor: isDark ? "#2a1a1a" : "#fff0f0" }]} onPress={() => { setShowProfileModal(false); handleDeleteProfile(p); }}>
                        <Ionicons name="trash-outline" size={14} color={RECORDING_COLOR} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <Pressable style={[styles.profileModalCreate, { backgroundColor: ACCENT }]} onPress={() => { setShowProfileModal(false); handleCreateProfile(); }}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.profileModalCreateText}>{t("new_profile", lang)}</Text>
            </Pressable>
            <Pressable style={[styles.profileModalClose, { borderTopColor: borderColor }]} onPress={() => setShowProfileModal(false)}>
              <Text style={[styles.profileModalCloseText, { color: ACCENT }]}>{t("close", lang)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Profile Name Modal */}
      <Modal visible={showProfileNameModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowProfileNameModal(false)}>
        <View style={styles.centerModalOverlay}>
          <View style={[styles.centerModalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editingProfileId ? t("rename_profile", lang) : t("new_profile", lang)}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
              value={profileNameInput}
              onChangeText={setProfileNameInput}
              placeholder={t("profile_name", lang)}
              placeholderTextColor={mutedColor}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, { backgroundColor: inputBg }]} onPress={() => setShowProfileNameModal(false)}>
                <Text style={[styles.modalBtnText, { color: textColor }]}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ACCENT }]} onPress={handleProfileNameSubmit}>
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  {editingProfileId ? t("rename_profile", lang) : t("create_profile", lang)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Modal */}
      <Modal visible={noteModalKey !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNoteModalKey(null)}>
        <View style={styles.centerModalOverlay}>
          <View style={[styles.centerModalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {notes[noteModalKey ?? ""] ? t("edit_note", lang) : t("add_note", lang)}
            </Text>
            <TextInput
              style={[styles.noteModalInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
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
              <Pressable style={[styles.modalBtn, { backgroundColor: inputBg }]} onPress={() => setNoteModalKey(null)}>
                <Text style={[styles.modalBtnText, { color: textColor }]}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ACCENT }]} onPress={handleSaveNote}>
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>{t("save_note", lang)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reciter Picker Modal */}
      <Modal visible={showReciterPicker} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowReciterPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHandle}>
              <View style={[styles.handleBar, { backgroundColor: borderColor }]} />
            </View>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t("compare_with_reciter", lang)}</Text>
            <FlatList
              data={reciters}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isActive = compareReciterId === item.id;
                return (
                  <Pressable
                    style={[styles.reciterItem, { borderBottomColor: borderColor, backgroundColor: isActive ? (isDark ? "rgba(26,92,46,0.2)" : "rgba(26,92,46,0.08)") : "transparent" }]}
                    onPress={() => { setCompareReciterId(item.id); setShowReciterPicker(false); }}
                  >
                    {isActive && <Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginRight: 8 }} />}
                    <Text style={[styles.reciterItemText, { color: isActive ? ACCENT : textColor }, isActive && { fontWeight: "700" }]} numberOfLines={1}>
                      {item.voice}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <Pressable style={[styles.profileModalClose, { borderTopColor: borderColor }]} onPress={() => setShowReciterPicker(false)}>
              <Text style={[styles.profileModalCloseText, { color: ACCENT }]}>{t("close", lang)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowHelp(false)}>
        <Pressable style={styles.centerModalOverlay} onPress={() => setShowHelp(false)}>
          <Pressable style={[styles.helpModalContent, { backgroundColor: cardBg }]} onPress={() => {}}>
            <View style={[styles.helpHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Ionicons name="mic-circle-outline" size={32} color={ACCENT} />
              <Text style={[styles.helpTitle, { color: textColor, textAlign: isRTL ? "right" : "left" }]}>{t("recordings_help_title", lang)}</Text>
            </View>
            <Text style={[styles.helpBody, { color: mutedColor, textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("recordings_help_body", lang)}</Text>
            <Pressable style={[styles.helpCloseBtn, { backgroundColor: ACCENT }]} onPress={() => setShowHelp(false)}>
              <Text style={styles.helpCloseBtnText}>{t("alert_ok", lang)}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* URL Import Modal */}
      <Modal visible={showUrlInput} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowUrlInput(false)}>
        <Pressable style={styles.centerModalOverlay} onPress={() => setShowUrlInput(false)}>
          <Pressable style={[styles.helpModalContent, { backgroundColor: cardBg, gap: 12 }]} onPress={() => {}}>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700", textAlign: "center" }}>
              {t("import_from_url", lang)}
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor, borderRadius: 10, padding: 12, fontSize: 14, color: textColor, textAlign: "left", direction: "ltr" }}
              placeholder={t("import_url_placeholder", lang)}
              placeholderTextColor={mutedColor}
              value={importUrl}
              onChangeText={setImportUrl}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleSubmitUrl}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor, alignItems: "center" }} onPress={() => setShowUrlInput(false)}>
                <Text style={{ color: mutedColor, fontWeight: "600" }}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: ACCENT, alignItems: "center" }} onPress={handleSubmitUrl}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{t("import_profile", lang)}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
