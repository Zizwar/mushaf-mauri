import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Divider, Switch } from 'react-native-paper';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// DRAWER MENU COMPONENT
// ============================================

interface DrawerItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, label, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color={theme.primary} />
      <Text style={[styles.drawerItemText, { color: theme.color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const DrawerContent: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const { theme, isDark, toggleDarkMode } = useTheme();
  const position = useAppStore((state) => state.position);

  const navigateTo = (screen: string, params?: any) => {
    props.navigation.navigate(screen, params);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.color }]}>
          {t('app_name')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('sura')}: {position.sura} | {t('page')}: {position.page}
        </Text>
      </View>

      <Divider style={{ backgroundColor: theme.border }} />

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <DrawerItem
          icon="home-outline"
          label={t('home')}
          onPress={() => navigateTo('Home')}
        />
        <DrawerItem
          icon="book-outline"
          label={t('mosshaf_type')}
          onPress={() => navigateTo('Wino')}
        />
        <DrawerItem
          icon="list-outline"
          label={t('sura')}
          onPress={() => navigateTo('Suras')}
        />
        <DrawerItem
          icon="search-outline"
          label={t('search')}
          onPress={() => navigateTo('Search')}
        />
        <DrawerItem
          icon="bookmark-outline"
          label={t('bookmarks')}
          onPress={() => navigateTo('Bookmarks')}
        />
        <DrawerItem
          icon="book"
          label={t('tafsir')}
          onPress={() => navigateTo('Tafsir', { sura: position.sura, aya: position.aya })}
        />
      </View>

      <Divider style={{ backgroundColor: theme.border }} />

      {/* Dark Mode Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleRow}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={24}
            color={theme.primary}
          />
          <Text style={[styles.toggleLabel, { color: theme.color }]}>
            {isDark ? t('dark_mode') : t('light_mode')}
          </Text>
          <Switch value={isDark} onValueChange={toggleDarkMode} />
        </View>
      </View>

      <Divider style={{ backgroundColor: theme.border }} />

      {/* Settings */}
      <View style={styles.menuContainer}>
        <DrawerItem
          icon="settings-outline"
          label={t('settings')}
          onPress={() => navigateTo('Settings')}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  menuContainer: {
    paddingVertical: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
  },
  toggleContainer: {
    padding: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
});

export default DrawerContent;
