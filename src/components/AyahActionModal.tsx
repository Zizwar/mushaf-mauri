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
  ScrollView,
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

const ICON_SIZE = 20;

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
  const iconColor = isNight ? "#8cacff" : "#336699";
  const btnBg = isNight ? "#252545" : "#f0f2f5";
  const btnPressedBg = isNight ? "#32325a" : "#d0d8e0";
  const dividerColor = theme.borderColor;
  const fontFamily = quranFont !== "default" ? quranFont : undefined;
  const accentGreen = "#1a5c2e";

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
    const quiraCode = quira === "warsh" ? 1 : 2;
    const link = `https://mushaf.ma/#/s${sura}a${aya}q${quiraCode}`;
    const ref = `${t("sura_s", lang)} ${suraName} • ${t("aya_s", lang)} ${aya}`;
    const shareText = ayahText ? `${ayahText}\n\n${ref}\n${link}` : `${ref}\n${link}`;
    try {
      await Share.share({ message: shareText });
    } catch {}
    onClose();
  }, [suraName, sura, aya, ayahText, lang, onClose]);

  const actions: {
    key: string;
    labelKey: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  }[] = [
    { key: "play", labelKey: "play", icon: "play-circle-outline", onPress: () => { onPlay(); onClose(); } },
    { key: "bookmark", labelKey: "bookmark", icon: "bookmark-outline", onPress: () => { onBookmark(); onClose(); } },
    { key: "tafsir", labelKey: "tafsir", icon: "book-outline", onPress: () => { onTafsir(); onClose(); } },
    { key: "copy", labelKey: "copy", icon: "copy-outline", onPress: handleCopy },
    { key: "share", labelKey: "share", icon: "share-social-outline", onPress: handleShare },
    { key: "note", labelKey: "add_note", icon: "create-outline", onPress: () => setShowNoteInput(true) },
  ];

  const handleSaveNote = () => {
    getAyahText(sura, aya, quira).then((text) => {
      useAppStore.getState().addBookmark({
        sura, aya, page,
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
          {/* Compact header */}
          <View style={[styles.header, { borderBottomColor: dividerColor }]}>
            <View style={styles.headerInfo}>
              <View style={[styles.suraBadge, { backgroundColor: accentGreen }]}>
                <Text style={styles.suraBadgeText}>
                  {suraName} : {aya}
                </Text>
              </View>
              <Text style={[styles.pageText, { color: subtitleColor }]}>
                {t("page", lang)} {page}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={subtitleColor} />
            </Pressable>
          </View>

          {/* Scrollable ayah text */}
          {ayahText ? (
            <ScrollView style={styles.ayahScroll} nestedScrollEnabled showsVerticalScrollIndicator>
              <Text
                style={[
                  styles.ayahText,
                  { color: textColor },
                  fontFamily ? { fontFamily } : undefined,
                ]}
              >
                {ayahText}
              </Text>
            </ScrollView>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Actions or Note input */}
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
                  <Text style={{ color: subtitleColor, fontSize: 13 }}>{t("cancel", lang)}</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveNote}
                  style={[styles.noteBtn, { backgroundColor: accentGreen }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>{t("save_note", lang)}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              {actions.map((action) => (
                <Pressable
                  key={action.key}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: pressed ? btnPressedBg : btnBg },
                  ]}
                  onPress={action.onPress}
                >
                  <Ionicons name={action.icon} size={ICON_SIZE} color={iconColor} />
                  <Text style={[styles.actionLabel, { color: textColor }]} numberOfLines={1}>
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  suraBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suraBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  pageText: {
    fontSize: 12,
    fontWeight: "500",
  },
  ayahScroll: {
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ayahText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: "right",
    writingDirection: "rtl",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexGrow: 1,
    flexBasis: "28%",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  noteContainer: {
    padding: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    fontSize: 14,
    writingDirection: "rtl",
    textAlign: "right",
  },
  noteButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  noteBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
