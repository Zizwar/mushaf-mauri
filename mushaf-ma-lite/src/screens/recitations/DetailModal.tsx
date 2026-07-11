import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { useAppStore, useTheme } from "../../store/useAppStore";
import { ACCENT, RECORDING_COLOR } from "../../theme/themes";
import { rangeLabel, toArabicNum } from "../../utils/quranText";
import { getAudioUri, type RecitationMeta } from "../../utils/recitationsStore";
import type { usePlayer } from "../../hooks/usePlayer";
import { formatDate, formatDuration } from "../../utils/format";

interface Props {
  meta: RecitationMeta | null;
  visible: boolean;
  player: ReturnType<typeof usePlayer>;
  onClose: () => void;
  onOpenNote: (meta: RecitationMeta) => void;
  onOpenUpload: (meta: RecitationMeta) => void;
  onReRecord: (meta: RecitationMeta) => void;
  onExport: (meta: RecitationMeta) => void;
  onShareAudio: (meta: RecitationMeta) => void;
  onDelete: (meta: RecitationMeta) => void;
}

/** Bottom sheet with all actions for one recitation. */
export function DetailModal({
  meta,
  visible,
  player,
  onClose,
  onOpenNote,
  onOpenUpload,
  onReRecord,
  onExport,
  onShareAudio,
  onDelete,
}: Props) {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const isRTL = lang === "ar";

  if (!meta) return null;

  const uri = getAudioUri(meta.id);
  const isPlaying = player.playingKey === meta.id && player.playMode === "user";
  const isComparing =
    player.playingKey === meta.id && player.playMode === "compare";
  const isSideBySide =
    player.playingKey === meta.id && player.playMode === "side_by_side";
  const isAyah = meta.type === "ayah";

  const playableItem = uri
    ? { key: meta.id, uri, sura: meta.sura, aya: meta.ayaFrom }
    : null;

  const handleMarkerSeek = (tMs: number) => {
    if (!playableItem) return;
    if (player.playingKey === meta.id) {
      player.seekTo(tMs / 1000);
    } else {
      player.togglePlay(playableItem);
      setTimeout(() => player.seekTo(tMs / 1000), 400);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
          ]}
        >
          {/* Header info */}
          <View style={[styles.headerRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isAyah ? `${ACCENT}22` : "#33669922" },
              ]}
            >
              <Ionicons
                name={isAyah ? "mic" : "radio"}
                size={20}
                color={isAyah ? ACCENT : "#336699"}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
              <Text style={[styles.rangeTitle, { color: theme.color }]}>
                {rangeLabel(meta.sura, meta.ayaFrom, meta.ayaTo, lang)}
              </Text>
              <Text style={[styles.subInfo, { color: theme.subColor }]}>
                {t(meta.riwaya, lang)}
                {" · "}
                {formatDuration(meta.durationMs)}
                {" · "}
                {formatDate(meta.createdAt, lang)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={theme.subColor} />
            </TouchableOpacity>
          </View>

          {/* Upload badge */}
          {meta.upload ? (
            <View style={[styles.uploadedRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Ionicons name="cloud-done" size={14} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 12 }}>
                {t("already_uploaded", lang)}
              </Text>
            </View>
          ) : null}

          {/* Session markers */}
          {meta.markers && meta.markers.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.markersRow}
            >
              {meta.markers.map((m, i) => (
                <TouchableOpacity
                  key={`${m.aya}-${i}`}
                  style={[styles.markerChip, { borderColor: theme.borderColor }]}
                  onPress={() => handleMarkerSeek(m.tMs)}
                >
                  <Text style={{ color: theme.color, fontSize: 13 }}>
                    ﴿{isRTL ? toArabicNum(m.aya) : m.aya}﴾
                  </Text>
                  <Text style={{ color: theme.subColor, fontSize: 10 }}>
                    {formatDuration(m.tMs)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {/* Note preview */}
          {meta.noteText ? (
            <View
              style={[
                styles.notePreview,
                { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor },
              ]}
            >
              <Ionicons name="document-text-outline" size={14} color={theme.subColor} />
              <Text
                style={{ color: theme.subColor, fontSize: 12, flex: 1, textAlign: isRTL ? "right" : "left" }}
                numberOfLines={2}
              >
                {meta.noteText}
              </Text>
            </View>
          ) : null}

          {/* Action grid */}
          <View style={styles.grid}>
            <ActionBtn
              icon={isPlaying ? "stop" : "play"}
              label={isPlaying ? t("stop_playback", lang) : t("play_last", lang)}
              color={ACCENT}
              theme={theme}
              disabled={!playableItem}
              onPress={() => playableItem && player.togglePlay(playableItem)}
            />
            {isAyah ? (
              <ActionBtn
                icon="headset"
                label={t("compare", lang)}
                color="#336699"
                theme={theme}
                active={isComparing}
                onPress={() =>
                  playableItem && player.playComparison(playableItem)
                }
              />
            ) : null}
            {isAyah ? (
              <ActionBtn
                icon="git-compare-outline"
                label={t("side_by_side", lang)}
                color="#ef6c00"
                theme={theme}
                active={isSideBySide}
                onPress={() =>
                  playableItem && player.playSideBySide(playableItem)
                }
              />
            ) : null}
            {isAyah ? (
              <ActionBtn
                icon="mic"
                label={t("re_record", lang)}
                color={RECORDING_COLOR}
                theme={theme}
                onPress={() => onReRecord(meta)}
              />
            ) : null}
            <ActionBtn
              icon={
                meta.noteText || meta.hasVoiceNote
                  ? "document-text"
                  : "document-text-outline"
              }
              label={t("note", lang)}
              color="#8e24aa"
              theme={theme}
              onPress={() => onOpenNote(meta)}
            />
            <ActionBtn
              icon="share-social-outline"
              label={t("share_audio_file", lang)}
              color={theme.color}
              theme={theme}
              onPress={() => onShareAudio(meta)}
            />
            <ActionBtn
              icon="archive-outline"
              label={t("share_backup_file", lang)}
              color={theme.color}
              theme={theme}
              onPress={() => onExport(meta)}
            />
            <ActionBtn
              icon={meta.upload ? "cloud-done" : "cloud-upload-outline"}
              label={
                meta.upload
                  ? t("share_link", lang)
                  : t("upload_share_link", lang)
              }
              color={ACCENT}
              theme={theme}
              onPress={() => onOpenUpload(meta)}
            />
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: RECORDING_COLOR }]}
            onPress={() => onDelete(meta)}
          >
            <Ionicons name="trash-outline" size={16} color={RECORDING_COLOR} />
            <Text style={{ color: RECORDING_COLOR, fontSize: 14, fontWeight: "600" }}>
              {t("delete", lang)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  theme,
  onPress,
  disabled,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  theme: { cardColor: string; borderColor: string; subColor: string; color: string };
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        {
          borderColor: active ? color : theme.borderColor,
          backgroundColor: active ? `${color}18` : "transparent",
          opacity: disabled ? 0.4 : 1,
        },
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text
        style={[styles.actionLabel, { color: theme.color }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  headerRow: { alignItems: "center", gap: 10 },
  typeBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeTitle: { fontSize: 17, fontWeight: "800" },
  subInfo: { fontSize: 12, marginTop: 2 },
  uploadedRow: { alignItems: "center", gap: 4 },
  markersRow: { gap: 6, paddingVertical: 2 },
  markerChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  notePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  actionBtn: {
    width: "30%",
    minWidth: 96,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  actionLabel: { fontSize: 11, textAlign: "center" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
});
