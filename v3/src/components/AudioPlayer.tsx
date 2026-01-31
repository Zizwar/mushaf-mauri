import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { Audio } from "expo-av";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import { getAudioKsuUri } from "../utils/api";
import { getNextAya, getPrevAya } from "../utils/coordinates";
// @ts-ignore
import { QuranData } from "../data/quranData";
// @ts-ignore
import { listVoiceMoqri } from "../data/listAuthor";

interface AudioPlayerProps {
  onScrollToPage: (page: number) => void;
}

export default function AudioPlayer({ onScrollToPage }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [showReciterModal, setShowReciterModal] = useState(false);

  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const moqriId = useAppStore((s) => s.moqriId);
  const selectedAya = useAppStore((s) => s.selectedAya);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setMoqriId = useAppStore((s) => s.setMoqriId);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);

  const translations = React.useMemo(() => {
    const loc: Record<string, string> = {};
    // Build a minimal translations object for listVoiceMoqri
    const keys = [
      "recite_hudhaify", "recite_husary", "recite_basfar", "recite_ayyoub",
      "recite_minshawy", "recite_abdul_basit", "recite_banna", "recite_tablawy",
      "recite_jaber", "recite_afasy", "recite_shaatree", "recite_qatami",
      "recite_khaleefa", "recite_salamah", "recite_jibreel", "recite_ghamadi",
      "recite_sudais", "recite_shuraym", "recite_maher", "recite_ajamy",
      "recite_juhanee", "recite_muhsin", "recite_abbad", "recite_yaser",
      "recite_rifai", "recite_ayman", "recite_moalim", "recite_mujawwad",
      "recite_warsh", "recite_ibrahim_dosary", "recite_yassin",
    ];
    for (const key of keys) {
      loc[key] = t(key, lang);
    }
    return loc;
  }, [lang]);

  const reciters = React.useMemo(() => listVoiceMoqri(translations), [translations]);

  const suraName = selectedAya
    ? (QuranData.Sura[selectedAya.sura]?.[0] ?? `${selectedAya.sura}`)
    : "";

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const playAya = useCallback(async (sura: number, aya: number, page: number) => {
    await cleanup();

    const uri = getAudioKsuUri(moqriId, sura, aya);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          playNextAya(sura, aya);
        }
      });
    } catch {
      setIsPlaying(false);
    }
  }, [moqriId, cleanup, setIsPlaying]);

  const playNextAya = useCallback(async (currentSura: number, currentAya: number) => {
    const next = getNextAya(currentSura, currentAya, quira);
    if (!next) {
      setIsPlaying(false);
      return;
    }

    setSelectedAya({
      sura: next.sura,
      aya: next.aya,
      page: next.page,
      id: `s${next.sura}a${next.aya}z`,
    });

    onScrollToPage(next.page);
    await playAya(next.sura, next.aya, next.page);
  }, [quira, setSelectedAya, setIsPlaying, onScrollToPage, playAya]);

  const handlePlay = useCallback(async () => {
    if (!selectedAya) return;
    if (isPlaying) {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } else {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.positionMillis > 0) {
            await soundRef.current.playAsync();
            setIsPlaying(true);
            return;
          }
        } catch {}
      }
      await playAya(selectedAya.sura, selectedAya.aya, selectedAya.page);
    }
  }, [selectedAya, isPlaying, setIsPlaying, playAya]);

  const handleNext = useCallback(async () => {
    if (!selectedAya) return;
    await cleanup();
    const next = getNextAya(selectedAya.sura, selectedAya.aya, quira);
    if (!next) return;
    setSelectedAya({
      sura: next.sura, aya: next.aya, page: next.page,
      id: `s${next.sura}a${next.aya}z`,
    });
    onScrollToPage(next.page);
    if (isPlaying) {
      await playAya(next.sura, next.aya, next.page);
    }
  }, [selectedAya, quira, isPlaying, cleanup, setSelectedAya, onScrollToPage, playAya]);

  const handlePrev = useCallback(async () => {
    if (!selectedAya) return;
    await cleanup();
    const prev = getPrevAya(selectedAya.sura, selectedAya.aya, quira);
    if (!prev) return;
    setSelectedAya({
      sura: prev.sura, aya: prev.aya, page: prev.page,
      id: `s${prev.sura}a${prev.aya}z`,
    });
    onScrollToPage(prev.page);
    if (isPlaying) {
      await playAya(prev.sura, prev.aya, prev.page);
    }
  }, [selectedAya, quira, isPlaying, cleanup, setSelectedAya, onScrollToPage, playAya]);

  const handleStop = useCallback(async () => {
    await cleanup();
    setIsPlaying(false);
  }, [cleanup, setIsPlaying]);

  if (!selectedAya) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.infoRow}>
          <Text style={styles.infoText} numberOfLines={1}>
            {suraName} : {selectedAya.aya}
          </Text>
          <Pressable onPress={() => setShowReciterModal(true)} style={styles.reciterBtn}>
            <Text style={styles.reciterText} numberOfLines={1}>🎙</Text>
          </Pressable>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={handlePrev} style={styles.btn}>
            <Text style={styles.btnText}>⏮</Text>
          </Pressable>

          <Pressable onPress={handlePlay} style={[styles.btn, styles.playBtn]}>
            <Text style={styles.playBtnText}>{isPlaying ? "⏸" : "▶"}</Text>
          </Pressable>

          <Pressable onPress={handleNext} style={styles.btn}>
            <Text style={styles.btnText}>⏭</Text>
          </Pressable>

          <Pressable onPress={handleStop} style={styles.btn}>
            <Text style={styles.btnText}>⏹</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={showReciterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("chooseQaree", lang)}</Text>
            <FlatList
              data={reciters}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  style={[
                    styles.reciterItem,
                    moqriId === item.id && styles.reciterItemActive,
                  ]}
                  onPress={() => {
                    setMoqriId(item.id);
                    setShowReciterModal(false);
                    if (isPlaying && selectedAya) {
                      cleanup().then(() => {
                        playAya(selectedAya.sura, selectedAya.aya, selectedAya.page);
                      });
                    }
                  }}
                >
                  <Text style={[
                    styles.reciterItemText,
                    moqriId === item.id && styles.reciterItemTextActive,
                  ]}>
                    {item.voice}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              style={styles.modalClose}
              onPress={() => setShowReciterModal(false)}
            >
              <Text style={styles.modalCloseText}>{t("close", lang)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  reciterBtn: {
    padding: 4,
  },
  reciterText: {
    fontSize: 18,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4285f4",
  },
  playBtnText: {
    color: "#fff",
    fontSize: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#333",
  },
  reciterItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  reciterItemActive: {
    backgroundColor: "#e8f0fe",
  },
  reciterItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },
  reciterItemTextActive: {
    color: "#4285f4",
    fontWeight: "600",
  },
  modalClose: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#4285f4",
    fontWeight: "600",
  },
});
