/**
 * TextMushafView — text-based Quran reader, rendered inside MushafViewer.
 * Horizontal paged FlatList (same UX as image mushaf) with per-page ScrollView.
 * Each ayah is a Pressable → highlights on tap, opens AyahActionModal on long-press.
 */
import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
// @ts-ignore
import { QuranData } from "../data/quranData";
import {
  getPageAyahs,
  groupBySura,
  showBismillah,
  BISMILLAH_WARSH,
  BISMILLAH_HAFS,
  SURA_AYAH_COUNTS,
  type SuraSection,
} from "../utils/textPageData";
import { getTotalPages } from "../utils/coordinates";
import { getPageInfo } from "../utils/quranHelpers";

const { width: W, height: H } = Dimensions.get("window");

// ────────────────────────────────────────────────────────────────────────────
// Sura banner
// ────────────────────────────────────────────────────────────────────────────
const SuraBanner = memo(function SuraBanner({
  sura,
  quira,
  fontFamily,
  isDark,
  isStartOfSura,
}: {
  sura: number;
  quira: "madina" | "warsh";
  fontFamily: string | undefined;
  isDark: boolean;
  isStartOfSura: boolean;
}) {
  const suraData = QuranData.Sura[sura] ?? [];
  const suraName = suraData[0] ?? "";
  const suraType = suraData[3]; // "Meccan" | "Medinan"
  const suraTypeAr = suraType === "Meccan" ? "مكية" : suraType === "Medinan" ? "مدنية" : "";
  const ayahCount = SURA_AYAH_COUNTS[sura] ?? 0;
  const hasBismillah = isStartOfSura && showBismillah(sura);
  const bismillah = quira === "warsh" ? BISMILLAH_WARSH : BISMILLAH_HAFS;
  const bannerBg = isDark ? "rgba(26,92,46,0.18)" : "rgba(26,92,46,0.07)";
  const accentColor = isDark ? "#4caf72" : "#1a5c2e";
  const goldColor = isDark ? "#c8a84b" : "#7a5900";

  return (
    <View>
      {/* Banner frame — name + info only */}
      <View style={[styles.suraBanner, { borderColor: accentColor + "44", backgroundColor: bannerBg }]}>
        <View style={styles.suraNameRow}>
          <Text style={[styles.suraOrnament, { color: accentColor }]}>۞</Text>
          <Text style={[styles.suraName, { color: accentColor, fontFamily }]}>
            {"سورة " + suraName}
          </Text>
          <Text style={[styles.suraOrnament, { color: accentColor }]}>۞</Text>
        </View>
        {/* Sura meta: type + ayah count */}
        <Text style={[styles.suraMeta, { color: accentColor + "cc" }]}>
          {[suraTypeAr, ayahCount ? `${ayahCount} آية` : ""].filter(Boolean).join("  •  ")}
        </Text>
      </View>
      {/* Bismillah — outside the frame */}
      {hasBismillah && (
        <Text style={[styles.bismillah, { color: goldColor, fontFamily }]}>
          {bismillah}
        </Text>
      )}
    </View>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Single page content
// ────────────────────────────────────────────────────────────────────────────
const TextPage = memo(function TextPage({
  pageId,
  fontSize,
  fontFamily,
  quira,
  textColor,
  mutedColor,
  borderColor,
  highlightBg,
  isDark,
  lang,
  onLongPress,
}: {
  pageId: number;
  fontSize: number;
  fontFamily: string | undefined;
  quira: "madina" | "warsh";
  textColor: string;
  mutedColor: string;
  borderColor: string;
  highlightBg: string;
  isDark: boolean;
  lang: string;
  onLongPress: (sura: number, aya: number, page: number) => void;
}) {
  const selectedAya = useAppStore((s) => s.selectedAya);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);

  // Get page data (sync — from in-memory arrays)
  const sections: SuraSection[] = useMemo(() => {
    const ayahs = getPageAyahs(pageId, quira);
    return groupBySura(ayahs);
  }, [pageId, quira]);

  const handleTap = useCallback(
    (sura: number, aya: number) => {
      setSelectedAya({ sura, aya, page: pageId, id: `s${sura}a${aya}z` });
    },
    [pageId, setSelectedAya]
  );

  const pageInfo = useMemo(() => getPageInfo(pageId, quira), [pageId, quira]);

  if (sections.length === 0) {
    return (
      <View style={[styles.pageWrapper, { width: W }]}>
        <View style={styles.emptyPage}>
          <Ionicons name="hourglass-outline" size={32} color={mutedColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.pageWrapper, { width: W }]}>
      {/* Page meta header (sura / juz) */}
      <View style={[styles.pageMeta, { borderBottomColor: borderColor }]}>
        <Text style={[styles.pageMetaText, { color: mutedColor }]}>
          {pageInfo.hizbLabel}
        </Text>
        <Text style={[styles.pageMetaCenter, { color: mutedColor }]}>
          {t("juz", lang as any)} {pageInfo.juz}
        </Text>
        <Text style={[styles.pageMetaText, { color: mutedColor }]}>
          {pageId}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.sura}>
            <SuraBanner
              sura={section.sura}
              quira={quira}
              fontFamily={fontFamily}
              isDark={isDark}
              isStartOfSura={section.ayahs[0]?.aya === 1}
            />

            {/* Continuous inline text — all ayahs of this sura section, RTL flow */}
            <Text style={[styles.sectionText, { fontFamily, fontSize }]}>
              {section.ayahs.map((ayah) => {
                const isSelected =
                  selectedAya?.sura === ayah.sura &&
                  selectedAya?.aya === ayah.aya;
                return (
                  <Text
                    key={ayah.aya}
                    onPress={() => handleTap(ayah.sura, ayah.aya)}
                    onLongPress={() => onLongPress(ayah.sura, ayah.aya, pageId)}
                    style={[
                      { color: textColor },
                      isSelected && {
                        backgroundColor: highlightBg,
                        color: isDark ? "#fff" : "#0a2e0a",
                        borderRadius: 4,
                      },
                    ]}
                  >
                    {ayah.text}
                    <Text style={[styles.ayahMarker, { color: isDark ? "#4cce80" : "#1a6e38" }]}>{" " + ayah.marker + " "}</Text>
                  </Text>
                );
              })}
            </Text>
          </View>
        ))}

        {/* Bottom padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
interface TextMushafViewProps {
  fontSize: number;
  onLongPressAya: (sura: number, aya: number, page: number) => void;
}

export default function TextMushafView({ fontSize, onLongPressAya }: TextMushafViewProps) {
  const flatRef = useRef<FlatList>(null);

  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const selectedAya = useAppStore((s) => s.selectedAya);
  const textFontFamily = useAppStore((s) => s.textFontFamily);

  const isDark = !!theme.night;
  const textColor = isDark ? "#e8e8e8" : theme.color ?? "#1a1a2e";
  const mutedColor = isDark ? "#666" : "#999";
  const borderColor = theme.borderColor;
  const highlightBg = isDark ? "rgba(26,92,46,0.55)" : "rgba(26,92,46,0.18)";

  // Font: user setting, or quira default
  const resolvedFont: string | undefined =
    textFontFamily === "auto"
      ? quira === "warsh"
        ? "Maghribi"
        : "hafs"
      : textFontFamily === "default"
      ? undefined
      : textFontFamily;

  const totalPages = useMemo(() => getTotalPages(quira), [quira]);
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => ({ id: i + 1 })),
    [totalPages]
  );

  const initialIndex = useMemo(() => {
    const idx = pages.findIndex((p) => p.id === currentPage);
    return Math.max(0, idx);
  }, []);

  const isInternalRef = useRef(false);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: W, offset: W * index, index }),
    []
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: { id: number } }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        isInternalRef.current = true;
        setCurrentPage(viewableItems[0].item.id);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Sync scroll when currentPage changes externally (audio playback, search navigation)
  useEffect(() => {
    if (isInternalRef.current) {
      isInternalRef.current = false;
      return;
    }
    const idx = pages.findIndex((p) => p.id === currentPage);
    if (idx >= 0 && flatRef.current) {
      flatRef.current.scrollToIndex({ index: idx, animated: false });
    }
  }, [currentPage, pages]);

  // Auto-navigate to page when selectedAya changes from audio player
  useEffect(() => {
    if (!selectedAya) return;
    const idx = pages.findIndex((p) => p.id === selectedAya.page);
    if (idx >= 0 && selectedAya.page !== currentPage) {
      flatRef.current?.scrollToIndex({ index: idx, animated: true });
    }
  }, [selectedAya?.page]);

  const renderItem = useCallback(
    ({ item }: { item: { id: number } }) => (
      <TextPage
        pageId={item.id}
        fontSize={fontSize}
        fontFamily={resolvedFont}
        quira={quira}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        highlightBg={highlightBg}
        isDark={isDark}
        lang={lang}
        onLongPress={onLongPressAya}
      />
    ),
    [fontSize, resolvedFont, quira, textColor, mutedColor, borderColor, highlightBg, isDark, lang, onLongPressAya]
  );

  const keyExtractor = useCallback((item: { id: number }) => `tp_${item.id}`, []);

  return (
    <FlatList
      ref={flatRef}
      data={pages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal
      pagingEnabled
      inverted
      showsHorizontalScrollIndicator={false}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      initialScrollIndex={initialIndex}
      initialNumToRender={1}
      maxToRenderPerBatch={2}
      windowSize={5}
      removeClippedSubviews
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  pageWrapper: {
    height: "100%",
    overflow: "hidden",
  },
  pageMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageMetaText: { fontSize: 11, fontWeight: "500" },
  pageMetaCenter: { fontSize: 11, fontWeight: "500" },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suraBanner: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
  },
  suraNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  suraOrnament: { fontSize: 18 },
  suraName: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  suraMeta: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  bismillah: {
    fontSize: 17,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionText: {
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 48,
    letterSpacing: 0.2,
    paddingTop: 4,
  },
  ayahMarker: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
