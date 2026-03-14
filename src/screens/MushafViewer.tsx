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
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import QuranPage from "../components/QuranPage";
import AudioPlayer from "../components/AudioPlayer";
import DrawerMenu from "../components/DrawerMenu";
import AyahActionModal from "../components/AyahActionModal";
import TafsirModal from "../components/TafsirModal";
import TextMushafView from "./TextMushafView";
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
  const mushafMode = useAppStore((s) => s.mushafMode);
  const setMushafMode = useAppStore((s) => s.setMushafMode);
  const textFontSize = useAppStore((s) => s.textFontSize);
  const setTextFontSize = useAppStore((s) => s.setTextFontSize);
  const textFontFamily = useAppStore((s) => s.textFontFamily);
  const setTextFontFamily = useAppStore((s) => s.setTextFontFamily);
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
  const [fontPickerVisible, setFontPickerVisible] = useState(false);
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

  const handleBookmark = useCallback(async () => {
    if (!longPressInfo) return;
    const text = (await getAyahText(longPressInfo.sura, longPressInfo.aya, quira)) ?? undefined;
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
      screen === "autoscroll" ||
      screen === "prayerMode" ||
      screen === "media" ||
      screen === "offline"
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
  const isRTL = lang === "ar" || lang === "he";

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
        {/* Left side: Search + donate */}
        <View style={[styles.headerSide, isRTL && styles.headerSideRTL]}>
          <Pressable
            onPress={() => onNavigate?.("search")}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Ionicons name="search-outline" size={20} color={theme.color} />
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("https://mushaf.ma/support").catch(() => {})}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Ionicons name="hand-left-outline" size={20} color={theme.color} />
          </Pressable>
        </View>

        {/* Center: Sura name + Page/Juz/Hizb — hidden in text mode (shown in page meta bar) */}
        {mushafMode !== "text" && (
          <View style={styles.headerCenter}>
            <Pressable onPress={() => onNavigate?.("search")} hitSlop={6}>
              <Text style={[styles.headerSura, { color: theme.color }]} numberOfLines={1}>
                {pageInfo.suraName}
              </Text>
            </Pressable>
            <Text style={[styles.headerMeta, { color: isDark ? "#888" : "#999" }]} numberOfLines={1}>
              {currentPage} • {t("juz", lang)} {pageInfo.juz}{pageInfo.hizbLabel ? ` • ${pageInfo.hizbLabel}` : ""}
            </Text>
          </View>
        )}

        {/* Right side: font controls (text mode) + mode toggle + menu */}
        <View style={[styles.headerSide, isRTL && styles.headerSideRTL]}>
          {mushafMode === "text" && (
            <>
              <Pressable
                onPress={() => setTextFontSize(Math.max(14, textFontSize - 2))}
                hitSlop={10}
                style={styles.headerBtn}
              >
                <Text style={[styles.fontSizeBtn, { color: theme.color }]}>A-</Text>
              </Pressable>
              <Pressable
                onPress={() => setTextFontSize(Math.min(36, textFontSize + 2))}
                hitSlop={10}
                style={styles.headerBtn}
              >
                <Text style={[styles.fontSizeBtn, { color: theme.color, fontSize: 16 }]}>A+</Text>
              </Pressable>
              <Pressable
                onPress={() => setFontPickerVisible(true)}
                hitSlop={10}
                style={styles.headerBtn}
              >
                <Ionicons name="text-outline" size={19} color={theme.color} />
              </Pressable>
            </>
          )}
          {/* Mode toggle */}
          <Pressable
            onPress={() => setMushafMode(mushafMode === "image" ? "text" : "image")}
            hitSlop={10}
            style={[styles.headerBtn, styles.modeToggleBtn, { borderColor: theme.borderColor }]}
          >
            <Ionicons
              name={mushafMode === "text" ? "image-outline" : "reader-outline"}
              size={19}
              color={theme.color}
            />
          </Pressable>
          <Pressable
            onPress={() => setDrawerVisible(true)}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Ionicons name="menu-outline" size={22} color={theme.color} />
          </Pressable>
        </View>
      </View>

      {/* Quran Pages — image or text mode */}
      {mushafMode === "text" ? (
        <View style={{ flex: 1 }}>
          <TextMushafView
            fontSize={textFontSize}
            onLongPressAya={handleLongPressAya}
          />
        </View>
      ) : (
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
      )}

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


      {/* Font Picker Modal (text mode) */}
      <Modal
        visible={fontPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFontPickerVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
          onPress={() => setFontPickerVisible(false)}
        >
          <Pressable style={[styles.fontPickerSheet, { backgroundColor: theme.backgroundColor }]}>
            <View style={[styles.fontPickerHandle, { backgroundColor: theme.borderColor }]} />
            <Text style={[styles.fontPickerTitle, { color: theme.color }]}>
              {t("text_font", lang)}
            </Text>
            {[
              { key: "auto", labelKey: "font_auto" },
              { key: "Maghribi", labelKey: "maghribi_font" },
              { key: "hafs", labelKey: "hafs_font" },
              { key: "uthmanic", labelKey: "uthmanic_font" },
              { key: "rustam", labelKey: "rustam_font" },
              { key: "default", labelKey: "standard_font" },
            ].map((opt) => {
              const isSelected = textFontFamily === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.fontPickerRow,
                    { borderColor: isSelected ? "#1a5c2e" : theme.borderColor },
                    isSelected && { backgroundColor: isDark ? "#1a3a2e" : "#e8f5e9" },
                  ]}
                  onPress={() => { setTextFontFamily(opt.key); setFontPickerVisible(false); }}
                >
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color="#1a5c2e" />}
                  <Text style={{
                    fontSize: 16,
                    color: isSelected ? "#1a5c2e" : theme.color,
                    fontFamily: opt.key !== "auto" && opt.key !== "default" ? opt.key : undefined,
                    flex: 1,
                  }}>
                    {t(opt.labelKey, lang)}
                    {opt.key !== "auto" && opt.key !== "default" ? "  —  بسم الله" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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
  modeToggleBtn: {
    borderWidth: 1,
    borderRadius: 8,
  },
  fontSizeBtn: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  fontPickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  fontPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  fontPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  fontPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
});
