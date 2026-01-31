import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t, type LangKey } from "../i18n";
import { THEMES, type Theme } from "../theme/themes";
import type { Quira } from "../store/useAppStore";

interface HomeScreenProps {
  onOpenMushaf: () => void;
}

export default function HomeScreen({ onOpenMushaf }: HomeScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const setLang = useAppStore((s) => s.setLang);
  const setQuira = useAppStore((s) => s.setQuira);
  const setTheme = useAppStore((s) => s.setTheme);

  const languages: { key: LangKey; label: string }[] = [
    { key: "ar", label: "عربي" },
    { key: "en", label: "English" },
    { key: "fr", label: "Français" },
    { key: "amz", label: "ⵜⴰⵎⴰⵣⵉⵖⵜ" },
  ];

  const mushafs: { key: Quira; labelKey: string }[] = [
    { key: "madina", labelKey: "mosshaf_hafs" },
    { key: "warsh", labelKey: "mosshaf_warsh" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title */}
        <View style={styles.coverContainer}>
          <Text style={[styles.title, { color: theme.night ? "#ddd" : "#1a5c2e" }]}>
            ﷽
          </Text>
          <Text style={[styles.subtitle, { color: theme.color }]}>
            {t("mushaf_mauri", lang)}
          </Text>
          <Text style={[styles.desc, { color: theme.night ? "#aaa" : "#666" }]}>
            {t("desc", lang)}
          </Text>
        </View>

        {/* Mushaf Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.color }]}>
            {t("mosshaf_type", lang)}
          </Text>
          <View style={styles.row}>
            {mushafs.map((m) => (
              <Pressable
                key={m.key}
                style={[
                  styles.chip,
                  quira === m.key && styles.chipActive,
                  { borderColor: theme.night ? "#555" : "#ddd" },
                ]}
                onPress={() => setQuira(m.key)}
              >
                <Text style={[
                  styles.chipText,
                  { color: theme.color },
                  quira === m.key && styles.chipTextActive,
                ]}>
                  {t(m.labelKey, lang)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.color }]}>
            {t("choose_lang", lang)}
          </Text>
          <View style={styles.row}>
            {languages.map((l) => (
              <Pressable
                key={l.key}
                style={[
                  styles.chip,
                  lang === l.key && styles.chipActive,
                  { borderColor: theme.night ? "#555" : "#ddd" },
                ]}
                onPress={() => setLang(l.key)}
              >
                <Text style={[
                  styles.chipText,
                  { color: theme.color },
                  lang === l.key && styles.chipTextActive,
                ]}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.color }]}>
            {t("theme", lang)}
          </Text>
          <View style={styles.row}>
            {THEMES.map((th, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.themeCircle,
                  { backgroundColor: th.backgroundColor, borderColor: th.color },
                  theme.name === th.name && styles.themeCircleActive,
                ]}
                onPress={() => setTheme(th)}
              >
                {th.night && <Text style={{ color: "#fff", fontSize: 12 }}>🌙</Text>}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Open Mushaf Button */}
        <Pressable style={styles.openBtn} onPress={onOpenMushaf}>
          <Text style={styles.openBtnText}>{t("open_mushaf", lang)}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    alignItems: "center",
  },
  coverContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: "#4285f4",
    borderColor: "#4285f4",
  },
  chipText: {
    fontSize: 14,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  themeCircleActive: {
    borderWidth: 3,
    borderColor: "#4285f4",
  },
  openBtn: {
    backgroundColor: "#1a5c2e",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
