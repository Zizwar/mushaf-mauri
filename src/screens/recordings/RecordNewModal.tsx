import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ScrollView,
  Platform,
} from "react-native";
import {
  useAudioRecorder,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { allSuwar, getAyahCount, getSuraName } from "../../utils/quranHelpers";
import { getAyahText } from "../../utils/ayahText";
import { saveRecording } from "../../utils/recordings";
import { styles, ACCENT, RECORDING_COLOR } from "./styles";
import type { RecordMode } from "./types";
import type { LangKey } from "../../i18n";
import type { Quira } from "../../store/useAppStore";

interface Props {
  visible: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  cardBg: string;
  inputBg: string;
  lang: LangKey;
  quira: Quira;
  activeProfileId: string | null;
  onClose: () => void;
  onRecordingSaved: () => void;
}

export default function RecordNewModal({
  visible,
  isDark,
  textColor,
  mutedColor,
  borderColor,
  cardBg,
  inputBg,
  lang,
  quira,
  activeProfileId,
  onClose,
  onRecordingSaved,
}: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [selectedSura, setSelectedSura] = useState<number | null>(null);
  const [selectedAya, setSelectedAya] = useState<number | null>(null);
  const [recordMode, setRecordMode] = useState<RecordMode>("tap");
  const [isRecording, setIsRecording] = useState(false);
  const [currentAyaText, setCurrentAyaText] = useState("");
  const isRecordingRef = useRef(false);

  const suwar = allSuwar();
  const ayahCount = selectedSura ? getAyahCount(selectedSura) : 0;

  // Load aya text when selection changes
  useEffect(() => {
    if (selectedSura && selectedAya) {
      getAyahText(selectedSura, selectedAya, quira).then((txt) =>
        setCurrentAyaText(txt ?? "")
      );
    } else {
      setCurrentAyaText("");
    }
  }, [selectedSura, selectedAya, quira]);

  const startRecording = useCallback(async () => {
    if (!activeProfileId || !selectedSura || !selectedAya) return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return;

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        allowsRecording: true,
        interruptionMode: "doNotMix",
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch {
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [activeProfileId, selectedSura, selectedAya, recorder]);

  const stopAndSave = useCallback(async () => {
    if (!activeProfileId || !selectedSura || !selectedAya) return;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        saveRecording(uri, selectedSura, selectedAya, quira, activeProfileId);
        onRecordingSaved();
      }
    } catch {
      // ignore
    }
    setIsRecording(false);
    isRecordingRef.current = false;

    // Auto-advance to next aya
    const total = getAyahCount(selectedSura);
    if (selectedAya < total) {
      setSelectedAya(selectedAya + 1);
    }
  }, [activeProfileId, selectedSura, selectedAya, quira, recorder, onRecordingSaved]);

  const handleTapRecord = useCallback(() => {
    if (isRecording) {
      stopAndSave();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopAndSave]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      // Stop recording before closing
      recorder.stop().catch(() => {});
      setIsRecording(false);
      isRecordingRef.current = false;
    }
    setSelectedSura(null);
    setSelectedAya(null);
    onClose();
  }, [isRecording, recorder, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable
          style={[styles.recordNewSheet, { backgroundColor: cardBg }]}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={styles.modalHandle}>
            <View style={[styles.handleBar, { backgroundColor: borderColor }]} />
          </View>

          <Text style={[styles.modalTitle, { color: textColor }]}>
            {t("record_new", lang)}
          </Text>

          {!selectedSura ? (
            /* Step 1: Pick a sura */
            <FlatList
              data={suwar}
              keyExtractor={(item) => String(item.value)}
              style={styles.suraPickerList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.suraPickerItem, { borderBottomColor: borderColor }]}
                  onPress={() => {
                    setSelectedSura(item.value);
                    setSelectedAya(1);
                  }}
                >
                  <Text style={[{ color: ACCENT, fontSize: 13, fontWeight: "700" }]}>
                    {item.value}
                  </Text>
                  <Text style={[{ color: textColor, fontSize: 15, fontWeight: "600", flex: 1, textAlign: "right" }]}>
                    {item.label}
                  </Text>
                  <Text style={[{ color: mutedColor, fontSize: 12 }]}>
                    {getAyahCount(item.value)} {t("aya_s", lang)}
                  </Text>
                </Pressable>
              )}
            />
          ) : !selectedAya ? (
            /* Step 2: Pick an aya */
            <View>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
                onPress={() => setSelectedSura(null)}
              >
                <Ionicons name="arrow-back" size={20} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 15, fontWeight: "600" }}>
                  {getSuraName(selectedSura)}
                </Text>
              </Pressable>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                <View style={styles.ayaGrid}>
                  {Array.from({ length: ayahCount }, (_, i) => i + 1).map((aya) => (
                    <Pressable
                      key={aya}
                      style={[
                        styles.ayaGridItem,
                        { borderColor, backgroundColor: inputBg },
                      ]}
                      onPress={() => setSelectedAya(aya)}
                    >
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: "600" }}>
                        {aya}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            /* Step 3: Recording interface */
            <View style={{ paddingHorizontal: 16 }}>
              {/* Back + sura info */}
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", paddingBottom: 8, gap: 8 }}
                onPress={() => {
                  if (isRecording) return;
                  setSelectedSura(null);
                  setSelectedAya(null);
                }}
              >
                <Ionicons name="arrow-back" size={20} color={isRecording ? mutedColor : ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 15, fontWeight: "600" }}>
                  {getSuraName(selectedSura)}
                </Text>
              </Pressable>

              {/* Progress */}
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center", marginBottom: 8 }}>
                {t("recording_aya", lang)} {selectedAya} / {ayahCount}
              </Text>

              {/* Aya text */}
              <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                <Text
                  style={{
                    fontSize: 20,
                    lineHeight: 36,
                    textAlign: "right",
                    writingDirection: "rtl",
                    color: textColor,
                    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
                    paddingVertical: 8,
                  }}
                >
                  {currentAyaText}
                </Text>
              </ScrollView>

              {/* Mode toggle */}
              <View style={styles.modeToggle}>
                <Pressable
                  style={[
                    styles.modeToggleBtn,
                    {
                      borderColor: recordMode === "tap" ? ACCENT : borderColor,
                      backgroundColor: recordMode === "tap" ? (isDark ? "rgba(26,92,46,0.2)" : "rgba(26,92,46,0.08)") : "transparent",
                    },
                  ]}
                  onPress={() => { if (!isRecording) setRecordMode("tap"); }}
                >
                  <Ionicons name="finger-print-outline" size={18} color={recordMode === "tap" ? ACCENT : mutedColor} />
                  <Text style={{ color: recordMode === "tap" ? ACCENT : mutedColor, fontWeight: "600", fontSize: 13 }}>
                    {t("tap_mode", lang)}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modeToggleBtn,
                    {
                      borderColor: recordMode === "hold" ? ACCENT : borderColor,
                      backgroundColor: recordMode === "hold" ? (isDark ? "rgba(26,92,46,0.2)" : "rgba(26,92,46,0.08)") : "transparent",
                    },
                  ]}
                  onPress={() => { if (!isRecording) setRecordMode("hold"); }}
                >
                  <Ionicons name="hand-left-outline" size={18} color={recordMode === "hold" ? ACCENT : mutedColor} />
                  <Text style={{ color: recordMode === "hold" ? ACCENT : mutedColor, fontWeight: "600", fontSize: 13 }}>
                    {t("hold_mode", lang)}
                  </Text>
                </Pressable>
              </View>

              {/* Record button */}
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                {recordMode === "tap" ? (
                  <Pressable
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: isRecording ? RECORDING_COLOR : "#e53935",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 4,
                      borderColor: isRecording ? "#b71c1c" : "#ef9a9a",
                    }}
                    onPress={handleTapRecord}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={32}
                      color="#fff"
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: isRecording ? RECORDING_COLOR : "#e53935",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 4,
                      borderColor: isRecording ? "#b71c1c" : "#ef9a9a",
                    }}
                    onPressIn={startRecording}
                    onPressOut={() => {
                      if (isRecordingRef.current) stopAndSave();
                    }}
                  >
                    <Ionicons
                      name={isRecording ? "mic" : "hand-left"}
                      size={32}
                      color="#fff"
                    />
                  </Pressable>
                )}
                <Text style={{ color: mutedColor, fontSize: 12, marginTop: 8 }}>
                  {recordMode === "tap"
                    ? isRecording
                      ? t("tap_to_stop", lang)
                      : t("tap_to_record", lang)
                    : t("hold_to_record", lang)}
                </Text>
              </View>
            </View>
          )}

          {/* Close */}
          <Pressable
            style={[styles.profileModalClose, { borderTopColor: borderColor }]}
            onPress={handleClose}
          >
            <Text style={[styles.profileModalCloseText, { color: ACCENT }]}>
              {t("close", lang)}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
