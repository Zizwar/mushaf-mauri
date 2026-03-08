import React, { useState, useCallback, useEffect } from "react";
import { ActivityIndicator, BackHandler, View, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { initWarshDB } from "./src/utils/warshAudioDB";
import HomeScreen from "./src/screens/HomeScreen";
import MushafViewer from "./src/screens/MushafViewer";
import SettingsScreen from "./src/screens/SettingsScreen";
import RecordingsScreen from "./src/screens/RecordingsScreen";
import SearchScreen from "./src/screens/SearchScreen";
import BookmarksScreen from "./src/screens/BookmarksScreen";
import RecitingScreen from "./src/screens/RecitingScreen";
import KhatmaScreen from "./src/screens/KhatmaScreen";
import AboutScreen from "./src/screens/AboutScreen";
import TasbihScreen from "./src/screens/TasbihScreen";
import AutoScrollScreen from "./src/screens/AutoScrollScreen";
import PrayerModeScreen from "./src/screens/PrayerModeScreen";
import MediaScreen from "./src/screens/MediaScreen";
import { useAppStore } from "./src/store/useAppStore";
import { THEMES } from "./src/theme/themes";

type Screen =
  | "home"
  | "mushaf"
  | "settings"
  | "recordings"
  | "search"
  | "bookmarks"
  | "recitation"
  | "khatma"
  | "about"
  | "tasbih"
  | "autoscroll"
  | "prayerMode"
  | "media";

export default function App() {
  const [fontsLoaded] = useFonts({
    hafs: require("./assets/fonts/hafs.ttf"),
    rustam: require("./assets/fonts/rustam.ttf"),
    uthmanic: require("./assets/fonts/uthmanic.ttf"),
    Maghribi: require("./assets/fonts/maghribi.otf"),
  });

  // Wait for Zustand persist to hydrate from AsyncStorage before deciding the initial screen
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    // If already hydrated (unlikely on first render but safe to check)
    if (useAppStore.persist.hasHydrated()) {
      setScreen(useAppStore.getState().hasCompletedSetup ? "mushaf" : "home");
      setHydrated(true);
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration((state) => {
      setScreen(state.hasCompletedSetup ? "mushaf" : "home");
      setHydrated(true);
    });
    return unsub;
  }, []);

  // Auto dark mode: follow system color scheme
  const colorScheme = useColorScheme();
  useEffect(() => {
    if (!hydrated) return;
    const theme = useAppStore.getState().theme;
    const isCurrentlyNight = !!theme.night;
    const systemIsDark = colorScheme === "dark";
    if (systemIsDark && !isCurrentlyNight) {
      const nightTheme = THEMES.find((t) => t.night);
      if (nightTheme) useAppStore.getState().setTheme(nightTheme);
    } else if (!systemIsDark && isCurrentlyNight) {
      const lightTheme = THEMES.find((t) => !t.night);
      if (lightTheme) useAppStore.getState().setTheme(lightTheme);
    }
  }, [colorScheme, hydrated]);

  // Initialize Warsh DB early
  useEffect(() => { initWarshDB().catch((e) => console.warn("[App] initWarshDB failed:", e)); }, []);

  // Android back button
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen !== "mushaf" && screen !== "home") {
        setScreen("mushaf");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  const handleNavigateToPage = useCallback((page: number, sura?: number, aya?: number) => {
    useAppStore.getState().setCurrentPage(page);
    if (sura && aya) {
      useAppStore.getState().setSelectedAya({ sura, aya, page, id: `s${sura}a${aya}z` });
    }
    setScreen("mushaf");
  }, []);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a5c2e" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === "home" ? (
        <HomeScreen onOpenMushaf={() => setScreen("mushaf")} />
      ) : screen === "settings" ? (
        <SettingsScreen onGoBack={() => setScreen("mushaf")} onNavigate={(s) => setScreen(s as Screen)} />
      ) : screen === "recordings" ? (
        <RecordingsScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "search" ? (
        <SearchScreen
          onGoBack={() => setScreen("mushaf")}
          onNavigateToPage={handleNavigateToPage}
        />
      ) : screen === "bookmarks" ? (
        <BookmarksScreen
          onGoBack={() => setScreen("mushaf")}
          onNavigateToPage={(page, sura, aya) => handleNavigateToPage(page, sura, aya)}
        />
      ) : screen === "recitation" ? (
        <RecitingScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "khatma" ? (
        <KhatmaScreen onGoBack={() => setScreen("mushaf")} onNavigateToPage={handleNavigateToPage} />
      ) : screen === "about" ? (
        <AboutScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "tasbih" ? (
        <TasbihScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "autoscroll" ? (
        <AutoScrollScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "prayerMode" ? (
        <PrayerModeScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "media" ? (
        <MediaScreen onGoBack={() => setScreen("mushaf")} />
      ) : (
        <MushafViewer
          onGoBack={() => setScreen("home")}
          onNavigate={(s) => setScreen(s as Screen)}
        />
      )}
    </SafeAreaProvider>
  );
}
