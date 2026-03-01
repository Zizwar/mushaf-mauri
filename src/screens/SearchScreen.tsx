import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import {
  allSuwar,
  searchAyatByText,
  getSuraName,
  type SearchResult,
} from "../utils/quranHelpers";
import { getPageBySuraAya } from "../utils/coordinates";
import { getTotalPages } from "../utils/coordinates";

const ACCENT = "#1a5c2e";
const HIGHLIGHT_BG = "#fff3cd";
const HIGHLIGHT_BG_DARK = "#3d3520";

/**
 * Remove tashkeel/diacritics and normalize Arabic for matching.
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

/**
 * Build highlighted Text nodes: splits the ayah text so that the part
 * matching the query is wrapped in a highlighted <Text>.
 * Matching is done on normalized (no-tashkeel) text but displayed with tashkeel.
 */
function HighlightedAyah({
  text,
  query,
  style,
  highlightBg,
}: {
  text: string;
  query: string;
  style: any;
  highlightBg: string;
}) {
  if (!query || query.length < 2) {
    return <Text style={style}>{text}</Text>;
  }

  const normalizedText = normalizeArabic(text);
  const normalizedQuery = normalizeArabic(query);
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return <Text style={style}>{text}</Text>;
  }

  // Map normalized index back to original text index.
  // Walk both strings char by char: skip diacritics in original.
  let origStart = 0;
  let normCount = 0;
  for (let i = 0; i < text.length && normCount < matchIndex; i++) {
    const ch = text[i];
    // Check if this char is a diacritic (would be removed by normalizeArabic)
    if (/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch)) {
      origStart = i + 1;
      continue;
    }
    normCount++;
    origStart = i + 1;
  }

  // Now find origEnd: consume normalizedQuery.length non-diacritic chars
  let origEnd = origStart;
  let matchCount = 0;
  for (let i = origStart; i < text.length && matchCount < normalizedQuery.length; i++) {
    origEnd = i + 1;
    if (!/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(text[i])) {
      matchCount++;
    }
  }

  const before = text.slice(0, origStart);
  const match = text.slice(origStart, origEnd);
  const after = text.slice(origEnd);

  return (
    <Text style={style}>
      {before ? <Text>{before}</Text> : null}
      <Text style={{ backgroundColor: highlightBg, borderRadius: 4 }}>{match}</Text>
      {after ? <Text>{after}</Text> : null}
    </Text>
  );
}

interface SearchScreenProps {
  onGoBack: () => void;
  onNavigateToPage?: (page: number, sura?: number, aya?: number) => void;
}

type TabKey = "text" | "sura" | "page";

