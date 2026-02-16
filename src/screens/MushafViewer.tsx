import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import QuranPage from "../components/QuranPage";
import AudioPlayer from "../components/AudioPlayer";
import DrawerMenu from "../components/DrawerMenu";
import AyahActionModal from "../components/AyahActionModal";
import TafsirModal from "../components/TafsirModal";
import { useAppStore } from "../store/useAppStore";
import { getTotalPages } from "../utils/coordinates";
import { t } from "../i18n";
import { getAyahText } from "../utils/ayahText";
import { buildRecordedAyahSet, loadProfiles } from "../utils/recordings";
import { getFirstAyahOnPage, getPageInfo } from "../utils/quranHelpers";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MushafViewerProps {
  onGoBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export default function MushafViewer({ onGoBack, onNavigate }: MushafViewerProps) {
  const flatListRef = useRef<FlatList>(null);

  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const selectedAya = useAppStore((s) => s.selectedAya);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setRecordedAyahs = useAppStore((s) => s.setRecordedAyahs);
  const activeProfileId = useAppStore((s) => s.activeProfileId);

  // Load profiles from filesystem on mount / quira change
  useEffect(() => {
    const profiles = loadProfiles(quira);
    useAppStore.getState().setRecordingProfiles(profiles);
    const currentActive = useAppStore.getState().activeProfileId;
    if (!currentActive && profiles.length > 0) {
      useAppStore.getState().setActiveProfileId(profiles[0].id);
    }
  }, [quira]);

  // Hydrate recorded ayahs when active profile changes
  useEffect(() => {
    if (activeProfileId) {
      setRecordedAyahs(buildRecordedAyahSet(quira, activeProfileId));
    } else {
      setRecordedAyahs({});
    }
  }, [quira, activeProfileId, setRecordedAyahs]);

  // Modal states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [longPressInfo, setLongPressInfo] = useState<{
    sura: number;
    aya: number;
    page: number;
  } | null>(null);

  const totalPages = useMemo(() => getTotalPages(quira), [quira]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => ({ id: i + 1 })),
    [totalPages]
  );

  const initialIndex = useMemo(() => {
    const idx = pages.findIndex((p) => p.id === currentPage);
    return idx >= 0 ? idx : 0;
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: { id: number }; index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        setCurrentPage(viewableItems[0].item.id);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  // Ref to distinguish internal scroll (user swiping) from external page changes
  const isInternalScrollRef = useRef(false);

  const scrollToPage = useCallback((targetPage: number) => {
    const idx = pages.findIndex((p) => p.id === targetPage);
    if (idx >= 0 && flatListRef.current) {
      isInternalScrollRef.current = true;
      flatListRef.current.scrollToIndex({ index: idx, animated: true });
    }
  }, [pages]);

  // Auto-scroll when currentPage changes from an external source (e.g. returning from another screen)
  useEffect(() => {
    if (isInternalScrollRef.current) {
      isInternalScrollRef.current = false;
      return;
    }
    const idx = pages.findIndex((p) => p.id === currentPage);
    if (idx >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: false });
    }
  }, [currentPage, pages]);

  // Long press handler from QuranPage
  const handleLongPressAya = useCallback((sura: number, aya: number, page: number) => {
    setLongPressInfo({ sura, aya, page });
    setActionModalVisible(true);
  }, []);

  // Action modal callbacks
  const handlePlay = useCallback(() => {
    if (longPressInfo) {
      setSelectedAya({
        sura: longPressInfo.sura,
        aya: longPressInfo.aya,
        page: longPressInfo.page,
        id: `s${longPressInfo.sura}a${longPressInfo.aya}z`,
      });
      setActionModalVisible(false);
      useAppStore.getState().setPendingPlayAya(longPressInfo);
    }
  }, [longPressInfo, setSelectedAya]);

  const handleBookmark = useCallback(() => {
    if (!longPressInfo) return;
    const text = getAyahText(longPressInfo.sura, longPressInfo.aya, quira) ?? undefined;
    useAppStore.getState().addBookmark({
      sura: longPressInfo.sura,
      aya: longPressInfo.aya,
      page: longPressInfo.page,
      timestamp: Date.now(),
      text,
    });
    Alert.alert(t("bookmark_added", lang));
  }, [longPressInfo, lang, quira]);

  const handleTafsir = useCallback(() => {
    setTafsirModalVisible(true);
  }, []);

  // Drawer navigation
  const handleDrawerNavigate = useCallback((screen: string) => {
    if (screen === "tafsir") {
      // Open tafsir for the first ayah on the current page
      const firstAyah = getFirstAyahOnPage(currentPage, quira);
      if (firstAyah) {
        setLongPressInfo({ sura: firstAyah.sura, aya: firstAyah.aya, page: currentPage });
        setDrawerVisible(false);
        setTimeout(() => setTafsirModalVisible(true), 300);
      }
      return;
    }
    if (
      screen === "settings" ||
      screen === "recordings" ||
      screen === "search" ||
      screen === "bookmarks" ||
      screen === "recitation" ||
      screen === "khatma" ||
      screen === "about" ||
      screen === "tasbih" ||
      screen === "autoscroll"
    ) {
      if (onNavigate) onNavigate(screen);
    }
  }, [onNavigate, currentPage, quira]);

  const renderPage = useCallback(
    ({ item }: { item: { id: number } }) => {
      return (
        <View style={styles.pageWrapper}>
          <QuranPage
            pageId={item.id}
            isVisible
            onLongPressAya={handleLongPressAya}
          />
          <Text style={[styles.pageNumber, { color: theme.color }]}>{item.id}</Text>
        </View>
      );
    },
    [theme, handleLongPressAya]
  );

  const keyExtractor = useCallback((item: { id: number }) => `page_${item.id}`, []);

  const isDark = !!theme.night;
  const isRTL = lang === "ar" || lang === "amz";

  const pageInfo = useMemo(() => getPageInfo(currentPage, quira), [currentPage, quira]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.backgroundColor}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.backgroundColor },
          isRTL && styles.headerRTL,
        ]}
      >
        {/* Left side: Home + Search */}
        <View style={[styles.headerSide, isRTL && styles.headerSideRTL]}>
          {onGoBack ? (
            <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
              <Ionicons name="home-outline" size={20} color={theme.color} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
          <Pressable
            onPress={() => onNavigate?.("search")}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Ionicons name="search-outline" size={20} color={theme.color} />
          </Pressable>
        </View>

        {/* Center: Sura name + Page/Juz */}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerSura, { color: theme.color }]} numberOfLines={1}>
            {pageInfo.suraName}
          </Text>
          <Text style={[styles.headerMeta, { color: isDark ? "#888" : "#999" }]} numberOfLines={1}>
            {currentPage} • {t("juz", lang)} {pageInfo.juz}
          </Text>
        </View>

        {/* Right side: Menu */}
        <View style={[styles.headerSide, isRTL && styles.headerSideRTL]}>
          <Pressable
            onPress={() => setDrawerVisible(true)}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Ionicons name="menu-outline" size={22} color={theme.color} />
          </Pressable>
        </View>
      </View>

      {/* Quran Pages */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
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
        windowSize={3}
        removeClippedSubviews
      />

      {/* Audio Player */}
      <AudioPlayer onScrollToPage={scrollToPage} />

      {/* Drawer Menu */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onNavigate={handleDrawerNavigate}
      />

      {/* Ayah Action Modal (long press) */}
      {longPressInfo && (
        <AyahActionModal
          visible={actionModalVisible}
          onClose={() => setActionModalVisible(false)}
          onPlay={handlePlay}
          onBookmark={handleBookmark}
          onTafsir={handleTafsir}
          sura={longPressInfo.sura}
          aya={longPressInfo.aya}
          page={longPressInfo.page}
        />
      )}

      {/* Tafsir Modal */}
      {longPressInfo && (
        <TafsirModal
          visible={tafsirModalVisible}
          onClose={() => setTafsirModalVisible(false)}
          sura={longPressInfo.sura}
          aya={longPressInfo.aya}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumber: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 4,
  },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  headerSide: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 72,
  },
  headerSideRTL: {
    flexDirection: "row-reverse",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSura: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  headerMeta: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
});
