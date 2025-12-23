import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore, Bookmark } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// BOOKMARKS SCREEN
// ============================================

const BookmarksScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const { bookmarks, removeBookmark, setPosition } = useAppStore();

  const goToBookmark = (bookmark: Bookmark) => {
    setPosition({ sura: bookmark.sura, aya: bookmark.aya, page: bookmark.page });
    navigation.navigate('Wino', { page: bookmark.page });
  };

  const handleDelete = (bookmark: Bookmark) => {
    Alert.alert(
      t('remove_bookmark'),
      `${t('sura')} ${bookmark.sura} - ${t('aya')} ${bookmark.aya}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('yes'),
          style: 'destructive',
          onPress: () => removeBookmark(bookmark.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={[styles.bookmarkItem, { backgroundColor: theme.surface }]}
      onPress={() => goToBookmark(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.bookmarkIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="bookmark" size={24} color={theme.primary} />
      </View>

      <View style={styles.bookmarkInfo}>
        <Text style={[styles.bookmarkTitle, { color: theme.color }]}>
          {t('sura')} {item.sura} - {t('aya')} {item.aya}
        </Text>
        <Text style={[styles.bookmarkMeta, { color: theme.textSecondary }]}>
          {t('page')} {item.page} • {formatDate(item.date)}
        </Text>
        {item.note && (
          <Text style={[styles.bookmarkNote, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.note}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={20} color={theme.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={theme.color} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.color }]}>{t('bookmarks')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('no_bookmarks')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmark}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  bookmarkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookmarkMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  bookmarkNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default BookmarksScreen;