export default function SearchScreen({ onGoBack, onNavigateToPage }: SearchScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quira = useAppStore((s) => s.quira);
  const quranFont = useAppStore((s) => s.quranFont);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";
  const inputBg = isDark ? "#1a1a2e" : "#ffffff";
  const highlightBg = isDark ? HIGHLIGHT_BG_DARK : HIGHLIGHT_BG;
  const fontFamily = quranFont !== "default" ? quranFont : undefined;
  const totalPages = useMemo(() => getTotalPages(quira), [quira]);

  const [activeTab, setActiveTab] = useState<TabKey>("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const suwar = useMemo(() => allSuwar(), []);

  const handleTextSearch = useCallback(async () => {
    Keyboard.dismiss();
    if (searchQuery.length < 2) return;
    const found = await searchAyatByText(searchQuery, quira);
    setResults(found);
    setHasSearched(true);
  }, [searchQuery, quira]);

  const handleGoToPage = useCallback(
    (page: number, sura?: number, aya?: number) => {
      if (onNavigateToPage) {
        onNavigateToPage(page, sura, aya);
      }
      onGoBack();
    },
    [onGoBack, onNavigateToPage]
  );

  const handlePageSearch = useCallback(() => {
    Keyboard.dismiss();
    const pageNum = parseInt(pageInput, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      handleGoToPage(pageNum);
    }
  }, [pageInput, handleGoToPage]);

  const handleSuraPress = useCallback(
    (sura: number) => {
      const page = getPageBySuraAya(sura, 1, quira);
      handleGoToPage(page, sura, 1);
    },
    [quira, handleGoToPage]
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "text", label: t("search_text", lang) },
    { key: "sura", label: t("search_sura", lang) },
    { key: "page", label: t("search_page", lang) },
  ];

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={[styles.resultCard, { backgroundColor: cardBg, borderColor }]}
      onPress={() => handleGoToPage(item.page, item.sura, item.aya)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultSuraBadge}>
          <Ionicons name="book-outline" size={14} color={ACCENT} />
          <Text style={[styles.resultSura, { color: ACCENT }]}>
            {getSuraName(item.sura)}
          </Text>
        </View>
        <Text style={[styles.resultMeta, { color: mutedColor }]}>
          {t("aya_s", lang)} {item.aya} • {t("page", lang)} {item.page}
        </Text>
      </View>
      <HighlightedAyah
        text={item.text}
        query={searchQuery}
        style={[styles.resultText, { color: textColor, fontFamily }]}
        highlightBg={highlightBg}
      />
      <View style={styles.resultFooter}>
        <Ionicons name="arrow-back-circle-outline" size={16} color={ACCENT} />
        <Text style={[styles.resultGoText, { color: ACCENT }]}>
          {t("go_to_page", lang)}
        </Text>
      </View>
    </Pressable>
  );

  const renderSuraItem = ({ item }: { item: { value: number; label: string } }) => (
    <Pressable
      style={[styles.suraItem, { borderBottomColor: borderColor }]}
      onPress={() => handleSuraPress(item.value)}
    >
      <View style={styles.suraNumber}>
        <Text style={[styles.suraNumberText, { color: ACCENT }]}>
          {item.value}
        </Text>
      </View>
      <Text style={[styles.suraLabel, { color: textColor, fontFamily }]}>
        {getSuraName(item.value)}
      </Text>
      <Ionicons name="chevron-back" size={16} color={mutedColor} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("search", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: borderColor }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              activeTab === tab.key && { borderBottomColor: ACCENT },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? ACCENT : mutedColor },
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "text" && (
        <View style={styles.content}>
          <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor }]}>
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder={t("search_holder", lang)}
              placeholderTextColor={mutedColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleTextSearch}
              returnKeyType="search"
              textAlign="right"
            />
            <Pressable onPress={handleTextSearch} style={styles.searchBtn}>
              <Ionicons name="search" size={20} color="#fff" />
            </Pressable>
          </View>
          {hasSearched && results.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: mutedColor }]}>
                {t("no_results", lang)}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => `sr_${item.sura}_${item.aya}`}
              renderItem={renderSearchResult}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      )}

      {activeTab === "sura" && (
        <FlatList
          data={suwar}
          keyExtractor={(item) => `sura_${item.value}`}
          renderItem={renderSuraItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {activeTab === "page" && (
        <View style={styles.content}>
          <View style={styles.pageSection}>
            <Text style={[styles.pageLabel, { color: textColor }]}>
              {t("enter_page_number", lang)}
            </Text>
            <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor }]}>
              <TextInput
                style={[styles.searchInput, { color: textColor, textAlign: "center" }]}
                placeholder={`1 - ${totalPages}`}
                placeholderTextColor={mutedColor}
                value={pageInput}
                onChangeText={setPageInput}
                keyboardType="number-pad"
                onSubmitEditing={handlePageSearch}
                returnKeyType="go"
              />
              <Pressable onPress={handlePageSearch} style={styles.searchBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultSuraBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultSura: {
    fontSize: 14,
    fontWeight: "700",
  },
  resultMeta: {
    fontSize: 12,
  },
  resultText: {
    fontSize: 20,
    lineHeight: 36,
    writingDirection: "rtl",
    textAlign: "right",
  },
  resultFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  resultGoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  suraItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  suraNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  suraNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  suraLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  pageSection: {
    padding: 16,
    gap: 12,
  },
  pageLabel: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
