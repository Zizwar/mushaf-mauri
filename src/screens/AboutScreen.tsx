import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";

const ACCENT = "#1a5c2e";

const LIBRARIES = [
  "expo",
  "react-native",
  "zustand",
  "expo-audio",
  "expo-file-system",
  "expo-router",
  "react-native-safe-area-context",
  "@expo/vector-icons",
];

interface AboutScreenProps {
  onGoBack: () => void;
}

export default function AboutScreen({ onGoBack }: AboutScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("about", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Name */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.appName, { color: textColor }]}>Mushaf Maghreb</Text>
          <Text style={[styles.appDesc, { color: mutedColor }]}>
            {t("desc", lang)}
          </Text>
        </View>

        {/* Developer */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t("developer", lang)}
          </Text>
          <Text style={[styles.infoText, { color: textColor }]}>
            Brahim Bidi
          </Text>
          <Pressable onPress={() => openLink("mailto:Ibrahimbidi@ymail.com")}>
            <Text style={[styles.linkText, { color: ACCENT }]}>
              Ibrahimbidi@ymail.com
            </Text>
          </Pressable>
        </View>

        {/* Links */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t("links", lang)}
          </Text>

          <Pressable style={styles.linkRow} onPress={() => openLink("https://mushaf.ma")}>
            <Ionicons name="globe-outline" size={20} color={ACCENT} />
            <Text style={[styles.linkText, { color: ACCENT }]}>mushaf.ma</Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => openLink("https://brah.im")}>
            <Ionicons name="person-outline" size={20} color={ACCENT} />
            <Text style={[styles.linkText, { color: ACCENT }]}>brah.im</Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => openLink("https://www.mushaf.ma/wino/privacy")}>
            <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} />
            <Text style={[styles.linkText, { color: ACCENT }]}>
              {t("privacy_policy", lang)}
            </Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => openLink("https://github.com/nicefella1/mushaf-mauri")}>
            <Ionicons name="logo-github" size={20} color={textColor} />
            <Text style={[styles.linkText, { color: ACCENT }]}>
              {t("open_source", lang)}
            </Text>
          </Pressable>
        </View>

        {/* Libraries */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t("libraries_used", lang)}
          </Text>
          {LIBRARIES.map((lib) => (
            <Text key={lib} style={[styles.libText, { color: mutedColor }]}>
              {lib}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  appDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  libText: {
    fontSize: 13,
    paddingVertical: 2,
    fontFamily: "monospace",
  },
});
