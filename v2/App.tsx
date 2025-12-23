import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { loadSavedLanguage } from './src/i18n';
import AppNavigator from './src/navigation/AppNavigator';

// ============================================
// MUSHAF MAURI V2 - Main App Entry
// ============================================

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Enable RTL
I18nManager.allowRTL(true);

const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();

  // Create Paper theme based on current theme
  const paperTheme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: theme.primary,
          secondary: theme.secondary,
          surface: theme.surface,
          background: theme.backgroundColor,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: theme.primary,
          secondary: theme.secondary,
          surface: theme.surface,
          background: theme.backgroundColor,
        },
      };

  return (
    <PaperProvider theme={paperTheme}>
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppNavigator />
      </View>
    </PaperProvider>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          // PNU Arabic font (from assets)
          'PNU': require('./assets/fonts/pnu.ttf'),
          'PNU-Medium': require('./assets/fonts/pnu-med.ttf'),
        });

        // Load saved language
        await loadSavedLanguage();

        // Add any other initialization here
      } catch (e) {
        console.warn('Error loading app resources:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
