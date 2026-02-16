import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
// @ts-ignore
import { QuranData } from "../data/quranData";
// @ts-ignore
import { listAuthorTafsir, listAuthorTarajem } from "../data/listAuthor";
import { fetchTafsirOnline, fetchTarjamaOnline } from "../utils/tafsir";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

// ==============================================================
// Types
// ==============================================================

interface TafsirModalProps {
  visible: boolean;
  onClose: () => void;
  sura: number;
  aya: number;
}

type TabMode = "tafsir" | "tarjama";

interface AuthorItem {
  id: string;
  name: string;
}

// ==============================================================
// Constants
// ==============================================================

const ACCENT_COLOR = "#1a5c2e";
const ACCENT_LIGHT = "#e8f5e9";
const HEADER_BG = "#1a5c2e";

// ==============================================================
// Component
// ==============================================================

export default function TafsirModal({
  visible,
  onClose,
  sura: initialSura,
  aya: initialAya,
}: TafsirModalProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);

  // Navigation state
  const [currentSura, setCurrentSura] = useState(initialSura);
  const [currentAya, setCurrentAya] = useState(initialAya);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabMode>("tafsir");

  // Selected author/translation
  const [selectedTafsir, setSelectedTafsir] = useState("sa3dy");
  const [selectedTarjama, setSelectedTarjama] = useState("ar_muyassar");

  // Content state
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme computations
  const isNight = !!theme.night;
  const bgColor = isNight ? "#111122" : "#ffffff";
  const cardBg = isNight ? "#1a1a2e" : "#f7f8fa";
  const textColor = isNight ? "#e8e8f0" : "#1a1a2e";
  const mutedColor = isNight ? "#888899" : "#888899";
  const borderColor = isNight ? "#2a2a3e" : "#e8ecf0";
  const contentBg = isNight ? "#0d0d1a" : "#ffffff";
  const chipBg = isNight ? "#2a2a3e" : "#f0f2f5";
  const chipActiveBg = isNight ? "#1a3a2e" : ACCENT_LIGHT;
  const headerBg = isNight ? "#0d2818" : HEADER_BG;

  // Build tafsir author list with translations
  const translations = useMemo(() => {
    const loc: Record<string, string> = {};
    const keys = [
      "tafsir_sa3dy",
      "tafsir_ba3awy",
      "tafsir_katheer",
      "tafsir_kortoby",
      "tafsir_tabary",
      "tafsir_indonesian",
      "tafsir_russian",
    ];
    for (const key of keys) {
      loc[key] = t(key, lang);
    }
    return loc;
  }, [lang]);

  const tafsirAuthors: AuthorItem[] = useMemo(
    () => listAuthorTafsir(translations),
    [translations]
  );

  const tarjamaAuthors: AuthorItem[] = useMemo(
    () =>
      listAuthorTarajem.map((item: { id: string; name: string }) => ({
        id: item.id,
        name: item.name,
      })),
    []
  );

  const activeAuthors = activeTab === "tafsir" ? tafsirAuthors : tarjamaAuthors;
  const selectedAuthor =
    activeTab === "tafsir" ? selectedTafsir : selectedTarjama;

  // Reset state when the modal opens with new ayah
  useEffect(() => {
    if (visible) {
      setCurrentSura(initialSura);
      setCurrentAya(initialAya);
    }
  }, [visible, initialSura, initialAya]);

  // Fetch content when dependencies change
  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      setContent("");

      try {
        let result: string;

        if (activeTab === "tafsir") {
          result = await fetchTafsirOnline(selectedTafsir, currentSura, currentAya);
        } else {
          result = await fetchTarjamaOnline(selectedTarjama, currentSura, currentAya);
        }

        if (!cancelled) {
          setContent(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message || t("fnf_audio", lang)
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [visible, activeTab, selectedTafsir, selectedTarjama, currentSura, currentAya, lang]);

  // Navigation helpers
  const suraData = QuranData.Sura[currentSura];
  const suraNameAr: string = suraData?.[0] ?? `${currentSura}`;

  const handlePrevAya = useCallback(() => {
    if (currentAya > 1) {
      setCurrentAya((prev) => prev - 1);
    } else if (currentSura > 1) {
      // Go to last aya of previous sura
      // We use QuranData.Page to find the aya count of the previous sura
      // A simpler approach: go to previous sura aya 1
      setCurrentSura((prev) => prev - 1);
      setCurrentAya(1);
    }
  }, [currentSura, currentAya]);

  const handleNextAya = useCallback(() => {
    // Move to next ayah
    setCurrentAya((prev) => prev + 1);
    // Note: If aya exceeds sura length, the API will return an error
    // and the user can navigate to the next sura manually.
    // A more robust approach would check the aya count, but that data
    // is not directly available in QuranData.Sura.
  }, []);

  const handleSelectAuthor = useCallback(
    (authorId: string) => {
      if (activeTab === "tafsir") {
        setSelectedTafsir(authorId);
      } else {
        setSelectedTarjama(authorId);
      }
    },
    [activeTab]
  );

  const handleCopy = useCallback(async () => {
    if (!content) return;
    try {
      await Clipboard.setStringAsync(content);
      Alert.alert(t("copied_to_clipboard", lang));
    } catch {
      // ignore
    }
  }, [content, lang]);

  /**
   * Renders tafsir content with Quranic verses styled differently.
   * Text within { } brackets is treated as Quranic verses.
   */
  const renderFormattedContent = useCallback(() => {
    if (!content) return null;

    // Split by the ||| separator if present (ayah text ||| tafsir text)
    const parts = content.split("|||");
    const tafsirText = parts.length > 1 ? parts[1].trim() : content;
    const ayahText = parts.length > 1 ? parts[0].trim() : null;

    // Parse Quranic verses within { } brackets
    const segments: { text: string; isVerse: boolean }[] = [];
    let remaining = tafsirText;
    const verseRegex = /\{([^}]+)\}/g;
    let match;
    let lastIndex = 0;

    while ((match = verseRegex.exec(tafsirText)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: tafsirText.slice(lastIndex, match.index), isVerse: false });
      }
      segments.push({ text: match[1], isVerse: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < tafsirText.length) {
      segments.push({ text: tafsirText.slice(lastIndex), isVerse: false });
    }
    if (segments.length === 0) {
      segments.push({ text: tafsirText, isVerse: false });
    }

    return (
      <View>
        {ayahText && (
          <View style={[styles.ayahBox, { backgroundColor: isNight ? "#1a2a1e" : "#e8f5e9", borderColor: ACCENT_COLOR }]}>
            <Text style={[styles.ayahBoxText, { color: isNight ? "#a5d6a7" : ACCENT_COLOR }]}>
              {ayahText}
            </Text>
          </View>
        )}
        <Text style={[styles.contentText, { color: textColor }]} selectable>
          {segments.map((seg, i) =>
            seg.isVerse ? (
              <Text
                key={i}
                style={[
                  styles.verseInTafsir,
                  { color: isNight ? "#81c784" : ACCENT_COLOR },
                ]}
              >
                {"\uFD3F"}{seg.text}{"\uFD3E"}
              </Text>
            ) : (
              <Text key={i}>{seg.text}</Text>
            )
          )}
        </Text>
      </View>
    );
  }, [content, textColor, isNight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Modal Panel */}
        <View
          style={[
            styles.panel,
            {
              height: MODAL_HEIGHT,
              backgroundColor: bgColor,
            },
          ]}
        >
          {/* ============== HEADER ============== */}
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            {/* Close button */}
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
            >
              <Ionicons name="close-outline" size={28} color="#ffffff" />
            </Pressable>

            {/* Title */}
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {t("sura_s", lang)} {suraNameAr}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t("aya_s", lang)} {currentAya}
              </Text>
            </View>

            {/* Spacer for symmetry */}
            <View style={styles.headerSpacer} />
          </View>

          {/* ============== TAB SWITCHER ============== */}
          <View style={[styles.tabRow, { borderBottomColor: borderColor }]}>
            <Pressable
              style={[
                styles.tab,
                activeTab === "tafsir" && [
                  styles.tabActive,
                  { borderBottomColor: ACCENT_COLOR },
                ],
              ]}
              onPress={() => setActiveTab("tafsir")}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={activeTab === "tafsir" ? ACCENT_COLOR : mutedColor}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === "tafsir" ? ACCENT_COLOR : mutedColor,
                    fontWeight: activeTab === "tafsir" ? "700" : "500",
                  },
                ]}
              >
                {t("tafsir", lang)}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                activeTab === "tarjama" && [
                  styles.tabActive,
                  { borderBottomColor: ACCENT_COLOR },
                ],
              ]}
              onPress={() => setActiveTab("tarjama")}
            >
              <Ionicons
                name="language-outline"
                size={18}
                color={activeTab === "tarjama" ? ACCENT_COLOR : mutedColor}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === "tarjama" ? ACCENT_COLOR : mutedColor,
                    fontWeight: activeTab === "tarjama" ? "700" : "500",
                  },
                ]}
              >
                {t("tarjama", lang)}
              </Text>
            </Pressable>
          </View>

          {/* ============== AUTHOR CHIPS ============== */}
          <View style={[styles.chipsContainer, { borderBottomColor: borderColor }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {activeAuthors.map((author) => {
                const isActive = author.id === selectedAuthor;
                return (
                  <Pressable
                    key={author.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? chipActiveBg : chipBg,
                        borderColor: isActive ? ACCENT_COLOR : borderColor,
                      },
                    ]}
                    onPress={() => handleSelectAuthor(author.id)}
                  >
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={ACCENT_COLOR}
                        style={styles.chipCheck}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isActive ? ACCENT_COLOR : textColor,
                          fontWeight: isActive ? "700" : "400",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {author.name || author.id}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ============== CONTENT AREA ============== */}
          <ScrollView
            style={[styles.contentScroll, { backgroundColor: contentBg }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
                <Text style={[styles.loadingText, { color: mutedColor }]}>
                  {t("download", lang)}...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.centerBox}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={48}
                  color={mutedColor}
                />
                <Text style={[styles.errorText, { color: mutedColor }]}>
                  {error === "no_translation" ? t("no_translation", lang) : error}
                </Text>
              </View>
            ) : content ? (
              <View>
                {/* Copy button */}
                <Pressable
                  style={[styles.copyBtn, { backgroundColor: isNight ? "#2a2a3e" : "#f0f2f5" }]}
                  onPress={handleCopy}
                >
                  <Ionicons name="copy-outline" size={16} color={ACCENT_COLOR} />
                  <Text style={[styles.copyBtnText, { color: ACCENT_COLOR }]}>
                    {t("copy_tafsir", lang)}
                  </Text>
                </Pressable>
                {renderFormattedContent()}
              </View>
            ) : (
              <View style={styles.centerBox}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={borderColor}
                />
                <Text style={[styles.emptyText, { color: mutedColor }]}>
                  {t("tafsir", lang)}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ============== BOTTOM NAVIGATION ============== */}
          <View
            style={[
              styles.bottomNav,
              {
                backgroundColor: cardBg,
                borderTopColor: borderColor,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: pressed
                    ? isNight
                      ? "#2a2a3e"
                      : "#e8ecf0"
                    : "transparent",
                },
              ]}
              onPress={handleNextAya}
            >
              <Ionicons name="chevron-forward" size={20} color={ACCENT_COLOR} />
              <Text style={[styles.navBtnText, { color: ACCENT_COLOR }]}>
                {t("nextAya", lang)}
              </Text>
            </Pressable>

            <View style={styles.navCenter}>
              <Text style={[styles.navAyaText, { color: textColor }]}>
                {currentAya}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: pressed
                    ? isNight
                      ? "#2a2a3e"
                      : "#e8ecf0"
                    : "transparent",
                },
              ]}
              onPress={handlePrevAya}
            >
              <Text style={[styles.navBtnText, { color: ACCENT_COLOR }]}>
                {t("prevAya", lang)}
              </Text>
              <Ionicons name="chevron-back" size={20} color={ACCENT_COLOR} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ==============================================================
// Styles
// ==============================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 24,
      },
    }),
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 16 : 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabActive: {
    // borderBottomColor is set dynamically
  },
  tabIcon: {
    marginEnd: 6,
  },
  tabText: {
    fontSize: 15,
  },

  // Author chips
  chipsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipCheck: {
    marginEnd: 4,
  },
  chipText: {
    fontSize: 13,
  },

  // Content
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
    minHeight: 200,
  },
  contentText: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: "right",
    writingDirection: "rtl",
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  ayahBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  ayahBoxText: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
  },
  verseInTafsir: {
    fontWeight: "700",
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
  },

  // Bottom navigation
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
  },
  navAyaText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
