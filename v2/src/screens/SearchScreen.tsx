import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import dataService, { Verse } from '../services/DataService';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// SEARCH SCREEN
// ============================================

const SearchScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const setPosition = useAppStore((state) => state.setPosition);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;

    setLoading(true);
    setSearched(true);
    try {
      const searchResults = await dataService.searchVerses(searchQuery);
      setResults(searchResults.slice(0, 50)); // Limit results
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToVerse = (verse: Verse) => {
    setPosition({ sura: verse.sura, aya: verse.aya, page: verse.page });
    navigation.navigate('Wino', { page: verse.page });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={{ backgroundColor: theme.accent + '40' }}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const renderResult = ({ item }: { item: Verse }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: theme.surface }]}
      onPress={() => goToVerse(item)}
    >
      <View style={styles.resultHeader}>
        <Text style={[styles.resultMeta, { color: theme.primary }]}>
          {t('sura')} {item.sura} - {t('aya')} {item.aya}
        </Text>
        <Text style={[styles.resultPage, { color: theme.textSecondary }]}>
          {t('page')} {item.page}
        </Text>
      </View>
      <Text style={[styles.resultText, { color: theme.color }]} numberOfLines={3}>
        {highlightText(item.text, searchQuery)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={theme.color} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.color }]}>{t('search')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('search_placeholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={[styles.searchBar, { backgroundColor: theme.surface }]}
          inputStyle={{ color: theme.color }}
          iconColor={theme.textSecondary}
          placeholderTextColor={theme.textSecondary}
          loading={loading}
        />
      </View>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('no_results')}
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item) => `${item.sura}-${item.aya}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          results.length > 0 ? (
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {t('search_results')}: {results.length}
            </Text>
          ) : null
        }
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  resultCount: {
    fontSize: 14,
    marginBottom: 12,
  },
  resultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultMeta: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultPage: {
    fontSize: 12,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'right',
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

export default SearchScreen;
