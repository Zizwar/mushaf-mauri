import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Switch, RadioButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme, THEME_PRESETS } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { changeLanguage } from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import { LANGUAGES, QUIRA_TYPES } from '../constants';

// ============================================
// SETTINGS SCREEN
// ============================================

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark, setThemeById, toggleDarkMode } = useTheme();
  const navigation = useNavigation<any>();

  const { quira, setQuira, fontSize, setFontSize, language, setLanguage } = useAppStore();

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    setLanguage(lang);
  };

  const handleQuiraChange = (value: string) => {
    setQuira(value as 'warsh' | 'hafsTajweed');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={theme.color} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.color }]}>{t('settings')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            {t('theme')}
          </Text>

          {/* Dark Mode Toggle */}
          <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
            <View style={styles.settingInfo}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.color }]}>
                {isDark ? t('dark_mode') : t('light_mode')}
              </Text>
            </View>
            <Switch value={isDark} onValueChange={toggleDarkMode} />
          </View>

          {/* Theme Colors */}
          <View style={[styles.themeColors, { backgroundColor: theme.surface }]}>
            <Text style={[styles.settingLabel, { color: theme.color, marginBottom: 12 }]}>
              اللون
            </Text>
            <View style={styles.colorOptions}>
              {THEME_PRESETS.filter(t => !t.isDark).map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: preset.backgroundColor, borderColor: theme.border },
                    theme.id === preset.id && { borderColor: theme.primary, borderWidth: 3 },
                  ]}
                  onPress={() => setThemeById(preset.id)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            {t('language')}
          </Text>

          <View style={[styles.radioGroup, { backgroundColor: theme.surface }]}>
            <RadioButton.Group onValueChange={handleLanguageChange} value={i18n.language}>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <View key={code} style={styles.radioRow}>
                  <RadioButton.Android value={code} color={theme.primary} />
                  <Text style={[styles.radioLabel, { color: theme.color }]}>
                    {lang.name}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        </View>

        {/* Mushaf Type Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            {t('mosshaf_type')}
          </Text>

          <View style={[styles.radioGroup, { backgroundColor: theme.surface }]}>
            <RadioButton.Group onValueChange={handleQuiraChange} value={quira}>
              {Object.entries(QUIRA_TYPES).map(([key, value]) => (
                <View key={key} style={styles.radioRow}>
                  <RadioButton.Android value={key} color={theme.primary} />
                  <Text style={[styles.radioLabel, { color: theme.color }]}>
                    {value.name}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        </View>

        {/* Font Size Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            {t('font_size')}
          </Text>

          <View style={[styles.fontSizeContainer, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => setFontSize(Math.max(12, fontSize - 2))}
            >
              <Ionicons name="remove" size={24} color={theme.primary} />
            </TouchableOpacity>

            <Text style={[styles.fontSizeValue, { color: theme.color }]}>
              {fontSize}
            </Text>

            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => setFontSize(Math.min(32, fontSize + 2))}
            >
              <Ionicons name="add" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={[styles.appInfo, { backgroundColor: theme.surface }]}>
            <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
              Mushaf Mauri v2.0.0
            </Text>
            <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
              Expo SDK 54 • React Native
            </Text>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  themeColors: {
    padding: 16,
    borderRadius: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  radioGroup: {
    padding: 8,
    borderRadius: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  fontSizeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 24,
  },
  appInfo: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 12,
  },
});

export default SettingsScreen;
