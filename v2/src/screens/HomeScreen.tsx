import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ============================================
// HOME SCREEN
// ============================================

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { position, quira } = useAppStore();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const continuReading = () => {
    navigation.navigate('Wino', { page: position.page });
  };

  const goToSuras = () => {
    navigation.navigate('Suras');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color={theme.color} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.color }]}>
          {t('app_name')}
        </Text>
        <View style={styles.menuButton} />
      </View>

      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <Image
          source={require('../../assets/images/cover.png')}
          style={styles.coverImage}
          resizeMode="contain"
        />
      </View>

      {/* Current Position */}
      <View style={[styles.positionCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.positionLabel, { color: theme.textSecondary }]}>
          {t('mosshaf_type')}: {quira === 'warsh' ? t('mosshaf_warsh') : t('mosshaf_tajweed')}
        </Text>
        <Text style={[styles.positionText, { color: theme.color }]}>
          {t('sura')} {position.sura} - {t('aya')} {position.aya}
        </Text>
        <Text style={[styles.positionPage, { color: theme.textSecondary }]}>
          {t('page')} {position.page}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          mode="contained"
          onPress={continuReading}
          style={[styles.button, { backgroundColor: theme.primary }]}
          labelStyle={styles.buttonLabel}
          icon="book-open-page-variant"
        >
          {t('play')}
        </Button>

        <Button
          mode="outlined"
          onPress={goToSuras}
          style={styles.button}
          labelStyle={{ color: theme.primary }}
          icon="format-list-bulleted"
        >
          {t('sura')}
        </Button>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={24} color={theme.primary} />
          <Text style={[styles.quickActionText, { color: theme.color }]}>
            {t('search')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Bookmarks')}
        >
          <Ionicons name="bookmark" size={24} color={theme.primary} />
          <Text style={[styles.quickActionText, { color: theme.color }]}>
            {t('bookmarks')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={24} color={theme.primary} />
          <Text style={[styles.quickActionText, { color: theme.color }]}>
            {t('settings')}
          </Text>
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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  coverContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  coverImage: {
    width: width * 0.6,
    height: width * 0.6,
  },
  positionCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  positionLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positionPage: {
    fontSize: 14,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  quickAction: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    minWidth: 80,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
  },
});

export default HomeScreen;
