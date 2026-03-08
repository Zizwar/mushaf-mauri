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
  TextInput,
  ToastAndroid,
} from "react-native";
import * as Clipboard from "expo-clipboard";
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
  const quranFont = useAppStore((s) => s.quranFont);

  const suraData = QuranData.Sura[sura];
  const suraName = suraData?.[0] ?? `${sura}`;

  const [ayahText, setAyahText] = useState("");
  useEffect(() => {
    getAyahText(sura, aya, quira).then((text) => setAyahText(text ?? ""));
  }, [sura, aya, quira]);

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Reset note state when modal opens
  useEffect(() => {
    if (visible) {
      setShowNoteInput(false);
      setNoteText("");
    }
  }, [visible]);

  const isNight = !!theme.night;
  const cardBg = theme.backgroundColor;
  const textColor = isNight ? "#e8e8f0" : "#1a1a2e";
  const subtitleColor = isNight ? "#a0a0c0" : "#666";
  const iconColor = isNight ? "#8cacff" : "#4285f4";
  const btnBg = theme.borderColor;
  const btnPressedBg = isNight ? "#32325a" : "#d0d8e0";
  const headerBg = "#4285f4";
  const dividerColor = theme.borderColor;
  const fontFamily = quranFont !== "default" ? quranFont : undefined;

  const handleCopy = useCallback(async () => {
    const copyText = ayahText
      ? `${ayahText}\n\n${t("sura_s", lang)} ${suraName} - ${t("aya_s", lang)} ${aya}`
      : `${t("sura_s", lang)} ${suraName} - ${t("aya_s", lang)} ${aya}`;
    await Clipboard.setStringAsync(copyText);
    if (Platform.OS === "android") {
      ToastAndroid.show(t("copied", lang), ToastAndroid.SHORT);
    } else {
      Alert.alert("", t("copied", lang));
    }
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
      key: "note",
      labelKey: "add_note",
      icon: "create-outline",
      onPress: () => setShowNoteInput(true),
    },
  ];

  const handleSaveNote = () => {
    // First bookmark the ayah (addBookmark deduplicates)
    getAyahText(sura, aya, quira).then((text) => {
      useAppStore.getState().addBookmark({
        sura,
        aya,
        page,
        timestamp: Date.now(),
        text: text ?? undefined,
      });
      if (noteText.trim()) {
        useAppStore.getState().updateBookmarkNote(sura, aya, noteText.trim());
      }
    });
    setShowNoteInput(false);
    onClose();
  };

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
              <Text
                style={[styles.headerAyahText, fontFamily ? { fontFamily } : undefined]}
                numberOfLines={3}
              >
                {ayahText}
              </Text>
            ) : null}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Action grid or Note input */}
          {showNoteInput ? (
            <View style={styles.noteContainer}>
              <TextInput
                style={[styles.noteInput, { color: textColor, borderColor: dividerColor }]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t("note_placeholder", lang)}
                placeholderTextColor={subtitleColor}
                multiline
                autoFocus
                textAlignVertical="top"
              />
              <View style={styles.noteButtons}>
                <Pressable
                  onPress={() => setShowNoteInput(false)}
                  style={[styles.noteBtn, { borderColor: dividerColor }]}
                >
                  <Text style={{ color: subtitleColor }}>{t("cancel", lang)}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveNote}
                  style={[styles.noteBtn, { backgroundColor: "#4285f4" }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>{t("save_note", lang)}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
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
                    color={iconColor}
                  />
                  <Text
                    style={[styles.actionLabel, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {t(action.labelKey, lang)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
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
  noteContainer: {
    padding: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    writingDirection: "rtl",
    textAlign: "right",
  },
  noteButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  noteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
