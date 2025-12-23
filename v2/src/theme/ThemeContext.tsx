import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_PRESETS } from '../constants';

// ============================================
// THEME SYSTEM - Easy Dark Mode & Color Control
// ============================================

export interface ThemeColors {
  id: string;
  backgroundColor: string;
  color: string;
  isDark: boolean;
  // Additional semantic colors
  primary: string;
  secondary: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  textSecondary: string;
  accent: string;
  error: string;
  success: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  setThemeById: (id: string) => void;
  toggleDarkMode: () => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
}

const generateFullTheme = (preset: typeof THEME_PRESETS[0]): ThemeColors => {
  const isDark = preset.isDark;
  return {
    id: preset.id,
    backgroundColor: preset.backgroundColor,
    color: preset.color,
    isDark,
    primary: isDark ? '#4a9eff' : '#1976d2',
    secondary: isDark ? '#bb86fc' : '#6200ee',
    surface: isDark ? '#2d2d2d' : '#f5f5f5',
    surfaceVariant: isDark ? '#3d3d3d' : '#e8e8e8',
    border: isDark ? '#404040' : '#ddd',
    textSecondary: isDark ? '#aaa' : '#666',
    accent: '#d4af37', // Gold accent for Quran aesthetic
    error: '#f44336',
    success: '#4caf50',
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(() =>
    generateFullTheme(THEME_PRESETS[1]) // Default to light
  );

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem('themeId');
        if (savedThemeId) {
          const preset = THEME_PRESETS.find(t => t.id === savedThemeId);
          if (preset) {
            setCurrentTheme(generateFullTheme(preset));
          }
        } else if (systemColorScheme === 'dark') {
          setCurrentTheme(generateFullTheme(THEME_PRESETS[0]));
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setThemeById = useCallback(async (id: string) => {
    const preset = THEME_PRESETS.find(t => t.id === id);
    if (preset) {
      const newTheme = generateFullTheme(preset);
      setCurrentTheme(newTheme);
      await AsyncStorage.setItem('themeId', id);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newId = currentTheme.isDark ? 'light' : 'dark';
    setThemeById(newId);
  }, [currentTheme.isDark, setThemeById]);

  const setCustomColors = useCallback((colors: Partial<ThemeColors>) => {
    setCurrentTheme(prev => ({ ...prev, ...colors }));
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme: currentTheme,
      isDark: currentTheme.isDark,
      setThemeById,
      toggleDarkMode,
      setCustomColors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { THEME_PRESETS };
