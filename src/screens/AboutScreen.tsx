import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  Share,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";

const ACCENT = "#1a5c2e";

const RTL_LANGS = ["ar", "amz", "he"];

const DONORS = [
  { name: "Hamid Bidi", code: "HB-4521", amount: "$100", message: "الدعاء لوالدي", color: "#4CAF50" },
  { name: "Mehdi Baha", code: "MB-3387", amount: "$80", message: "صدقة جارية لجدي الغندور", color: "#2196F3" },
  { name: "Mawhoub", code: "MW-9012", amount: "700 DH", message: "من اجل والدي رحمة الله عليه", color: "#FF9800" },
  { name: "احمد", code: "AH-6654", amount: "$120", message: "بالتوفيق", color: "#9C27B0" },
  { name: "مجهول", code: "m-7632", amount: "$5", message: "رجاء ان امكن طور الوضع الليلي في بعض القراءات", color: "#607D8B" },
  { name: "يوسف م.", code: "YM-8841", amount: "$50", message: "جزاكم الله خيرا", color: "#E91E63" },
  { name: "سارة ع.", code: "SA-2290", amount: "200 DH", message: "في ميزان حسناتكم", color: "#00BCD4" },
];

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

  const [feedbackText, setFeedbackText] = useState("");

  const isDark = !!theme.night;
  const isRTL = RTL_LANGS.includes(lang);
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";
  const inputBg = isDark ? "#12122a" : "#f0f0f0";

  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" as const : "left" as const;

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Mushaf Mauri - " +
          t("desc", lang) +
          "\nhttps://mushaf.ma",
      });
    } catch (_) {}
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    Alert.alert(
      t("send_feedback", lang),
      feedbackText,
      [{ text: t("alert_ok", lang) }]
    );
    setFeedbackText("");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor, flexDirection: rowDir }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={textColor}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("about", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── App Info Card ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.appIconWrap}>
            <Ionicons name="book" size={36} color={ACCENT} />
          </View>
          <Text style={[styles.appName, { color: textColor }]}>
            Mushaf Mauri
          </Text>
          <Text style={[styles.appDesc, { color: mutedColor }]}>
            {t("desc", lang)}
          </Text>
        </View>

        {/* ── Share App ── */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareBtn,
            { backgroundColor: ACCENT, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>{t("share_app", lang)}</Text>
        </Pressable>

        {/* ── Feedback ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>
            {t("feedback", lang)}
          </Text>
          <TextInput
            style={[
              styles.feedbackInput,
              {
                backgroundColor: inputBg,
                color: textColor,
                borderColor,
                textAlign,
              },
            ]}
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
              {
                backgroundColor: feedbackText.trim() ? ACCENT : mutedColor,
                opacity: pressed ? 0.85 : 1,
                flexDirection: rowDir,
              },
            ]}
          >
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.feedbackSendText}>
              {t("send_feedback", lang)}
            </Text>
          </Pressable>
        </View>

        {/* ── Support / Donate ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>
            {t("support_project", lang)}
          </Text>
          <Text style={[styles.supportDesc, { color: mutedColor, textAlign }]}>
            {t("support_desc", lang)}
          </Text>

          <Text
            style={[
              styles.donorsLabel,
              { color: textColor, textAlign },
            ]}
          >
            {t("donors", lang)}
          </Text>

          {DONORS.map((donor) => (
            <View
              key={donor.code}
              style={[
                styles.donorCard,
                {
                  backgroundColor: isDark ? "#111125" : "#fafafa",
                  borderColor,
                  flexDirection: rowDir,
                },
              ]}
            >
              {/* Avatar */}
              <View
                style={[styles.donorAvatar, { backgroundColor: donor.color }]}
              >
                <Text style={styles.donorAvatarText}>
                  {donor.name.charAt(0)}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.donorInfo}>
                <View
                  style={[styles.donorNameRow, { flexDirection: rowDir }]}
                >
                  <Text
                    style={[
                      styles.donorName,
                      { color: textColor },
                    ]}
                    numberOfLines={1}
                  >
                    {donor.name}
                  </Text>
                  <Text style={[styles.donorCode, { color: mutedColor }]}>
                    {donor.code}
                  </Text>
                </View>
                <Text style={[styles.donorAmount, { color: ACCENT }]}>
                  {donor.amount}
                </Text>
                <Text
                  style={[
                    styles.donorMessage,
                    { color: mutedColor },
                  ]}
                  numberOfLines={2}
                >
                  {donor.message}
                </Text>
              </View>
            </View>
          ))}

          <Text style={[styles.thankDonors, { color: mutedColor }]}>
            {t("thank_donors", lang)}
          </Text>
        </View>

        {/* ── Developer ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>
            {t("developer", lang)}
          </Text>
          <Text style={[styles.infoText, { color: textColor, textAlign }]}>
            Brahim Bidi
          </Text>
          <Pressable onPress={() => openLink("mailto:Ibrahimbidi@ymail.com")}>
            <Text style={[styles.linkText, { color: ACCENT, textAlign }]}>
              Ibrahimbidi@ymail.com
            </Text>
          </Pressable>
        </View>

        {/* ── Links ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>
            {t("links", lang)}
          </Text>

          <Pressable
            style={[styles.linkRow, { flexDirection: rowDir }]}
            onPress={() => openLink("https://mushaf.ma")}
          >
            <Ionicons name="globe-outline" size={20} color={ACCENT} />
            <Text style={[styles.linkText, { color: ACCENT }]}>mushaf.ma</Text>
          </Pressable>

          <Pressable
            style={[styles.linkRow, { flexDirection: rowDir }]}
            onPress={() => openLink("https://brah.im")}
          >
            <Ionicons name="person-outline" size={20} color={ACCENT} />
            <Text style={[styles.linkText, { color: ACCENT }]}>brah.im</Text>
          </Pressable>

          <Pressable
            style={[styles.linkRow, { flexDirection: rowDir }]}
            onPress={() =>
              openLink("https://www.mushaf.ma/wino/privacy")
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={ACCENT}
            />
            <Text style={[styles.linkText, { color: ACCENT }]}>
              {t("privacy_policy", lang)}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.linkRow, { flexDirection: rowDir }]}
            onPress={() =>
              openLink("https://github.com/nicefella1/mushaf-mauri")
            }
          >
            <Ionicons name="logo-github" size={20} color={textColor} />
            <Text style={[styles.linkText, { color: ACCENT }]}>
              {t("open_source", lang)}
            </Text>
          </Pressable>
        </View>

        {/* ── Libraries ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>
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

  /* App Info */
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  appIconWrap: {
    alignSelf: "center",
    marginBottom: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(26,92,46,0.1)",
    alignItems: "center",
    justifyContent: "center",
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

  /* Share */
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  /* Feedback */
  feedbackInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  feedbackSendBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 18,
  },
  feedbackSendText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Support / Donors */
  supportDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  donorsLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  donorCard: {
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  donorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  donorAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  donorInfo: {
    flex: 1,
  },
  donorNameRow: {
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  donorName: {
    fontSize: 13,
    fontWeight: "600",
  },
  donorCode: {
    fontSize: 10,
    fontWeight: "400",
  },
  donorAmount: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  donorMessage: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 16,
  },
  thankDonors: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },

  /* Shared */
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
