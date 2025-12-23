import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { PAGE_LAYOUT, MUSHAF_PAGES, getPageImageUrl } from '../constants';

const { width, height } = Dimensions.get('window');

// ============================================
// WINO SCREEN - Main Quran Page Viewer
// ============================================

// CONFIGURABLE LAYOUT VARIABLES
// Adjust these based on screen size for verse highlighting
const LAYOUT_CONFIG = {
  MARGIN_PAGE: PAGE_LAYOUT.MARGIN_PAGE,
  MARGIN_PAGE_WIDTH: PAGE_LAYOUT.MARGIN_PAGE_WIDTH,
  NISBA: PAGE_LAYOUT.NISBA,
  // Scale factors for coordinate mapping
  SCALE_X: 1.0,
  SCALE_Y: 1.0,
  OFFSET_X: 0,
  OFFSET_Y: 0,
};

interface PageItemProps {
  pageNumber: number;
  quira: string;
  onPress: () => void;
}

const PageItem: React.FC<PageItemProps> = React.memo(({ pageNumber, quira, onPress }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { theme } = useTheme();

  // Calculate page dimensions
  const pageWidth = width - LAYOUT_CONFIG.MARGIN_PAGE_WIDTH * 2;
  const pageHeight = pageWidth * LAYOUT_CONFIG.NISBA;

  // Get image source - try local first, then remote
  const getImageSource = () => {
    try {
      // Try to load from local assets
      // In production, you'll have local images
      // For now, use remote URL
      return { uri: getPageImageUrl(quira === 'warsh' ? 'muhammadi' : 'hafsTajweed', pageNumber) };
    } catch {
      return { uri: getPageImageUrl(quira === 'warsh' ? 'muhammadi' : 'hafsTajweed', pageNumber) };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.pageContainer, { width }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.pageWrapper, { backgroundColor: theme.surface }]}>
        {loading && (
          <View style={[styles.loadingContainer, { width: pageWidth, height: pageHeight }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
        <Image
          source={getImageSource()}
          style={[
            styles.pageImage,
            { width: pageWidth, height: pageHeight },
            loading && styles.hidden,
          ]}
          resizeMode="contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
        {error && (
          <View style={[styles.errorContainer, { width: pageWidth, height: pageHeight }]}>
            <Ionicons name="image-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary }}>Page {pageNumber}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const WinoScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { position, setPosition, quira } = useAppStore();
  const [showControls, setShowControls] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Total pages based on mushaf type
  const totalPages = MUSHAF_PAGES[quira];

  // Initial page from params or store
  const initialPage = route.params?.page || position.page;

  // Generate pages array
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Handle page change
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const currentPage = viewableItems[0].item;
      setPosition({ page: currentPage });
    }
  }, [setPosition]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Scroll to initial page on mount
  useEffect(() => {
    if (initialPage > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialPage - 1,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      flatListRef.current?.scrollToIndex({
        index: page - 1,
        animated: true,
      });
    }
  };

  const renderPage = ({ item }: { item: number }) => (
    <PageItem
      pageNumber={item}
      quira={quira}
      onPress={toggleControls}
    />
  );

  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        inverted // RTL - pages go from right to left
      />

      {/* Top Controls */}
      {showControls && (
        <SafeAreaView style={styles.topControls}>
          <View style={[styles.header, { backgroundColor: theme.surface + 'E6' }]}>
            <TouchableOpacity onPress={goBack} style={styles.headerButton}>
              <Ionicons name="arrow-forward" size={24} color={theme.color} />
            </TouchableOpacity>

            <View style={styles.pageInfo}>
              <Text style={[styles.pageNumber, { color: theme.color }]}>
                {t('page')} {position.page}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.headerButton}
            >
              <Ionicons name="settings-outline" size={24} color={theme.color} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Bottom Controls */}
      {showControls && (
        <View style={[styles.bottomControls, { backgroundColor: theme.surface + 'E6' }]}>
          <TouchableOpacity
            onPress={() => goToPage(position.page + 1)}
            style={styles.navButton}
            disabled={position.page >= totalPages}
          >
            <Ionicons
              name="chevron-back"
              size={32}
              color={position.page >= totalPages ? theme.border : theme.primary}
            />
          </TouchableOpacity>

          <View style={styles.bottomInfo}>
            <Text style={[styles.suraInfo, { color: theme.color }]}>
              {t('sura')} {position.sura}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => goToPage(position.page - 1)}
            style={styles.navButton}
            disabled={position.page <= 1}
          >
            <Ionicons
              name="chevron-forward"
              size={32}
              color={position.page <= 1 ? theme.border : theme.primary}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pageImage: {
    // Dynamic dimensions set inline
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    alignItems: 'center',
  },
  suraInfo: {
    fontSize: 16,
  },
});

export default WinoScreen;
