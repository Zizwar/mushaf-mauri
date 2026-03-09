import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  Share,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import DonateModal from "../components/DonateModal";
// @ts-ignore
import appJson from "../../app.json";
import donorsData from "../data/donors.json";

const ACCENT = "#1a5c2e";
const RTL_LANGS = ["ar", "amz", "he"];
const APP_VERSION: string = appJson?.expo?.version ?? "—";

interface Donor {
  name: string;
  txId: string;
  amount: number;
  currency: string;
  message: string;
  color: string;
}

const DONORS: Donor[] = donorsData as Donor[];

/** Show partial txId: TXN-3387 → TXN-33•• */
function maskTxId(txId: string): string {
  const parts = txId.split("-");
  if (parts.length < 2) return txId;
  const last = parts[parts.length - 1];
  const masked = last.slice(0, 2) + "••";
  return parts.slice(0, -1).join("-") + "-" + masked;
}

// ── Auto-scrolling vertical donor ticker ──────────────────────────────────────
const ITEM_H = 52;
const VISIBLE = 3;

function DonorTicker({ isDark, textColor, mutedColor, borderColor }: {
  isDark: boolean; textColor: string; mutedColor: string; borderColor: string;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const total = DONORS.length;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateY, {
        toValue: -(ITEM_H * total),
        duration: total * 2800,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const doubled = [...DONORS, ...DONORS];

  return (
    <View style={{ height: ITEM_H * VISIBLE, overflow: "hidden", borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {doubled.map((d, i) => (
          <View key={i} style={[styles.tickerRow, { height: ITEM_H, borderBottomColor: borderColor }]}>
            {/* Avatar dot */}
            <View style={[styles.tickerDot, { backgroundColor: d.color }]}>
              <Text style={styles.tickerDotText}>{d.name.charAt(0)}</Text>
            </View>
            {/* Info */}
            <View style={styles.tickerInfo}>
              <View style={styles.tickerTopRow}>
                <Text style={[styles.tickerName, { color: textColor }]} numberOfLines={1}>{d.name}</Text>
                <Text style={[styles.tickerTx, { color: mutedColor }]}>{maskTxId(d.txId)}</Text>
                <Text style={[styles.tickerAmount, { color: ACCENT }]}>{d.currency}{d.amount}</Text>
              </View>
              {!!d.message && (
                <Text style={[styles.tickerMsg, { color: mutedColor }]} numberOfLines={1}>"{d.message}"</Text>
              )}
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
interface AboutScreenProps {
  onGoBack: () => void;
}

export default function AboutScreen({ onGoBack }: AboutScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const [feedbackText, setFeedbackText] = useState("");
  const [donateVisible, setDonateVisible] = useState(false);

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

        {/* ── Support / Donors ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor, textAlign }]}>{t("support_project", lang)}</Text>
          <Text style={[styles.supportDesc, { color: mutedColor, textAlign }]}>{t("support_desc", lang)}</Text>
          <Pressable
            onPress={() => setDonateVisible(true)}
            style={({ pressed }) => [styles.donateBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="heart" size={18} color="#fff" />
            <Text style={styles.donateBtnText}>{t("donate", lang)}</Text>
          </Pressable>
          <Text style={[styles.donorsLabel, { color: textColor, textAlign, marginTop: 14 }]}>{t("donors", lang)}</Text>
          <DonorTicker isDark={isDark} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} />
          <Text style={[styles.thankDonors, { color: mutedColor }]}>{t("thank_donors", lang)}</Text>
        </View>

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

      <DonateModal visible={donateVisible} onClose={() => setDonateVisible(false)} />
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

  supportDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  donateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 11, borderRadius: 10,
    backgroundColor: "#c0392b",
  },
  donateBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  donorsLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8 },

  tickerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tickerDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  tickerDotText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  tickerInfo: { flex: 1, justifyContent: "center", gap: 2 },
  tickerTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tickerName: { flex: 1, fontSize: 13, fontWeight: "600" },
  tickerTx: { fontSize: 10, fontFamily: "monospace" },
  tickerAmount: { fontSize: 13, fontWeight: "700" },
  tickerMsg: { fontSize: 11, fontStyle: "italic" },

  thankDonors: { fontSize: 12, textAlign: "center", marginTop: 8, fontStyle: "italic" },

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
