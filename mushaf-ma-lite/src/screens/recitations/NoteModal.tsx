import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { useAppStore, useTheme } from "../../store/useAppStore";
import { ACCENT, RECORDING_COLOR } from "../../theme/themes";
import {
  attachVoiceNote,
  deleteVoiceNote,
  getVoiceNoteUri,
  saveTextNote,
  type RecitationMeta,
} from "../../utils/recitationsStore";
import { useQuranRecorder } from "../../hooks/useQuranRecorder";
import { usePlayer } from "../../hooks/usePlayer";
import { formatDuration } from "../../utils/format";

interface Props {
  meta: RecitationMeta | null;
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
}

/** Text + voice note editor for a recitation. */
export function NoteModal({ meta, visible, onClose, onChanged }: Props) {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const isRTL = lang === "ar";

  const [text, setText] = useState("");
  const [hasVoice, setHasVoice] = useState(false);

  const { recorderState, isTaking, startTake, stopTake, discardTake } =
    useQuranRecorder();
  const player = usePlayer("");

  useEffect(() => {
    if (visible && meta) {
      setText(meta.noteText ?? "");
      setHasVoice(!!meta.hasVoiceNote && !!getVoiceNoteUri(meta.id));
    }
  }, [visible, meta]);

  if (!meta) return null;

  const noteKey = `note-${meta.id}`;
  const isPlayingNote = player.playingKey === noteKey;

  const handleToggleRecord = async () => {
    if (isTaking) {
      const result = await stopTake();
      if (result) {
        attachVoiceNote(meta.id, result.uri);
        setHasVoice(true);
        onChanged();
      }
    } else {
      player.stopPlayback();
      await startTake();
    }
  };

  const handlePlayNote = () => {
    const uri = getVoiceNoteUri(meta.id);
    if (!uri) return;
    player.togglePlay({ key: noteKey, uri });
  };

  const handleDeleteVoice = () => {
    player.stopPlayback();
    deleteVoiceNote(meta.id);
    setHasVoice(false);
    onChanged();
  };

  const handleSave = () => {
    saveTextNote(meta.id, text);
    onChanged();
    onClose();
  };

  const handleClose = async () => {
    if (isTaking) await discardTake();
    player.stopPlayback();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
          ]}
        >
          <View style={[styles.headerRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Ionicons name="document-text-outline" size={22} color={ACCENT} />
            <Text style={[styles.title, { color: theme.color }]}>
              {t("note", lang)}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.subColor} />
            </TouchableOpacity>
          </View>

          {/* Text note */}
          <Text style={[styles.sectionLabel, { color: theme.subColor, textAlign: isRTL ? "right" : "left" }]}>
            {t("text_note", lang)}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.color,
                borderColor: theme.borderColor,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            multiline
            maxLength={500}
            placeholder={t("note_placeholder", lang)}
            placeholderTextColor={theme.subColor}
            value={text}
            onChangeText={setText}
          />

          {/* Voice note */}
          <Text style={[styles.sectionLabel, { color: theme.subColor, textAlign: isRTL ? "right" : "left" }]}>
            {t("voice_note", lang)}
          </Text>
          <View style={[styles.voiceRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <TouchableOpacity
              style={[
                styles.voiceBtn,
                {
                  backgroundColor: isTaking ? RECORDING_COLOR : "transparent",
                  borderColor: isTaking ? RECORDING_COLOR : ACCENT,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              onPress={handleToggleRecord}
            >
              <Ionicons
                name={isTaking ? "stop" : "mic"}
                size={18}
                color={isTaking ? "#fff" : ACCENT}
              />
              <Text style={{ color: isTaking ? "#fff" : ACCENT, fontSize: 13, fontWeight: "600" }}>
                {isTaking
                  ? `${t("stop_voice_note", lang)} ${formatDuration(recorderState.durationMillis)}`
                  : t("record_voice_note", lang)}
              </Text>
            </TouchableOpacity>

            {hasVoice && !isTaking ? (
              <>
                <TouchableOpacity
                  style={[styles.voiceIconBtn, { borderColor: ACCENT }]}
                  onPress={handlePlayNote}
                >
                  <Ionicons
                    name={isPlayingNote ? "stop" : "play"}
                    size={18}
                    color={ACCENT}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voiceIconBtn, { borderColor: RECORDING_COLOR }]}
                  onPress={handleDeleteVoice}
                >
                  <Ionicons name="trash-outline" size={18} color={RECORDING_COLOR} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: ACCENT }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{t("save_note", lang)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    padding: 20,
    gap: 8,
  },
  headerRow: { alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800", flex: 1 },
  closeBtn: { padding: 4 },
  sectionLabel: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    fontSize: 14,
    textAlignVertical: "top",
  },
  voiceRow: { alignItems: "center", gap: 10 },
  voiceBtn: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  voiceIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 12,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
