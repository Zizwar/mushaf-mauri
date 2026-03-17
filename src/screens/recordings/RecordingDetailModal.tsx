import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { getPageBySuraAya } from "../../utils/coordinates";
// @ts-ignore
import { QuranData } from "../../data/quranData";
import { styles, ACCENT, RECORDING_COLOR } from "./styles";
import type { RecordingItem, PlayMode } from "./types";
import type { LangKey } from "../../i18n";
import type { Quira } from "../../store/useAppStore";

interface Props {
  visible: boolean;
  item: RecordingItem | null;
  ayahText: string;
  note: string | undefined;
  isPlaying: boolean;
  playMode: PlayMode;
  isRecording: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  cardBg: string;
  inputBg: string;
  lang: LangKey;
  quira: Quira;
  onClose: () => void;
  onPlay: () => void;
  onCompare: () => void;
  onSideBySide: () => void;
  onReRecord: () => void;
  onStopReRecord: () => void;
  onGoToAyah: () => void;
  onOpenNote: () => void;
  onDelete: () => void;
}

export default function RecordingDetailModal({
  visible,
  item,
  ayahText,
  note,
  isPlaying,
  playMode,
  isRecording,
  isDark,
  textColor,
  mutedColor,
  borderColor,
  cardBg,
  inputBg,
  lang,
  quira,
  onClose,
  onPlay,
  onCompare,
  onSideBySide,
  onReRecord,
  onStopReRecord,
  onGoToAyah,
  onOpenNote,
  onDelete,
}: Props) {
  if (!item) return null;

  const suraData = QuranData.Sura[item.sura];
  const suraName = suraData?.[0] ?? "";
  const page = getPageBySuraAya(item.sura, item.aya, quira);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable
          style={[styles.detailSheet, { backgroundColor: cardBg }]}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={styles.detailHandle}>
            <View style={[styles.handleBar, { backgroundColor: borderColor }]} />
          </View>

          {/* Header */}
          <View style={styles.detailHeader}>
            <View style={[styles.cardSuraBadge]}>
              <Text style={styles.cardSuraBadgeText}>{suraName}</Text>
            </View>
            <Text style={[styles.cardAya, { color: ACCENT }]}>
              {t("aya_s", lang)} {item.aya}
            </Text>
            <Text style={[styles.cardPage, { color: mutedColor }]}>
              {t("page", lang)} {page}
            </Text>
            {isPlaying && (
              <View
                style={[
                  styles.playingBadge,
                  {
                    backgroundColor:
                      playMode === "compare" ? "#336699" : ACCENT,
                  },
                ]}
              >
                <Ionicons name="volume-high" size={10} color="#fff" />
              </View>
            )}
            {isRecording && (
              <View
                style={[styles.playingBadge, { backgroundColor: RECORDING_COLOR }]}
              >
                <Ionicons name="mic" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Ayah text - scrollable, no truncation */}
          <ScrollView
            style={{ maxHeight: 160 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.detailAyahText, { color: textColor }]}>
              {ayahText}
            </Text>
          </ScrollView>

          {/* Divider */}
          <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />

          {/* Action grid */}
          <View style={styles.detailActions}>
            {/* Play / Stop */}
            <Pressable
              style={[
                styles.detailActionBtn,
                {
                  backgroundColor:
                    isPlaying && playMode === "user" ? ACCENT : inputBg,
                },
              ]}
              onPress={onPlay}
            >
              <Ionicons
                name={isPlaying && playMode === "user" ? "stop" : "play"}
                size={18}
                color={isPlaying && playMode === "user" ? "#fff" : ACCENT}
              />
              <Text
                style={[
                  styles.detailActionLabel,
                  {
                    color:
                      isPlaying && playMode === "user" ? "#fff" : textColor,
                  },
                ]}
              >
                {isPlaying && playMode === "user"
                  ? t("stop_playback", lang)
                  : t("play_recording", lang)}
              </Text>
            </Pressable>

            {/* Compare reciter */}
            <Pressable
              style={[
                styles.detailActionBtn,
                {
                  backgroundColor:
                    isPlaying && playMode === "compare" ? "#336699" : inputBg,
                },
              ]}
              onPress={onCompare}
            >
              <Ionicons
                name={
                  isPlaying && playMode === "compare" ? "stop" : "headset"
                }
                size={18}
                color={isPlaying && playMode === "compare" ? "#fff" : "#336699"}
              />
              <Text
                style={[
                  styles.detailActionLabel,
                  {
                    color:
                      isPlaying && playMode === "compare" ? "#fff" : textColor,
                  },
                ]}
              >
                {t("compare_with_reciter", lang)}
              </Text>
            </Pressable>

            {/* Side-by-side */}
            <Pressable
              style={[
                styles.detailActionBtn,
                {
                  backgroundColor:
                    isPlaying && playMode === "side_by_side"
                      ? "#ff9800"
                      : inputBg,
                },
              ]}
              onPress={onSideBySide}
            >
              <Ionicons
                name={
                  isPlaying && playMode === "side_by_side"
                    ? "stop"
                    : "git-compare-outline"
                }
                size={18}
                color={
                  isPlaying && playMode === "side_by_side" ? "#fff" : "#ff9800"
                }
              />
              <Text
                style={[
                  styles.detailActionLabel,
                  {
                    color:
                      isPlaying && playMode === "side_by_side"
                        ? "#fff"
                        : textColor,
                  },
                ]}
              >
                {t("side_by_side", lang)}
              </Text>
            </Pressable>

            {/* Re-record */}
            <Pressable
              style={[
                styles.detailActionBtn,
                {
                  backgroundColor: isRecording ? RECORDING_COLOR : inputBg,
                },
              ]}
              onPress={isRecording ? onStopReRecord : onReRecord}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={18}
                color={isRecording ? "#fff" : RECORDING_COLOR}
              />
              <Text
                style={[
                  styles.detailActionLabel,
                  { color: isRecording ? "#fff" : textColor },
                ]}
              >
                {isRecording
                  ? t("stop_playback", lang)
                  : t("re_record", lang)}
              </Text>
            </Pressable>

            {/* Go to ayah */}
            <Pressable
              style={[styles.detailActionBtn, { backgroundColor: inputBg }]}
              onPress={onGoToAyah}
            >
              <Ionicons name="open-outline" size={18} color={textColor} />
              <Text
                style={[styles.detailActionLabel, { color: textColor }]}
              >
                {t("go_to_ayah", lang)}
              </Text>
            </Pressable>

            {/* Add note */}
            <Pressable
              style={[styles.detailActionBtn, { backgroundColor: inputBg }]}
              onPress={onOpenNote}
            >
              <Ionicons
                name={note ? "document-text" : "document-text-outline"}
                size={18}
                color={note ? "#ff9800" : mutedColor}
              />
              <Text
                style={[styles.detailActionLabel, { color: textColor }]}
              >
                {note ? t("edit_note", lang) : t("add_note", lang)}
              </Text>
            </Pressable>
          </View>

          {/* Note display */}
          {note ? (
            <Pressable
              style={[styles.noteRow, { borderTopColor: borderColor, marginHorizontal: 16 }]}
              onPress={onOpenNote}
            >
              <Ionicons name="document-text" size={14} color="#ff9800" />
              <Text
                style={[styles.noteText, { color: mutedColor }]}
                numberOfLines={3}
              >
                {note}
              </Text>
            </Pressable>
          ) : null}

          {/* Divider */}
          <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />

          {/* Delete button */}
          <Pressable
            style={[
              styles.detailActionBtn,
              {
                width: "auto",
                marginHorizontal: 16,
                marginTop: 8,
                borderWidth: 1,
                borderColor: RECORDING_COLOR,
                backgroundColor: isDark ? "#2a1a1a" : "#fff0f0",
              },
            ]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={18} color={RECORDING_COLOR} />
            <Text
              style={[styles.detailActionLabel, { color: RECORDING_COLOR }]}
            >
              {t("delete_recording", lang)}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
