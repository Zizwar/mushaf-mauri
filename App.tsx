import React, { useState, useCallback, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
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
import { useAppStore } from "./src/store/useAppStore";

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
  | "autoscroll";

export default function App() {
  const [fontsLoaded] = useFonts({
    hafs: require("./assets/fonts/hafs.ttf"),
    rustam: require("./assets/fonts/rustam.ttf"),
    uthmanic: require("./assets/fonts/uthmanic.ttf"),
    Maghribi: require("./assets/fonts/maghribi.otf"),
  });

  const hasCompletedSetup = useAppStore((s) => s.hasCompletedSetup);
  const [screen, setScreen] = useState<Screen>(hasCompletedSetup ? "mushaf" : "home");

  // Initialize Warsh DB early so warsh index is available synchronously
  useEffect(() => { initWarshDB().catch((e) => console.warn("[App] initWarshDB failed:", e)); }, []);

  const handleNavigateToPage = useCallback((page: number, sura?: number, aya?: number) => {
    useAppStore.getState().setCurrentPage(page);
    if (sura && aya) {
      useAppStore.getState().setSelectedAya({
        sura,
        aya,
        page,
        id: `s${sura}a${aya}z`,
      });
    }
    setScreen("mushaf");
  }, []);

  if (!fontsLoaded) {
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
        <KhatmaScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "about" ? (
        <AboutScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "tasbih" ? (
        <TasbihScreen onGoBack={() => setScreen("mushaf")} />
      ) : screen === "autoscroll" ? (
        <AutoScrollScreen onGoBack={() => setScreen("mushaf")} />
      ) : (
        <MushafViewer
          onGoBack={hasCompletedSetup ? undefined : () => setScreen("home")}
          onNavigate={(s) => setScreen(s as Screen)}
        />
      )}
    </SafeAreaProvider>
  );
}
