import React, { useRef, useCallback, useState, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QuranPage from "../components/QuranPage";
import { TOTAL_PAGES } from "../utils/coordinates";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NISBA = 1.471676300578035;
const MARGIN_PAGE_WIDTH = 5;
const IMAGE_HEIGHT = SCREEN_WIDTH * NISBA - MARGIN_PAGE_WIDTH;
const PAGE_HEIGHT = IMAGE_HEIGHT + 40; // image + page number area

// Pre-generate page data array (reversed for RTL reading)
const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
  id: TOTAL_PAGES - i,
}));

export default function MushafViewer() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  const renderPage = useCallback(
    ({ item, index }: { item: { id: number }; index: number }) => {
      const isVisible =
        index === currentIndex ||
        index === currentIndex - 1 ||
        index === currentIndex + 1;

      return (
        <View style={styles.pageWrapper}>
          <QuranPage pageId={item.id} isVisible={isVisible} />
          <Text style={styles.pageNumber}>{item.id}</Text>
        </View>
      );
    },
    [currentIndex]
  );

  const keyExtractor = useCallback((item: { id: number }) => `page_${item.id}`, []);

  const currentPage = PAGES[currentIndex]?.id ?? 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        inverted={!I18nManager.isRTL}
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
      />
      <View style={styles.header}>
        <Text style={styles.headerText}>صفحة {currentPage}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pageWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumber: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    paddingVertical: 4,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  headerText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
});
