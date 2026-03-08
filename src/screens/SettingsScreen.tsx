import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, type Quira } from "../store/useAppStore";
import { t } from "../i18n";
import { File, Paths } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

const ACCENT = "#1a5c2e";

interface SettingsScreenProps {
  onGoBack: () => void;
  onNavigate?: (screen: string) => void;
}

const FONT_OPTIONS = [
  { key: "default", labelKey: "standard_font" },
  { key: "Maghribi", labelKey: "maghribi_font" },
  { key: "hafs", labelKey: "hafs_font" },
  { key: "rustam", labelKey: "rustam_font" },
  { key: "uthmanic", labelKey: "uthmanic_font" },
];

function FontSelector() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quranFont = useAppStore((s) => s.quranFont);
  const setQuranFont = useAppStore((s) => s.setQuranFont);

  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const borderColor = theme.borderColor;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 13, color: isDark ? "#888" : "#999", marginBottom: 4 }}>
        {t("choose_font", lang)}
      </Text>
      {FONT_OPTIONS.map((font) => (
        <Pressable
          key={font.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: quranFont === font.key ? ACCENT : borderColor,
            backgroundColor:
              quranFont === font.key
                ? isDark
                  ? "#1a3a2e"
                  : "#e8f5e9"
                : "transparent",
            gap: 10,
          }}
          onPress={() => setQuranFont(font.key)}
        >
          {quranFont === font.key && (
            <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
          )}
          <Text
            style={{
              fontSize: 15,
              color: quranFont === font.key ? ACCENT : textColor,
              fontWeight: quranFont === font.key ? "700" : "400",
              fontFamily: font.key !== "default" ? font.key : undefined,
            }}
          >
            {t(font.labelKey, lang)}
          </Text>
          {font.key !== "default" && (
            <Text
              style={{
                fontSize: 18,
                color: isDark ? "#aaa" : "#666",
                fontFamily: font.key,
                marginStart: "auto",
              }}
            >
              بسم الله
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Backup / Restore
// ---------------------------------------------------------------------------
function BackupSection() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : theme.color;
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    try {
      setBusy(true);
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      const data: Record<string, string | null> = {};
      pairs.forEach(([k, v]) => { data[k] = v; });
      const json = JSON.stringify(data, null, 2);

      const tempFile = new File(Paths.cache, "mushaf-backup.json");
      if (!tempFile.exists) tempFile.create();
      tempFile.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempFile.uri, {
          mimeType: "application/json",
          dialogTitle: t("backup_export", lang),
        });
      }
    } catch (e) {
      Alert.alert(t("backup_export", lang), String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setBusy(true);
      const file = new File(result.assets[0].uri);
      const json = file.textSync();
      const data: Record<string, string> = JSON.parse(json);

      if (typeof data !== "object" || Array.isArray(data)) throw new Error("invalid");

      const pairs: [string, string][] = Object.entries(data).map(([k, v]) => [k, String(v)]);
      await AsyncStorage.multiSet(pairs);

      Alert.alert(t("backup_import", lang), t("backup_import_success", lang));
    } catch {
      Alert.alert(t("backup_import", lang), t("backup_import_error", lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Pressable
        style={[styles.backupBtn, { borderColor }]}
        onPress={handleExport}
        disabled={busy}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={ACCENT} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.backupBtnTitle, { color: textColor }]}>{t("backup_export", lang)}</Text>
          <Text style={[styles.backupBtnDesc, { color: mutedColor }]}>{t("backup_export_desc", lang)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={mutedColor} />
      </Pressable>

      <Pressable
        style={[styles.backupBtn, { borderColor }]}
        onPress={handleImport}
        disabled={busy}
      >
        <Ionicons name="cloud-download-outline" size={20} color={ACCENT} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.backupBtnTitle, { color: textColor }]}>{t("backup_import", lang)}</Text>
          <Text style={[styles.backupBtnDesc, { color: mutedColor }]}>{t("backup_import_desc", lang)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={mutedColor} />
      </Pressable>
    </View>
  );
}

export default function SettingsScreen({ onGoBack, onNavigate }: SettingsScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const setQuira = useAppStore((s) => s.setQuira);

  const isDark = !!theme.night;
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;

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
          {t("settings", lang)}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mushaf Selector */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("mosshaf_type", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.mushafRow}>
            {(["madina", "warsh"] as Quira[]).map((q) => (
              <Pressable
                key={q}
                style={[
                  styles.mushafChip,
                  {
                    borderColor: quira === q ? ACCENT : borderColor,
                    backgroundColor:
                      quira === q
                        ? isDark ? "#1a3a2e" : "#e8f5e9"
                        : "transparent",
                  },
                ]}
                onPress={() => setQuira(q)}
              >
                {quira === q && (
                  <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                )}
                <Text
                  style={[
                    styles.mushafChipText,
                    {
                      color: quira === q ? ACCENT : textColor,
                      fontWeight: quira === q ? "700" : "400",
                    },
                  ]}
                >
                  {t(q === "madina" ? "mosshaf_hafs" : "mosshaf_warsh", lang)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Offline / Downloads */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("offline", lang)}
        </Text>
        <Pressable
          style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={() => onNavigate?.("offline")}
        >
          <View style={styles.navRow}>
            <Ionicons name="cloud-download-outline" size={22} color={ACCENT} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.navRowTitle, { color: textColor }]}>
                {t("offline", lang)}
              </Text>
              <Text style={[styles.navRowDesc, { color: mutedColor }]}>
                {t("offline_desc", lang)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={mutedColor} />
          </View>
        </Pressable>

        {/* Recordings */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("my_recordings", lang)}
        </Text>
        <Pressable
          style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={() => onNavigate?.("recordings")}
        >
          <View style={styles.navRow}>
            <Ionicons name="mic-outline" size={22} color={ACCENT} />
            <Text style={[styles.navRowTitle, { color: textColor, flex: 1 }]}>
              {t("manage_recordings", lang)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={mutedColor} />
          </View>
        </Pressable>

        {/* Font Selection */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("font_selection", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <FontSelector />
        </View>

        {/* Backup & Restore */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("backup_data", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <BackupSection />
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  mushafRow: { flexDirection: "row", gap: 10 },
  mushafChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  mushafChipText: { fontSize: 14 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navRowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  navRowDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  backupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backupBtnTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  backupBtnDesc: { fontSize: 12 },
});
