import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { t } from "../../i18n";
import { useAppStore, useTheme } from "../../store/useAppStore";
import { ACCENT, RECORDING_COLOR } from "../../theme/themes";
import { rangeLabel } from "../../utils/quranText";
import {
  getAudioUri,
  setUploadInfo,
  type RecitationMeta,
} from "../../utils/recitationsStore";
import { deleteUpload, uploadRecitation } from "../../utils/serverApi";

interface Props {
  meta: RecitationMeta | null;
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
}

type Phase = "form" | "uploading" | "done" | "error";

/** Upload a recitation to the configured server and share the link. */
export function UploadModal({ meta, visible, onClose, onChanged }: Props) {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const serverUrl = useAppStore((s) => s.serverUrl);
  const uploaderName = useAppStore((s) => s.uploaderName);
  const setUploaderName = useAppStore((s) => s.setUploaderName);
  const isRTL = lang === "ar";

  const [phase, setPhase] = useState<Phase>("form");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && meta) {
      if (meta.upload) {
        setPhase("done");
        setShareUrl(meta.upload.url);
      } else {
        setPhase("form");
        setTitle(rangeLabel(meta.sura, meta.ayaFrom, meta.ayaTo, lang));
        setName(uploaderName);
        setIsPublic(true);
      }
      setProgress(0);
      setCopied(false);
    }
  }, [visible, meta, lang, uploaderName]);

  if (!meta) return null;

  const handleUpload = async () => {
    const fileUri = getAudioUri(meta.id);
    if (!fileUri || !serverUrl.trim()) return;
    setPhase("uploading");
    setProgress(0);
    try {
      const info = await uploadRecitation(serverUrl, {
        meta,
        fileUri,
        title: title.trim() || rangeLabel(meta.sura, meta.ayaFrom, meta.ayaTo, lang),
        reciterName: name.trim(),
        isPublic,
        onProgress: setProgress,
      });
      setUploadInfo(meta.id, info);
      if (name.trim() && name.trim() !== uploaderName) {
        setUploaderName(name.trim());
      }
      setShareUrl(info.url);
      setPhase("done");
      onChanged();
    } catch {
      setPhase("error");
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    Share.share({ message: shareUrl }).catch(() => {});
  };

  const handleRemove = async () => {
    if (!meta.upload) return;
    const ok = await deleteUpload(meta.upload);
    if (ok) {
      setUploadInfo(meta.id, null);
      onChanged();
      setPhase("form");
      setTitle(rangeLabel(meta.sura, meta.ayaFrom, meta.ayaTo, lang));
      setName(uploaderName);
    }
  };

  const serverMissing = !serverUrl.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
          ]}
        >
          <View style={[styles.headerRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Ionicons name="cloud-upload-outline" size={22} color={ACCENT} />
            <Text style={[styles.title, { color: theme.color }]}>
              {t("upload_title", lang)}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={theme.subColor} />
            </TouchableOpacity>
          </View>

          {phase === "form" ? (
            serverMissing ? (
              <View style={styles.centerBox}>
                <Ionicons name="server-outline" size={36} color={theme.subColor} />
                <Text style={[styles.infoText, { color: theme.color }]}>
                  {t("server_not_set", lang)}
                </Text>
                <Text style={[styles.hintText, { color: theme.subColor }]}>
                  {t("configure_server", lang)}
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.subColor, textAlign: isRTL ? "right" : "left" }]}>
                  {t("sura", lang)}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.color, borderColor: theme.borderColor, textAlign: isRTL ? "right" : "left" },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={200}
                />
                <Text style={[styles.label, { color: theme.subColor, textAlign: isRTL ? "right" : "left" }]}>
                  {t("your_name", lang)}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.color, borderColor: theme.borderColor, textAlign: isRTL ? "right" : "left" },
                  ]}
                  value={name}
                  onChangeText={setName}
                  maxLength={80}
                  placeholder={t("your_name_placeholder", lang)}
                  placeholderTextColor={theme.subColor}
                />
                <View style={[styles.switchRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[styles.switchLabel, { color: theme.color }]}>
                      {t("publish_public", lang)}
                    </Text>
                    <Text style={[styles.hintText, { color: theme.subColor }]}>
                      {t("publish_public_hint", lang)}
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ true: ACCENT }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.mainBtn, { backgroundColor: ACCENT }]}
                  onPress={handleUpload}
                >
                  <Ionicons name="cloud-upload" size={18} color="#fff" />
                  <Text style={styles.mainBtnText}>{t("upload_button", lang)}</Text>
                </TouchableOpacity>
              </>
            )
          ) : null}

          {phase === "uploading" ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={[styles.infoText, { color: theme.color }]}>
                {t("uploading", lang)} {Math.round(progress * 100)}%
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: theme.borderColor }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: ACCENT, width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}

          {phase === "done" ? (
            <View style={styles.centerBox}>
              <Ionicons name="checkmark-circle" size={40} color={ACCENT} />
              <Text style={[styles.infoText, { color: theme.color }]}>
                {t("upload_success", lang)}
              </Text>
              <Text
                style={[styles.linkText, { color: ACCENT }]}
                numberOfLines={2}
              >
                {shareUrl}
              </Text>
              <View style={[styles.btnRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <SmallBtn
                  icon="copy-outline"
                  label={copied ? t("copied", lang) : t("copy_link", lang)}
                  color={ACCENT}
                  onPress={handleCopy}
                />
                <SmallBtn
                  icon="share-social-outline"
                  label={t("share_link", lang)}
                  color={ACCENT}
                  onPress={handleShareLink}
                />
              </View>
              <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={14} color={RECORDING_COLOR} />
                <Text style={{ color: RECORDING_COLOR, fontSize: 12 }}>
                  {t("remove_from_server", lang)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {phase === "error" ? (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle" size={40} color={RECORDING_COLOR} />
              <Text style={[styles.infoText, { color: theme.color }]}>
                {t("upload_failed", lang)}
              </Text>
              <TouchableOpacity
                style={[styles.mainBtn, { backgroundColor: ACCENT }]}
                onPress={() => setPhase("form")}
              >
                <Text style={styles.mainBtnText}>{t("retry", lang)}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function SmallBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.smallBtn, { borderColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color, fontSize: 13, fontWeight: "600" }}>{label}</Text>
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
    padding: 20,
    gap: 8,
    minHeight: 280,
  },
  headerRow: { alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800", flex: 1 },
  label: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  switchRow: { alignItems: "center", gap: 10, marginTop: 10 },
  switchLabel: { fontSize: 14, fontWeight: "600" },
  hintText: { fontSize: 11, marginTop: 2 },
  mainBtn: {
    flexDirection: "row",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  mainBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  centerBox: { alignItems: "center", gap: 10, paddingVertical: 16 },
  infoText: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  linkText: { fontSize: 13, textAlign: "center", paddingHorizontal: 8 },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },
  btnRow: { gap: 10, marginTop: 6 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
});
