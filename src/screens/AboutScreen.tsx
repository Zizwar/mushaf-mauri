import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  Share,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
// @ts-ignore
import appJson from "../../app.json";

const ACCENT = "#1a5c2e";
const RTL_LANGS = ["ar", "he"];
const APP_VERSION: string = appJson?.expo?.version ?? "—";

// ─────────────────────────────────────────────────────────────────────────────
interface AboutScreenProps {
  onGoBack: () => void;
}

export default function AboutScreen({ onGoBack }: AboutScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const [feedbackText, setFeedbackText] = useState("");

  const isDark = !!theme.night;
  const isRTL = RTL_LANGS.includes(lang);
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;
  const inputBg = isDark ? "#12122a" : "#f0f0f0";
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" as const : "left" as const;

  const openLink = (url: string) => Linking.openURL(url).catch(() => {});

  const handleShare = async () => {
    try {
      await Share.share({ message: "Mushaf Mauri - " + t("desc", lang) + "\nhttps://mushaf.ma" });
    } catch (_) {}
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    const subject = encodeURIComponent(t("feedback_email_subject", lang));
    const body = encodeURIComponent(feedbackText);
    Linking.openURL(`mailto:feedback@mushaf.ma?subject=${subject}&body=${body}`).catch(() => {});
    setFeedbackText("");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor, flexDirection: rowDir }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t("about", lang)}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── App Info ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.appIconWrap}>
            <Ionicons name="book" size={36} color={ACCENT} />
          </View>
          <Text style={[styles.appName, { color: textColor }]}>Mushaf Mauri</Text>
          <Text style={[styles.appVersion, { color: mutedColor }]}>v{APP_VERSION}</Text>
          <Text style={[styles.appDesc, { color: mutedColor }]}>{t("desc", lang)}</Text>
        </View>

        {/* ── Sources / Credits ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>
            {t("content_sources", lang)}
          </Text>
          {[
            { icon: "school-outline", key: "source_hafs" },
            { icon: "mic-outline",    key: "source_warsh" },
          ].map((s) => (
            <View key={s.key} style={[styles.sourceRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Ionicons name={s.icon as any} size={16} color={ACCENT} style={{ marginTop: 2 }} />
              <Text style={[styles.sourceText, { color: mutedColor, textAlign }]}>
                {t(s.key as any, lang)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Share ── */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.shareBtn, { backgroundColor: ACCENT, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>{t("share_app", lang)}</Text>
        </Pressable>

        {/* ── Feedback ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>{t("feedback", lang)}</Text>
          <TextInput
            style={[styles.feedbackInput, { backgroundColor: inputBg, color: textColor, borderColor, textAlign }]}
            placeholder={t("feedback_placeholder", lang)}
            placeholderTextColor={mutedColor}
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
            numberOfLines={4}
          />
          <Pressable
            onPress={handleSendFeedback}
            style={({ pressed }) => [
              styles.feedbackSendBtn,
              { backgroundColor: feedbackText.trim() ? ACCENT : mutedColor, opacity: pressed ? 0.85 : 1, flexDirection: rowDir },
            ]}
          >
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.feedbackSendText}>{t("send_feedback", lang)}</Text>
          </Pressable>
        </View>

        {/* ── Support ── */}
        <Pressable
          onPress={() => openLink("https://mushaf.ma/support")}
          style={({ pressed }) => [styles.supportBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="heart-outline" size={20} color="#fff" />
          <Text style={styles.supportBtnText}>{t("support_project", lang)}</Text>
        </Pressable>

        {/* ── Developer ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>{t("developer", lang)}</Text>
          <Text style={[styles.infoText, { color: textColor, textAlign }]}>Brahim Bidi</Text>
          <Pressable
            onPress={() => openLink("mailto:ibrahimbidi@yahoo.com")}
            style={({ pressed }) => [styles.contactDevBtn, { backgroundColor: pressed ? ACCENT : "transparent", borderColor: ACCENT }]}
          >
            {({ pressed }) => (
              <View style={[styles.contactDevBtnInner, { flexDirection: rowDir }]}>
                <Ionicons name="mail-outline" size={18} color={pressed ? "#fff" : ACCENT} />
                <Text style={[styles.contactDevBtnText, { color: pressed ? "#fff" : ACCENT }]}>{t("contact_dev", lang)}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Links ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>{t("links", lang)}</Text>
          {[
            { icon: "globe-outline",           label: "mushaf.ma",             url: "https://mushaf.ma" },
            { icon: "person-outline",          label: "brah.im",               url: "https://brah.im" },
            { icon: "shield-checkmark-outline",label: t("privacy_policy", lang),url: "https://www.mushaf.ma/wino/privacy" },
            { icon: "logo-github",             label: t("open_source", lang),  url: "https://github.com/Zizwar/mushaf-mauri" },
          ].map((item) => (
            <Pressable key={item.url} style={[styles.linkRow, { flexDirection: rowDir }]} onPress={() => openLink(item.url)}>
              <Ionicons name={item.icon as any} size={20} color={ACCENT} />
              <Text style={[styles.linkText, { color: ACCENT }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  appIconWrap: {
    alignSelf: "center", marginBottom: 8,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(26,92,46,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  appName: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 2 },
  appVersion: { fontSize: 12, textAlign: "center", marginBottom: 6 },
  appDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  sourceRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 10 },
  sourceText: { flex: 1, fontSize: 13, lineHeight: 19 },

  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 10,
  },
  shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  feedbackInput: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 80,
    textAlignVertical: "top", marginBottom: 10,
  },
  feedbackSendBtn: {
    alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 8,
    alignSelf: "flex-end", paddingHorizontal: 18,
  },
  feedbackSendText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  supportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 10,
    backgroundColor: "#336699",
  },
  supportBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  infoText: { fontSize: 15, marginBottom: 4 },
  linkRow: { alignItems: "center", gap: 10, paddingVertical: 6 },
  linkText: { fontSize: 14, fontWeight: "500" },
  contactDevBtn: {
    borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16,
    marginTop: 8, alignSelf: "center",
  },
  contactDevBtnInner: { alignItems: "center", justifyContent: "center", gap: 8 },
  contactDevBtnText: { fontSize: 14, fontWeight: "600" },
});
