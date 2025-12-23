import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../types';

// Screens
import HomeScreen from '../screens/HomeScreen';
import WinoScreen from '../screens/WinoScreen';
import SurasScreen from '../screens/SurasScreen';
import TafsirScreen from '../screens/TafsirScreen';
import SearchScreen from '../screens/SearchScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DrawerContent from '../components/DrawerContent';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

// ============================================
// DRAWER NAVIGATOR
// ============================================

const DrawerNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right', // RTL support
        drawerStyle: {
          backgroundColor: theme.backgroundColor,
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
    </Drawer.Navigator>
  );
};

// ============================================
// MAIN STACK NAVIGATOR
// ============================================

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.primary,
          background: theme.backgroundColor,
          card: theme.surface,
          text: theme.color,
          border: theme.border,
          notification: theme.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: 'normal' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: 'bold' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.backgroundColor },
        }}
      >
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        <Stack.Screen
          name="Wino"
          component={WinoScreen}
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen name="Suras" component={SurasScreen} />
        <Stack.Screen name="Tafsir" component={TafsirScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
