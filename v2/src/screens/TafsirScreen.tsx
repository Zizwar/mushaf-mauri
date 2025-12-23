import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import dataService from '../services/DataService';
import { getTafsirUrl } from '../constants';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// TAFSIR SCREEN
// ============================================

const TafsirScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { tafsirAuthor, fontSize } = useAppStore();
  const { sura = 1, aya = 1 } = route.params || {};

  const [verse, setVerse] = useState<any>(null);
  const [tafsir, setTafsir] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, [sura, aya, tafsirAuthor]);

  const loadData = async () => {
    setLoading(true);
    setError(false);

    try {
      // Load verse
      const verseData = await dataService.getVerse(sura, aya);
      setVerse(verseData);

      // Load tafsir from API
      const url = getTafsirUrl(tafsirAuthor, sura, aya);
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.tafsir) {
        setTafsir(data.tafsir);
      } else {
        setTafsir('التفسير غير متوفر حالياً');
      }
    } catch (err) {
      console.log('Error loading tafsir:', err);
      setError(true);
      setTafsir('حدث خطأ في تحميل التفسير. تأكد من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  const goToNextAya = async () => {
    const suras = await dataService.getSuras();
    const currentSura = suras.find(s => s.id === sura);
    if (!currentSura) return;

    if (aya < currentSura.ayaCount) {
      navigation.setParams({ sura, aya: aya + 1 });
    } else if (sura < 114) {
      navigation.setParams({ sura: sura + 1, aya: 1 });
    }
  };

  const goToPrevAya = () => {
    if (aya > 1) {
      navigation.setParams({ sura, aya: aya - 1 });
    } else if (sura > 1) {
      // Go to last aya of previous sura
      dataService.getSura(sura - 1).then(prevSura => {
        if (prevSura) {
          navigation.setParams({ sura: sura - 1, aya: prevSura.ayaCount });
        }
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={theme.color} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.color }]}>{t('tafsir')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Verse Info */}
      <View style={[styles.verseInfo, { backgroundColor: theme.surface }]}>
        <Text style={[styles.verseLocation, { color: theme.primary }]}>
          {t('sura')} {sura} - {t('aya')} {aya}
        </Text>
        <Text style={[styles.tafsirAuthor, { color: theme.textSecondary }]}>
          {t(`tafsir_${tafsirAuthor}`)}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Verse Text */}
          {verse && (
            <View style={[styles.verseCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.verseText, { color: theme.color, fontSize: fontSize + 4 }]}>
                {verse.text}
              </Text>
            </View>
          )}

          {/* Tafsir Text */}
          <View style={[styles.tafsirCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.tafsirLabel, { color: theme.primary }]}>
              {t('tafsir')}
            </Text>
            <Text style={[styles.tafsirText, { color: theme.color, fontSize }]}>
              {tafsir}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Navigation */}
      <View style={[styles.navigation, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={styles.navButton} onPress={goToPrevAya}>
          <Ionicons name="chevron-forward" size={28} color={theme.primary} />
          <Text style={[styles.navText, { color: theme.primary }]}>
            {t('aya')} السابقة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goToNextAya}>
          <Text style={[styles.navText, { color: theme.primary }]}>
            {t('aya')} التالية
          </Text>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>
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
  verseInfo: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verseLocation: {
    fontSize: 16,
    fontWeight: '600',
  },
  tafsirAuthor: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  verseCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  verseText: {
    textAlign: 'center',
    lineHeight: 40,
  },
  tafsirCard: {
    padding: 16,
    borderRadius: 12,
  },
  tafsirLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tafsirText: {
    lineHeight: 28,
    textAlign: 'right',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 30,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    marginHorizontal: 4,
  },
});

export default TafsirScreen;
