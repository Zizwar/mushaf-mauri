import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import dataService, { Sura } from '../services/DataService';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// SURAS LIST SCREEN
// ============================================

const SurasScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const setPosition = useAppStore((state) => state.setPosition);

  const [suras, setSuras] = useState<Sura[]>([]);
  const [filteredSuras, setFilteredSuras] = useState<Sura[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuras();
  }, []);

  const loadSuras = async () => {
    try {
      const data = await dataService.getSuras();
      setSuras(data);
      setFilteredSuras(data);
    } catch (error) {
      console.log('Error loading suras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredSuras(suras);
      return;
    }

    const filtered = suras.filter((sura) => {
      const searchLower = query.toLowerCase();
      return (
        sura.nameAr.includes(query) ||
        sura.nameEn.toLowerCase().includes(searchLower) ||
        sura.nameAmz.includes(query) ||
        sura.id.toString() === query
      );
    });
    setFilteredSuras(filtered);
  };

  const getSuraName = (sura: Sura): string => {
    const lang = i18n.language;
    if (lang === 'ar') return sura.nameAr;
    if (lang === 'amz') return sura.nameAmz;
    return sura.nameEn;
  };

  const goToSura = (sura: Sura) => {
    setPosition({ sura: sura.id, aya: 1, page: sura.startPage });
    navigation.navigate('Wino', { page: sura.startPage });
  };

  const renderSuraItem = ({ item }: { item: Sura }) => (
    <TouchableOpacity
      style={[styles.suraItem, { backgroundColor: theme.surface }]}
      onPress={() => goToSura(item)}
    >
      <View style={[styles.suraNumber, { backgroundColor: theme.primary }]}>
        <Text style={styles.suraNumberText}>{item.id}</Text>
      </View>

      <View style={styles.suraInfo}>
        <Text style={[styles.suraName, { color: theme.color }]}>
          {getSuraName(item)}
        </Text>
        <Text style={[styles.suraDetails, { color: theme.textSecondary }]}>
          {item.type === 'Meccan' ? 'مكية' : 'مدنية'} • {item.ayaCount} {t('aya')}
        </Text>
      </View>

      <View style={styles.suraArabic}>
        <Text style={[styles.suraArabicName, { color: theme.color }]}>
          {item.nameAr}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={theme.color} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.color }]}>{t('sura')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('search_placeholder')}
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.surface }]}
          inputStyle={{ color: theme.color }}
          iconColor={theme.textSecondary}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      {/* Suras List */}
      <FlatList
        data={filteredSuras}
        renderItem={renderSuraItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  suraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  suraNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suraNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  suraInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suraName: {
    fontSize: 16,
    fontWeight: '600',
  },
  suraDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  suraArabic: {
    alignItems: 'flex-end',
  },
  suraArabicName: {
    fontSize: 18,
    fontFamily: 'System', // Will use Arabic font when loaded
  },
});

export default SurasScreen;
