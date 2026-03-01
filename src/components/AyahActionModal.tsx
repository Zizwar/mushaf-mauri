import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Share,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
// @ts-ignore
import { QuranData } from "../data/quranData";
import { getAyahText } from "../utils/ayahText";

interface AyahActionModalProps {
  visible: boolean;
  onClose: () => void;
  onPlay: () => void;
  onBookmark: () => void;
  onTafsir: () => void;
  sura: number;
  aya: number;
  page: number;
}

const ICON_SIZE = 28;

export default function AyahActionModal({
  visible,
  onClose,
  onPlay,
  onBookmark,
  onTafsir,
  sura,
  aya,
  page,
}: AyahActionModalProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quira = useAppStore((s) => s.quira);

  const suraData = QuranData.Sura[sura];
  const suraName = suraData?.[0] ?? `${sura}`;

  const [ayahText, setAyahText] = useState("");
  useEffect(() => {
    getAyahText(sura, aya, quira).then((text) => setAyahText(text ?? ""));
  }, [sura, aya, quira]);

  const isNight = !!theme.night;
  const cardBg = isNight ? "#262640" : "#ffffff";
  const textColor = isNight ? "#e8e8f0" : "#1a1a2e";
  const subtitleColor = isNight ? "#a0a0c0" : "#666680";
  const iconColor = isNight ? "#8cacff" : "#4285f4";
  const btnBg = isNight ? "#1e1e36" : "#f5f7fa";
  const btnPressedBg = isNight ? "#32325a" : "#e2e8f0";
  const headerBg = isNight ? "#4285f4" : "#4285f4";
  const dividerColor = isNight ? "#3a3a5c" : "#e8ecf0";

  const handleCopy = useCallback(() => {
    const copyText = ayahText
      ? `${ayahText}\n\n${t("sura_s", lang)} ${suraName} - ${t("aya_s", lang)} ${aya}`
      : `${t("sura_s", lang)} ${suraName} - ${t("aya_s", lang)} ${aya}`;
    Alert.alert(t("copy", lang), copyText);
    onClose();
  }, [suraName, aya, ayahText, lang, onClose]);

  const handleShare = useCallback(async () => {
    const shareText = ayahText
      ? `${ayahText}\n\n${t("sura_s", lang)} ${suraName} - ${t("aya_s", lang)} ${aya}\nhttps://meshaf.ma/d/a${aya}s${sura}r1z`
      : `${t("sura_s", lang)} ${suraName} - ${t("aya_s", lang)} ${aya}\nhttps://meshaf.ma/d/a${aya}s${sura}r1z`;
    try {
      await Share.share({
        message: shareText,
      });
    } catch {
      // User cancelled or share failed
    }
    onClose();
  }, [suraName, sura, aya, ayahText, lang, onClose]);

  const actions: {
    key: string;
    labelKey: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }[] = [
    {
      key: "play",
      labelKey: "play",
      icon: "play-circle-outline",
      onPress: () => {
        onPlay();
        onClose();
      },
    },
    {
      key: "bookmark",
      labelKey: "bookmark",
      icon: "bookmark-outline",
      onPress: () => {
        onBookmark();
        onClose();
      },
    },
    {
      key: "tafsir",
      labelKey: "tafsir",
      icon: "book-outline",
      onPress: () => {
        onTafsir();
        onClose();
      },
    },
    {
      key: "copy",
      labelKey: "copy",
      icon: "copy-outline",
      onPress: handleCopy,
    },
    {
      key: "share",
      labelKey: "share",
      icon: "share-social-outline",
      onPress: handleShare,
    },
    {
      key: "close",
      labelKey: "close",
      icon: "close-circle-outline",
      onPress: onClose,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Header with ayah info */}
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <Text style={styles.headerText}>
              {t("sura_s", lang)} {suraName} : {t("aya_s", lang)} {aya}
            </Text>
            <Text style={styles.headerSubtext}>
              {t("page", lang)} {page}
            </Text>
            {ayahText ? (
              <Text style={styles.headerAyahText} numberOfLines={3}>
                {ayahText}
              </Text>
            ) : null}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Action grid: 2 columns, 3 rows */}
          <View style={styles.grid}>
            {actions.map((action) => (
              <Pressable
                key={action.key}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: pressed ? btnPressedBg : btnBg },
                ]}
                onPress={action.onPress}
              >
                <Ionicons
                  name={action.icon}
                  size={ICON_SIZE}
                  color={action.key === "close" ? (isNight ? "#ff8a8a" : "#e53935") : iconColor}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    {
                      color: action.key === "close"
                        ? (isNight ? "#ff8a8a" : "#e53935")
                        : textColor,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t(action.labelKey, lang)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtext: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  headerAyahText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 28,
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 8,
    paddingHorizontal: 8,
    opacity: 0.9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 10,
  },
  actionBtn: {
    width: "47%",
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
});
