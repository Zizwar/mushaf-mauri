import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  StatusBar,
} from "react-native";
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
  buildRecordedAyahSet,
} from "../utils/recordings";

const ACCENT = "#1a5c2e";

interface RecordingsScreenProps {
  onGoBack: () => void;
}

export default function RecordingsScreen({ onGoBack }: RecordingsScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const recordingProfiles = useAppStore((s) => s.recordingProfiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const showRecordingHighlights = useAppStore(
    (s) => s.showRecordingHighlights
  );
  const setRecordingProfiles = useAppStore((s) => s.setRecordingProfiles);
  const setActiveProfileId = useAppStore((s) => s.setActiveProfileId);
  const setShowRecordingHighlights = useAppStore(
    (s) => s.setShowRecordingHighlights
  );
  const setRecordedAyahs = useAppStore((s) => s.setRecordedAyahs);

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(
    null
  );
  const [profileCounts, setProfileCounts] = useState<Record<string, number>>(
    {}
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "#2a2a3e" : "#e0e0e0";
  const inputBg = isDark ? "#2a2a3e" : "#f0f0f0";

  const refreshProfiles = useCallback(() => {
    const profiles = loadProfiles(quira);
    setRecordingProfiles(profiles);
    const counts: Record<string, number> = {};
    for (const p of profiles) {
      counts[p.id] = countRecordings(quira, p.id);
    }
    setProfileCounts(counts);
  }, [quira, setRecordingProfiles]);

  // Load profiles and counts on mount / quira change
  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  // When active profile changes, update recorded ayahs
  useEffect(() => {
    if (activeProfileId) {
      setRecordedAyahs(buildRecordedAyahSet(quira, activeProfileId));
    } else {
      setRecordedAyahs({});
    }
  }, [activeProfileId, quira, setRecordedAyahs]);

  const handleCreate = useCallback(() => {
    setEditingProfileId(null);
    setNameInput("");
    setNameModalVisible(true);
  }, []);

  const handleRename = useCallback(
    (profileId: string, currentName: string) => {
      setEditingProfileId(profileId);
      setNameInput(currentName);
      setNameModalVisible(true);
    },
    []
  );

  const handleNameSubmit = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;

    if (editingProfileId) {
      renameProfile(quira, editingProfileId, name);
    } else {
      const profile = createProfile(quira, name);
      if (!activeProfileId) {
        setActiveProfileId(profile.id);
      }
    }
    setNameModalVisible(false);
    refreshProfiles();
  }, [
    nameInput,
    editingProfileId,
    quira,
    activeProfileId,
    setActiveProfileId,
    refreshProfiles,
  ]);

  const handleDelete = useCallback(
    (profile: RecordingProfile) => {
      Alert.alert(
        t("delete_profile", lang),
        t("confirm_delete_profile", lang),
        [
          { text: t("cancel", lang), style: "cancel" },
          {
            text: t("yes", lang),
            style: "destructive",
            onPress: () => {
              deleteProfile(quira, profile.id);
              if (activeProfileId === profile.id) {
                setActiveProfileId(null);
              }
              refreshProfiles();
            },
          },
        ]
      );
    },
    [quira, lang, activeProfileId, setActiveProfileId, refreshProfiles]
  );

  const handleExport = useCallback(
    async (profile: RecordingProfile) => {
      setIsExporting(true);
      try {
        await exportProfile(quira, profile);
      } catch {
        Alert.alert(
          t("export_profile", lang),
          t("import_failed", lang)
        );
      }
      setIsExporting(false);
    },
    [quira, lang]
  );

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const profile = await importProfile(quira);
      if (profile) {
        refreshProfiles();
        Alert.alert(
          t("import_profile", lang),
          t("import_success", lang)
        );
      }
    } catch {
      Alert.alert(t("import_profile", lang), t("import_failed", lang));
    }
    setIsImporting(false);
  }, [quira, lang, refreshProfiles]);

  const handleSetActive = useCallback(
    (profileId: string) => {
      setActiveProfileId(profileId);
    },
    [setActiveProfileId]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("my_recordings", lang)}
        </Text>
        <Pressable
          onPress={handleImport}
          hitSlop={10}
          style={styles.headerBtn}
          disabled={isImporting}
        >
          <Ionicons
            name="download-outline"
            size={22}
            color={isImporting ? mutedColor : ACCENT}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Highlights Toggle */}
        <Pressable
          style={[
            styles.toggleCard,
            { backgroundColor: cardBg, borderColor },
          ]}
          onPress={() =>
            setShowRecordingHighlights(!showRecordingHighlights)
          }
        >
          <View style={styles.toggleRow}>
            <Ionicons
              name={
                showRecordingHighlights ? "eye" : "eye-off-outline"
              }
              size={22}
              color={ACCENT}
            />
            <Text style={[styles.toggleLabel, { color: textColor }]}>
              {t("show_highlights", lang)}
            </Text>
            <View
              style={[
                styles.toggleSwitch,
                {
                  backgroundColor: showRecordingHighlights
                    ? ACCENT
                    : isDark
                    ? "#444"
                    : "#ccc",
                },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  showRecordingHighlights &&
                    styles.toggleThumbActive,
                ]}
              />
            </View>
          </View>
        </Pressable>

        {/* Profiles Section */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("recording_profiles", lang)}
        </Text>

        {recordingProfiles.map((profile) => {
          const isActive = activeProfileId === profile.id;
          const count = profileCounts[profile.id] ?? 0;
          return (
            <Pressable
              key={profile.id}
              style={[
                styles.profileCard,
                {
                  backgroundColor: cardBg,
                  borderColor: isActive ? ACCENT : borderColor,
                  borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}
              onPress={() => handleSetActive(profile.id)}
            >
              {/* Profile header */}
              <View style={styles.profileHeader}>
                <Ionicons
                  name={
                    isActive
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={isActive ? ACCENT : mutedColor}
                />
                <View style={styles.profileInfo}>
                  <Text
                    style={[
                      styles.profileName,
                      { color: textColor },
                    ]}
                  >
                    {profile.name}
                  </Text>
                  <Text
                    style={[
                      styles.profileCount,
                      { color: mutedColor },
                    ]}
                  >
                    {count} {t("recorded_ayahs", lang)}
                  </Text>
                </View>
                {isActive && (
                  <View
                    style={[
                      styles.activeBadge,
                      { backgroundColor: ACCENT },
                    ]}
                  >
                    <Text style={styles.activeBadgeText}>
                      {t("active_profile", lang)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View
                style={[
                  styles.profileActions,
                  { borderTopColor: borderColor },
                ]}
              >
                <Pressable
                  style={[
                    styles.actionBtn,
                    { backgroundColor: inputBg },
                  ]}
                  onPress={() =>
                    handleRename(profile.id, profile.name)
                  }
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={textColor}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: textColor },
                    ]}
                  >
                    {t("rename_profile", lang)}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtn,
                    { backgroundColor: inputBg },
                  ]}
                  onPress={() => handleExport(profile)}
                  disabled={isExporting || count === 0}
                >
                  <Ionicons
                    name="share-outline"
                    size={16}
                    color={count > 0 ? ACCENT : mutedColor}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color:
                          count > 0 ? ACCENT : mutedColor,
                      },
                    ]}
                  >
                    {t("export_profile", lang)}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark
                        ? "#2a1a1a"
                        : "#fff0f0",
                    },
                  ]}
                  onPress={() => handleDelete(profile)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color="#d32f2f"
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: "#d32f2f" },
                    ]}
                  >
                    {t("remove", lang)}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}

        {recordingProfiles.length === 0 && (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <Ionicons
              name="mic-off-outline"
              size={40}
              color={mutedColor}
            />
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              {t("no_recordings", lang)}
            </Text>
          </View>
        )}

        {/* Create New Profile Button */}
        <Pressable
          style={[styles.createBtn, { backgroundColor: ACCENT }]}
          onPress={handleCreate}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createBtnText}>
            {t("new_profile", lang)}
          </Text>
        </Pressable>

        {/* Import Button */}
        <Pressable
          style={[styles.importBtn, { borderColor: ACCENT }]}
          onPress={handleImport}
          disabled={isImporting}
        >
          <Ionicons name="download-outline" size={20} color={ACCENT} />
          <Text style={[styles.importBtnText, { color: ACCENT }]}>
            {t("import_profile", lang)}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Name Input Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: textColor }]}
            >
              {editingProfileId
                ? t("rename_profile", lang)
                : t("new_profile", lang)}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: inputBg,
                  color: textColor,
                  borderColor,
                },
              ]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={t("profile_name", lang)}
              placeholderTextColor={mutedColor}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: inputBg },
                ]}
                onPress={() => setNameModalVisible(false)}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: textColor },
                  ]}
                >
                  {t("cancel", lang)}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: ACCENT },
                ]}
                onPress={handleNameSubmit}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: "#fff" },
                  ]}
                >
                  {editingProfileId
                    ? t("rename_profile", lang)
                    : t("create_profile", lang)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Toggle
  toggleCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  // Profile card
  profileCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
  },
  profileCount: {
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  profileActions: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Empty state
  emptyCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 40,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  // Create button
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  // Import button
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    borderWidth: 1.5,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
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
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
