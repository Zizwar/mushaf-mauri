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

const ACCENT = "#1a5c2e";

interface SearchScreenProps {
  onGoBack: () => void;
  onNavigateToPage?: (page: number, sura?: number, aya?: number) => void;
}

type TabKey = "text" | "sura" | "page";

export default function SearchScreen({ onGoBack, onNavigateToPage }: SearchScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quira = useAppStore((s) => s.quira);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";
  const inputBg = isDark ? "#1a1a2e" : "#ffffff";

  const [activeTab, setActiveTab] = useState<TabKey>("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const suwar = useMemo(() => allSuwar(), []);

  const handleTextSearch = useCallback(() => {
    Keyboard.dismiss();
    if (searchQuery.length < 2) return;
    const found = searchAyatByText(searchQuery, quira);
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
    if (pageNum >= 1 && pageNum <= 604) {
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
        <Text style={[styles.resultSura, { color: ACCENT }]}>
          {getSuraName(item.sura)}
        </Text>
        <Text style={[styles.resultMeta, { color: mutedColor }]}>
          {t("aya_s", lang)} {item.aya} • {t("page", lang)} {item.page}
        </Text>
      </View>
      <Text
        style={[styles.resultText, { color: textColor }]}
        numberOfLines={3}
      >
        {item.text}
      </Text>
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
      <Text style={[styles.suraLabel, { color: textColor }]}>
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
                placeholder="1 - 604"
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
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultSura: {
    fontSize: 14,
    fontWeight: "700",
  },
  resultMeta: {
    fontSize: 12,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 28,
    writingDirection: "rtl",
    textAlign: "right",
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
