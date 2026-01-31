import React, { useRef, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QuranPage from "../components/QuranPage";
import AudioPlayer from "../components/AudioPlayer";
import { useAppStore } from "../store/useAppStore";
import { getTotalPages } from "../utils/coordinates";
// @ts-ignore
import { QuranData } from "../data/quranData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MushafViewer() {
  const flatListRef = useRef<FlatList>(null);

  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const totalPages = useMemo(() => getTotalPages(quira), [quira]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => ({ id: totalPages - i })),
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

  const renderPage = useCallback(
    ({ item, index }: { item: { id: number }; index: number }) => {
      return (
        <View style={styles.pageWrapper}>
          <QuranPage pageId={item.id} isVisible />
          <Text style={[styles.pageNumber, { color: theme.color }]}>{item.id}</Text>
        </View>
      );
    },
    [theme]
  );

  const keyExtractor = useCallback((item: { id: number }) => `page_${item.id}`, []);

  // Get sura name for header
  const suraInfo = useMemo(() => {
    // Find first aya on current page from coordinates
    return null; // We show page number only
  }, [currentPage]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar
        barStyle={theme.night ? "light-content" : "dark-content"}
        backgroundColor={theme.backgroundColor}
      />

      <View style={[styles.header, { backgroundColor: theme.night ? "#111" : "rgba(255,255,255,0.95)" }]}>
        <Text style={[styles.headerText, { color: theme.color }]}>
          {currentPage}
        </Text>
      </View>

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

      <AudioPlayer onScrollToPage={scrollToPage} />
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
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
