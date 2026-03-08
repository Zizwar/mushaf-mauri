import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
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
import { isDBAvailable, downloadTafsirDB } from "../utils/tafsir";
// @ts-ignore
import { listAuthorTafsir, listAuthorTarajem } from "../data/listAuthor";

const ACCENT = "#1a5c2e";
const TOTAL_PAGES = 604;
const TOTAL_WARSH_FILES = 120;

// ─────────────────────────────────────────────────────────────────────────────
// Warsh Audio Downloader (inline)
// ─────────────────────────────────────────────────────────────────────────────
function WarshAudioDownloader() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const warshRecitorId = useAppStore((s) => s.warshRecitorId);
  const setWarshRecitorId = useAppStore((s) => s.setWarshRecitorId);

  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warshRecitorId, recitors]);

  async function countCachedWarshFiles(): Promise<number> {
    try {
      const recitor = recitors.find((r) => r.recitorId === warshRecitorId);
      if (!recitor) return 0;
      const dir = new Directory(Paths.document, `warsh-audio/${recitor.folder}`);
      if (!dir.exists) return 0;
      const entries = dir.list();
      return entries.filter((e) => e instanceof File && e.name.endsWith(".mp3")).length;
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
    for (let hizb = 1; hizb <= 30; hizb++) {
      for (let part = 1; part <= 4; part++) {
        if (abortRef.current) break;
        const fileName = `${recitor.folder}-${String(hizb).padStart(3, "0")}-${part}.mp3`;
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
      <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>
        {t("warsh_db_reciters", lang)}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {recitors.map((r) => (
          <Pressable
            key={r.recitorId}
            style={[
              styles.chip,
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
              style={{
                fontSize: 14,
                color: warshRecitorId === r.recitorId ? ACCENT : textColor,
                fontWeight: warshRecitorId === r.recitorId ? "700" : "400",
              }}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
      </View>

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

// ─────────────────────────────────────────────────────────────────────────────
// Tafsir / Tarjama DB Downloader
// ─────────────────────────────────────────────────────────────────────────────
interface DBItem {
  id: string;
  name: string;
  type: "tafsir" | "tarajem";
}

function TafsirDBDownloader() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;

  const [activeTab, setActiveTab] = useState<"tafsir" | "tarajem">("tafsir");
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const tafsirItems: DBItem[] = (listAuthorTafsir({
    tafsir_sa3dy: t("tafsir_sa3dy", lang),
    tafsir_ba3awy: t("tafsir_ba3awy", lang),
    tafsir_katheer: t("tafsir_katheer", lang),
    tafsir_kortoby: t("tafsir_kortoby", lang),
    tafsir_tabary: t("tafsir_tabary", lang),
    tafsir_indonesian: t("tafsir_indonesian", lang),
    tafsir_russian: t("tafsir_russian", lang),
  }) as { id: string; name: string }[]).map((item) => ({ ...item, type: "tafsir" as const }));

  const tarjamItems: DBItem[] = (listAuthorTarajem as { id: string; name: string }[])
    .filter((item) => item.id !== "ayat")
    .map((item) => ({ ...item, type: "tarajem" as const }));

  const items = activeTab === "tafsir" ? tafsirItems : tarjamItems;

  useEffect(() => {
    const allItems = [...tafsirItems, ...tarjamItems];
    const map: Record<string, boolean> = {};
    for (const item of allItems) {
      map[item.id] = isDBAvailable(item.id);
    }
    setAvailable(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = useCallback(async (item: DBItem) => {
    setLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const ok = await downloadTafsirDB(item.id, item.type);
      setAvailable((prev) => ({ ...prev, [item.id]: ok }));
      if (!ok) Alert.alert(t("download", lang), "فشل التحميل، تحقق من الاتصال.");
    } finally {
      setLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  }, [lang]);

  const handleDelete = useCallback((item: DBItem) => {
    Alert.alert(
      t("delete_db", lang),
      t("confirm_delete_db", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("delete_db", lang),
          style: "destructive",
          onPress: () => {
            try {
              const dir = new Directory(Paths.document, "SQLite");
              const file = new File(dir, `${item.id}.db`);
              if (file.exists) file.delete();
              setAvailable((prev) => ({ ...prev, [item.id]: false }));
            } catch {}
          },
        },
      ]
    );
  }, [lang]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor }}>
        {(["tafsir", "tarajem"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              backgroundColor: activeTab === tab ? ACCENT : "transparent",
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={{ color: activeTab === tab ? "#fff" : mutedColor, fontWeight: "600", fontSize: 13 }}>
              {tab === "tafsir" ? t("tafasir", lang) : t("tarajem", lang)}
            </Text>
          </Pressable>
        ))}
      </View>

      {items.map((item) => {
        const isAvail = available[item.id] ?? false;
        const isLoading = loading[item.id] ?? false;
        return (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 4,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: borderColor,
              gap: 8,
            }}
          >
            <Ionicons
              name={isAvail ? "cloud-done-outline" : "cloud-download-outline"}
              size={20}
              color={isAvail ? ACCENT : mutedColor}
            />
            <Text style={{ flex: 1, color: textColor, fontSize: 13 }} numberOfLines={1}>
              {item.name}
            </Text>
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={20} color={mutedColor} />
            ) : isAvail ? (
              <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#c0392b" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleDownload(item)}
                hitSlop={8}
                style={{ backgroundColor: ACCENT, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                  {t("download", lang)}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
interface OfflineScreenProps {
  onGoBack: () => void;
}

export default function OfflineScreen({ onGoBack }: OfflineScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const imageDownloadProgress = useAppStore((s) => s.imageDownloadProgress);
  const setImageDownloadProgress = useAppStore((s) => s.setImageDownloadProgress);

  const [cachedCount, setCachedCount] = useState(0);
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState(String(TOTAL_PAGES));

  const isDark = !!theme.night;
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;
  const inputBg = isDark ? "#2a2a3e" : "#f0f0f0";

  const progress = imageDownloadProgress[quira];

  useEffect(() => {
    setCachedCount(countDownloadedPages(quira));
  }, [quira]);

  const handleDownload = useCallback(async () => {
    const from = Math.max(1, Math.min(TOTAL_PAGES, parseInt(fromPage) || 1));
    const to = Math.max(from, Math.min(TOTAL_PAGES, parseInt(toPage) || TOTAL_PAGES));
    const total = to - from + 1;

    setImageDownloadProgress(quira, { isDownloading: true, downloaded: 0, total });

    await downloadPageRange(quira, from, to, (downloaded, t) => {
      setImageDownloadProgress(quira, { isDownloading: true, downloaded, total: t });
    });

    setImageDownloadProgress(quira, { isDownloading: false, downloaded: 0, total: TOTAL_PAGES });
    invalidateImageCacheSet(quira);
    setCachedCount(countDownloadedPages(quira));
  }, [quira, fromPage, toPage, setImageDownloadProgress]);

  const handleAbort = useCallback(() => {
    abortDownload();
    setImageDownloadProgress(quira, { isDownloading: false, downloaded: 0, total: TOTAL_PAGES });
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
          {t("offline", lang)}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? "#1a2e1a" : "#e8f5e9", borderColor: isDark ? "#2a4a2a" : "#c8e6c9" }]}>
          <Ionicons name="wifi-outline" size={28} color={ACCENT} style={{ marginBottom: 8 }} />
          <Text style={[styles.infoBannerTitle, { color: ACCENT }]}>
            {t("offline_ready", lang)}
          </Text>
          <Text style={[styles.infoBannerDesc, { color: isDark ? "#a0c8a0" : "#4a7a4a" }]}>
            {t("offline_desc", lang)}
          </Text>
        </View>

        {/* Pages download */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("download_images", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.statusRow}>
            <Ionicons
              name={cachedCount >= TOTAL_PAGES ? "cloud-done-outline" : "cloud-download-outline"}
              size={22}
              color={cachedCount >= TOTAL_PAGES ? "#4caf50" : ACCENT}
            />
            <Text style={[styles.statusText, { color: textColor }]}>
              {t("downloaded_pages", lang)}: {cachedCount} / {TOTAL_PAGES}
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: inputBg }]}>
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

          {!progress.isDownloading && (
            <View style={styles.rangeRow}>
              <View style={styles.rangeInput}>
                <Text style={[styles.rangeLabel, { color: mutedColor }]}>{t("from_page", lang)}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                  value={fromPage}
                  onChangeText={setFromPage}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.rangeInput}>
                <Text style={[styles.rangeLabel, { color: mutedColor }]}>{t("to_page", lang)}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                  value={toPage}
                  onChangeText={setToPage}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          )}

          <View style={styles.buttonRow}>
            {progress.isDownloading ? (
              <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleAbort}>
                <Ionicons name="stop-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>{t("abort_download", lang)}</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={[styles.btn, { backgroundColor: ACCENT }]} onPress={handleDownload}>
                  <Ionicons name="cloud-download-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>{t("download_all", lang)}</Text>
                </Pressable>
                {cachedCount > 0 && (
                  <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleDeleteDownloads}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>{t("delete_downloads", lang)}</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        {/* Warsh Audio (warsh mode only) */}
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

        {/* Tafsir / Tarjama */}
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          {t("download_tafsir_db", lang)}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.statusText, { color: mutedColor, marginBottom: 10, fontSize: 12 }]}>
            {t("tafsir_db_desc", lang)}
          </Text>
          <TafsirDBDownloader />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  infoBannerDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
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
  chip: {
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusText: { fontSize: 15, fontWeight: "600" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, textAlign: "center", marginBottom: 8 },
  rangeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  rangeInput: { flex: 1 },
  rangeLabel: { fontSize: 12, marginBottom: 4 },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    textAlign: "center",
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnDanger: { backgroundColor: "#d32f2f" },
});
