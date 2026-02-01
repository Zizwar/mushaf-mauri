import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t, type LangKey } from "../i18n";
import { THEMES } from "../theme/themes";
import type { Quira } from "../store/useAppStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

  const mushafs: { key: Quira; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "madina", labelKey: "mosshaf_hafs", icon: "book" },
    { key: "warsh", labelKey: "mosshaf_warsh", icon: "book-outline" },
  ];

  const isDark = theme.night;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0d1117" : "#f8f9fa" }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverWrap}>
          <Image
            source={require("../../assets/cover3.png")}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay}>
            <Image
              source={require("../../assets/mauri.png")}
              style={styles.mauriIcon}
              resizeMode="contain"
            />
            <Text style={styles.coverTitle}>{t("mushaf_mauri", lang)}</Text>
            <Text style={styles.coverDesc}>{t("desc", lang)}</Text>
          </View>
        </View>

        {/* Mushaf Selection */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <Ionicons name="book" size={20} color={isDark ? "#8b9dc3" : "#1a5c2e"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#ddd" : "#333" }]}>
              {t("mosshaf_type", lang)}
            </Text>
          </View>
          <View style={styles.row}>
            {mushafs.map((m) => (
              <Pressable
                key={m.key}
                style={[
                  styles.mushafChip,
                  { borderColor: isDark ? "#444" : "#ddd" },
                  quira === m.key && styles.mushafChipActive,
                ]}
                onPress={() => setQuira(m.key)}
              >
                <Ionicons
                  name={m.icon}
                  size={24}
                  color={quira === m.key ? "#fff" : (isDark ? "#aaa" : "#666")}
                />
                <Text style={[
                  styles.mushafChipText,
                  { color: isDark ? "#ccc" : "#333" },
                  quira === m.key && { color: "#fff" },
                ]}>
                  {t(m.labelKey, lang)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Language */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <Ionicons name="language" size={20} color={isDark ? "#8b9dc3" : "#1a5c2e"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#ddd" : "#333" }]}>
              {t("choose_lang", lang)}
            </Text>
          </View>
          <View style={styles.row}>
            {languages.map((l) => (
              <Pressable
                key={l.key}
                style={[
                  styles.langChip,
                  { borderColor: isDark ? "#444" : "#ddd" },
                  lang === l.key && styles.langChipActive,
                ]}
                onPress={() => setLang(l.key)}
              >
                <Text style={[
                  styles.langText,
                  { color: isDark ? "#ccc" : "#333" },
                  lang === l.key && { color: "#fff" },
                ]}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Theme */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <Ionicons name="color-palette" size={20} color={isDark ? "#8b9dc3" : "#1a5c2e"} />
            <Text style={[styles.cardTitle, { color: isDark ? "#ddd" : "#333" }]}>
              {t("theme", lang)}
            </Text>
          </View>
          <View style={styles.themeRow}>
            {THEMES.map((th, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.themeCircle,
                  { backgroundColor: th.backgroundColor },
                  theme.name === th.name && styles.themeCircleActive,
                ]}
                onPress={() => setTheme(th)}
              >
                {th.night && (
                  <Ionicons name="moon" size={16} color="#fff" />
                )}
                {theme.name === th.name && !th.night && (
                  <Ionicons name="checkmark" size={18} color={th.color} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Open Button */}
        <Pressable style={styles.openBtn} onPress={onOpenMushaf}>
          <Ionicons name="book-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.openBtnText}>{t("open_mushaf", lang)}</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 20 },
  coverWrap: {
    width: SCREEN_WIDTH,
    height: 220,
    marginBottom: 20,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  mauriIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  coverTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },
  coverDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: "#161b22",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  mushafChip: {
    flex: 1,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  mushafChipActive: {
    backgroundColor: "#1a5c2e",
    borderColor: "#1a5c2e",
  },
  mushafChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  langChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  langChipActive: {
    backgroundColor: "#4285f4",
    borderColor: "#4285f4",
  },
  langText: {
    fontSize: 14,
    fontWeight: "500",
  },
  themeRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  themeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  themeCircleActive: {
    borderWidth: 3,
    borderColor: "#4285f4",
  },
  openBtn: {
    flexDirection: "row",
    backgroundColor: "#1a5c2e",
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#1a5c2e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
