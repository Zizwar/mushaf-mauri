import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, type Quira } from "../store/useAppStore";
import { t } from "../i18n";
import {
  countDownloadedPages,
  downloadPageRange,
  deleteAllCachedImages,
  abortDownload,
} from "../utils/imageCache";
import { invalidateImageCacheSet } from "../components/QuranPage";
import { listRecordings, deleteAllRecordings } from "../utils/recordings";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ACCENT = "#1a5c2e";
const TOTAL_PAGES = 604;

interface SettingsScreenProps {
  onGoBack: () => void;
}

export default function SettingsScreen({ onGoBack }: SettingsScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const setQuira = useAppStore((s) => s.setQuira);
  const imageDownloadProgress = useAppStore((s) => s.imageDownloadProgress);
  const setImageDownloadProgress = useAppStore(
    (s) => s.setImageDownloadProgress
  );
  const clearRecordedAyahs = useAppStore((s) => s.clearRecordedAyahs);

  const [cachedCount, setCachedCount] = useState(0);
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState(String(TOTAL_PAGES));
  const [recordingCount, setRecordingCount] = useState(0);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "#2a2a3e" : "#e0e0e0";
  const inputBg = isDark ? "#2a2a3e" : "#f0f0f0";

  const progress = imageDownloadProgress[quira];

  // Load counts on mount and quira change
  useEffect(() => {
    setCachedCount(countDownloadedPages(quira));
    setRecordingCount(listRecordings(quira).length);
  }, [quira]);

  const handleDownload = useCallback(async () => {
    const from = Math.max(1, Math.min(TOTAL_PAGES, parseInt(fromPage) || 1));
    const to = Math.max(from, Math.min(TOTAL_PAGES, parseInt(toPage) || TOTAL_PAGES));
    const total = to - from + 1;

    setImageDownloadProgress(quira, {
      isDownloading: true,
      downloaded: 0,
      total,
    });

    await downloadPageRange(quira, from, to, (downloaded, t) => {
      setImageDownloadProgress(quira, {
        isDownloading: true,
        downloaded,
        total: t,
      });
    });

    setImageDownloadProgress(quira, {
      isDownloading: false,
      downloaded: 0,
      total: TOTAL_PAGES,
    });

    invalidateImageCacheSet(quira);
    setCachedCount(countDownloadedPages(quira));
  }, [quira, fromPage, toPage, setImageDownloadProgress]);

  const handleAbort = useCallback(() => {
    abortDownload();
    setImageDownloadProgress(quira, {
      isDownloading: false,
      downloaded: 0,
      total: TOTAL_PAGES,
    });
  }, [quira, setImageDownloadProgress]);

  const handleDeleteDownloads = useCallback(() => {
    Alert.alert(
      t("delete_downloads", lang),
      t("confirm_delete_downloads", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("yes", lang),
          style: "destructive",
          onPress: () => {
            deleteAllCachedImages(quira);
            invalidateImageCacheSet(quira);
            setCachedCount(0);
          },
        },
      ]
    );
  }, [quira, lang]);

  const handleDeleteRecordings = useCallback(() => {
    Alert.alert(
      t("delete_all_recordings", lang),
      t("confirm_delete_recordings", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("yes", lang),
          style: "destructive",
          onPress: () => {
            deleteAllRecordings(quira);
            clearRecordedAyahs();
            setRecordingCount(0);
          },
        },
      ]
    );
  }, [quira, lang, clearRecordedAyahs]);

  const progressFraction =
    progress.isDownloading && progress.total > 0
      ? progress.downloaded / progress.total
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("settings", lang)}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mushaf Selector */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("mosshaf_type", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.mushafRow}>
            {(["madina", "warsh"] as Quira[]).map((q) => (
              <Pressable
                key={q}
                style={[
                  styles.mushafChip,
                  {
                    borderColor: quira === q ? ACCENT : borderColor,
                    backgroundColor:
                      quira === q
                        ? isDark
                          ? "#1a3a2e"
                          : "#e8f5e9"
                        : "transparent",
                  },
                ]}
                onPress={() => setQuira(q)}
              >
                {quira === q && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={ACCENT}
                  />
                )}
                <Text
                  style={[
                    styles.mushafChipText,
                    {
                      color: quira === q ? ACCENT : textColor,
                      fontWeight: quira === q ? "700" : "400",
                    },
                  ]}
                >
                  {t(
                    q === "madina" ? "mosshaf_hafs" : "mosshaf_warsh",
                    lang
                  )}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Download Section */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("download_images", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Status */}
          <View style={styles.statusRow}>
            <Ionicons
              name={
                cachedCount >= TOTAL_PAGES
                  ? "cloud-done-outline"
                  : "cloud-download-outline"
              }
              size={22}
              color={cachedCount >= TOTAL_PAGES ? "#4caf50" : ACCENT}
            />
            <Text style={[styles.statusText, { color: textColor }]}>
              {t("downloaded_pages", lang)}: {cachedCount} / {TOTAL_PAGES}
            </Text>
          </View>

          {/* Progress bar */}
          <View
            style={[styles.progressTrack, { backgroundColor: inputBg }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: ACCENT,
                  width: progress.isDownloading
                    ? `${Math.min(progressFraction * 100, 100)}%` as any
                    : `${Math.min((cachedCount / TOTAL_PAGES) * 100, 100)}%` as any,
                },
              ]}
            />
          </View>

          {progress.isDownloading && (
            <Text style={[styles.progressText, { color: mutedColor }]}>
              {t("downloading", lang)} {progress.downloaded}/{progress.total}
            </Text>
          )}

          {/* Page range inputs */}
          {!progress.isDownloading && (
            <View style={styles.rangeRow}>
              <View style={styles.rangeInput}>
                <Text style={[styles.rangeLabel, { color: mutedColor }]}>
                  {t("from_page", lang)}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      color: textColor,
                      borderColor,
                    },
                  ]}
                  value={fromPage}
                  onChangeText={setFromPage}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.rangeInput}>
                <Text style={[styles.rangeLabel, { color: mutedColor }]}>
                  {t("to_page", lang)}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      color: textColor,
                      borderColor,
                    },
                  ]}
                  value={toPage}
                  onChangeText={setToPage}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            {progress.isDownloading ? (
              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={handleAbort}
              >
                <Ionicons name="stop-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>
                  {t("abort_download", lang)}
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={[styles.btn, { backgroundColor: ACCENT }]}
                  onPress={handleDownload}
                >
                  <Ionicons
                    name="cloud-download-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.btnText}>
                    {t("download_all", lang)}
                  </Text>
                </Pressable>
                {cachedCount > 0 && (
                  <Pressable
                    style={[styles.btn, styles.btnDanger]}
                    onPress={handleDeleteDownloads}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>
                      {t("delete_downloads", lang)}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        {/* Recordings Section */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("my_recordings", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.statusRow}>
            <Ionicons name="mic-outline" size={22} color={ACCENT} />
            <Text style={[styles.statusText, { color: textColor }]}>
              {t("recorded_ayahs", lang)}: {recordingCount}
            </Text>
          </View>

          {recordingCount > 0 && (
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={handleDeleteRecordings}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>
                  {t("delete_all_recordings", lang)}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  mushafRow: {
    flexDirection: "row",
    gap: 10,
  },
  mushafChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  mushafChipText: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDanger: {
    backgroundColor: "#d32f2f",
  },
});
