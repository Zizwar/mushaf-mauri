import React, { useState, useEffect, useCallback, useRef } from "react";
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
import {
  initWarshDB,
  getWarshRecitors,
  type WarshRecitor,
} from "../utils/warshAudioDB";
import { getWarshAudioUri } from "../utils/api";
import { File, Directory, Paths } from "expo-file-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ACCENT = "#1a5c2e";
const TOTAL_PAGES = 604;

interface SettingsScreenProps {
  onGoBack: () => void;
  onNavigate?: (screen: string) => void;
}

const FONT_OPTIONS = [
  { key: "default", labelKey: "standard_font" },
  { key: "Maghribi", labelKey: "maghribi_font" },
  { key: "hafs", labelKey: "hafs_font" },
  { key: "rustam", labelKey: "rustam_font" },
  { key: "uthmanic", labelKey: "uthmanic_font" },
];

function FontSelector() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quranFont = useAppStore((s) => s.quranFont);
  const setQuranFont = useAppStore((s) => s.setQuranFont);

  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const borderColor = isDark ? "#2a2a3e" : "#e0e0e0";

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 13, color: isDark ? "#888" : "#999", marginBottom: 4 }}>
        {t("choose_font", lang)}
      </Text>
      {FONT_OPTIONS.map((font) => (
        <Pressable
          key={font.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: quranFont === font.key ? ACCENT : borderColor,
            backgroundColor:
              quranFont === font.key
                ? isDark
                  ? "#1a3a2e"
                  : "#e8f5e9"
                : "transparent",
            gap: 10,
          }}
          onPress={() => setQuranFont(font.key)}
        >
          {quranFont === font.key && (
            <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
          )}
          <Text
            style={{
              fontSize: 15,
              color: quranFont === font.key ? ACCENT : textColor,
              fontWeight: quranFont === font.key ? "700" : "400",
              fontFamily: font.key !== "default" ? font.key : undefined,
            }}
          >
            {t(font.labelKey, lang)}
          </Text>
          {font.key !== "default" && (
            <Text
              style={{
                fontSize: 18,
                color: isDark ? "#aaa" : "#666",
                fontFamily: font.key,
                marginStart: "auto",
              }}
            >
              بسم الله
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ==================== WARSH AUDIO DOWNLOAD ====================

const TOTAL_WARSH_FILES = 120; // 30 hizb × 4 parts per recitor

function WarshAudioDownloader() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const warshRecitorId = useAppStore((s) => s.warshRecitorId);
  const setWarshRecitorId = useAppStore((s) => s.setWarshRecitorId);

  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "#2a2a3e" : "#e0e0e0";
  const inputBg = isDark ? "#2a2a3e" : "#f0f0f0";

  const [recitors, setRecitors] = useState<WarshRecitor[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [cachedFiles, setCachedFiles] = useState(0);
  const abortRef = useRef(false);

  useEffect(() => {
    initWarshDB()
      .then(() => getWarshRecitors())
      .then(setRecitors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    countCachedWarshFiles().then(setCachedFiles);
  }, [warshRecitorId]);

  async function countCachedWarshFiles(): Promise<number> {
    try {
      const recitor = recitors.find((r) => r.recitorId === warshRecitorId);
      if (!recitor) return 0;
      const dir = new Directory(Paths.document, `warsh-audio/${recitor.folder}`);
      if (!dir.exists) return 0;
      // Count .mp3 files in directory
      const entries = dir.list();
      return entries.filter((entry) => entry instanceof File && entry.name.endsWith(".mp3")).length;
    } catch {
      return 0;
    }
  }

  const handleDownload = useCallback(async () => {
    const recitor = recitors.find((r) => r.recitorId === warshRecitorId);
    if (!recitor) return;

    abortRef.current = false;
    setDownloading(true);
    setDownloaded(0);
    setTotal(TOTAL_WARSH_FILES);

    const baseDir = new Directory(Paths.document, "warsh-audio");
    if (!baseDir.exists) baseDir.create();
    const recitorDir = new Directory(baseDir, recitor.folder);
    if (!recitorDir.exists) recitorDir.create();

    let count = 0;
    // Download files: hizb01a.mp3 through hizb30d.mp3
    const parts = ["a", "b", "c", "d"];
    for (let hizb = 1; hizb <= 30; hizb++) {
      for (const part of parts) {
        if (abortRef.current) break;
        const fileName = `hizb${String(hizb).padStart(2, "0")}${part}.mp3`;
        const destFile = new File(recitorDir, fileName);

        if (destFile.exists) {
          count++;
          setDownloaded(count);
          continue;
        }

        try {
          const url = getWarshAudioUri(recitor.folder, fileName);
          const resp = await fetch(url);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            destFile.write(new Uint8Array(buf));
          }
        } catch {}

        count++;
        setDownloaded(count);
      }
      if (abortRef.current) break;
    }

    setDownloading(false);
    countCachedWarshFiles().then(setCachedFiles);
  }, [recitors, warshRecitorId]);

  const handleAbort = useCallback(() => {
    abortRef.current = true;
    setDownloading(false);
  }, []);

  const handleDelete = useCallback(() => {
    const recitor = recitors.find((r) => r.recitorId === warshRecitorId);
    if (!recitor) return;

    Alert.alert(
      t("delete_downloads", lang),
      t("confirm_delete_downloads", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("yes", lang),
          style: "destructive",
          onPress: () => {
            try {
              const dir = new Directory(Paths.document, `warsh-audio/${recitor.folder}`);
              if (dir.exists) dir.delete();
            } catch {}
            setCachedFiles(0);
          },
        },
      ]
    );
  }, [recitors, warshRecitorId, lang]);

  const progressFraction = downloading && total > 0 ? downloaded / total : 0;

  return (
    <View style={{ gap: 12 }}>
      {/* Recitor picker */}
      <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>
        {t("warsh_db_reciters", lang)}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {recitors.map((r) => (
          <Pressable
            key={r.recitorId}
            style={[
              styles.mushafChip,
              {
                borderColor: warshRecitorId === r.recitorId ? ACCENT : borderColor,
                backgroundColor:
                  warshRecitorId === r.recitorId
                    ? isDark ? "#1a3a2e" : "#e8f5e9"
                    : "transparent",
              },
            ]}
            onPress={() => setWarshRecitorId(r.recitorId)}
          >
            {warshRecitorId === r.recitorId && (
              <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
            )}
            <Text
              style={[
                styles.mushafChipText,
                {
                  color: warshRecitorId === r.recitorId ? ACCENT : textColor,
                  fontWeight: warshRecitorId === r.recitorId ? "700" : "400",
                },
              ]}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Status */}
      <View style={styles.statusRow}>
        <Ionicons
          name={cachedFiles >= TOTAL_WARSH_FILES ? "cloud-done-outline" : "cloud-download-outline"}
          size={22}
          color={cachedFiles >= TOTAL_WARSH_FILES ? "#4caf50" : ACCENT}
        />
        <Text style={[styles.statusText, { color: textColor }]}>
          {t("files_downloaded", lang)}: {cachedFiles} / {TOTAL_WARSH_FILES}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: inputBg }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: ACCENT,
              width: downloading
                ? `${Math.min(progressFraction * 100, 100)}%` as any
                : `${Math.min((cachedFiles / TOTAL_WARSH_FILES) * 100, 100)}%` as any,
            },
          ]}
        />
      </View>

      {downloading && (
        <Text style={[styles.progressText, { color: mutedColor }]}>
          {t("download_progress", lang)} {downloaded}/{total}
        </Text>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {downloading ? (
          <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleAbort}>
            <Ionicons name="stop-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>{t("abort_download", lang)}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={[styles.btn, { backgroundColor: ACCENT }]} onPress={handleDownload}>
              <Ionicons name="cloud-download-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>{t("download_warsh_audio", lang)}</Text>
            </Pressable>
            {cachedFiles > 0 && (
              <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>{t("delete_downloads", lang)}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export default function SettingsScreen({ onGoBack, onNavigate }: SettingsScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const setQuira = useAppStore((s) => s.setQuira);
  const imageDownloadProgress = useAppStore((s) => s.imageDownloadProgress);
  const setImageDownloadProgress = useAppStore(
    (s) => s.setImageDownloadProgress
  );
  const [cachedCount, setCachedCount] = useState(0);
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState(String(TOTAL_PAGES));

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

        {/* Warsh Audio Download Section (only when Warsh mode) */}
        {quira === "warsh" && (
          <>
            <Text style={[styles.sectionTitle, { color: mutedColor }]}>
              {t("download_warsh_audio", lang)}
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <WarshAudioDownloader />
            </View>
          </>
        )}

        {/* Recordings Section */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("my_recordings", lang)}
        </Text>
        <Pressable
          style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={() => onNavigate?.("recordings")}
        >
          <View style={[styles.statusRow, { marginBottom: 0 }]}>
            <Ionicons name="mic-outline" size={22} color={ACCENT} />
            <Text style={[styles.statusText, { color: textColor, flex: 1 }]}>
              {t("manage_recordings", lang)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={mutedColor} />
          </View>
        </Pressable>

        {/* Font Selection */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("font_selection", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <FontSelector />
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
