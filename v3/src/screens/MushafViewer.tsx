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

  const scrollToPage = useCallback((targetPage: number) => {
    const idx = pages.findIndex((p) => p.id === targetPage);
    if (idx >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true });
    }
  }, [pages]);

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
        id: `${longPressInfo.sura}_${longPressInfo.aya}`,
      });
    }
  }, [longPressInfo, setSelectedAya]);

  const handleBookmark = useCallback(() => {
    const ayaText = longPressInfo ? getAyahText(longPressInfo.sura, longPressInfo.aya, quira) : null;
    const header = `${t("bookmark", lang)}: ${t("sura_s", lang)} ${longPressInfo?.sura} - ${t("aya_s", lang)} ${longPressInfo?.aya}`;
    Alert.alert(header, ayaText ?? "");
  }, [longPressInfo, lang, quira]);

  const handleTafsir = useCallback(() => {
    setTafsirModalVisible(true);
  }, []);

  // Drawer navigation
  const handleDrawerNavigate = useCallback((screen: string) => {
    if ((screen === "settings" || screen === "recordings") && onNavigate) {
      onNavigate(screen);
    }
  }, [onNavigate]);

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
  const headerBg = isDark ? "#111" : "rgba(255,255,255,0.95)";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.backgroundColor}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        {/* Back / Home button */}
        {onGoBack ? (
          <Pressable
            onPress={onGoBack}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Ionicons name="home-outline" size={20} color={theme.color} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}

        {/* Page number */}
        <Text style={[styles.headerText, { color: theme.color }]}>
          {currentPage}
        </Text>

        {/* Menu button */}
        <Pressable
          onPress={() => setDrawerVisible(true)}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <Ionicons name="menu-outline" size={22} color={theme.color} />
        </Pressable>
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
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  headerText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
