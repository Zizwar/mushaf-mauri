import React, { useState, useCallback, useEffect, useRef } from "react";
import { BackHandler, View, useColorScheme, Linking, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

const APP_START = Date.now();
const SPLASH_MIN_MS = 2000;

SplashScreen.preventAutoHideAsync().catch(() => {});
import { initWarshDB } from "./src/utils/warshAudioDB";
import { getPageBySuraAya } from "./src/utils/quranHelpers";
import { importProfileFromUri } from "./src/utils/recordings";
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
import OfflineScreen from "./src/screens/OfflineScreen";
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
  | "media"
  | "offline";

export default function App() {
  const [fontsLoaded] = useFonts({
    hafs: require("./assets/fonts/hafs.ttf"),
    rustam: require("./assets/fonts/rustam.ttf"),
    uthmanic: require("./assets/fonts/uthmanic.ttf"),
    Maghribi: require("./assets/fonts/maghribi.otf"),
    "amiri-quran": require("./assets/fonts/amiri-quran.ttf"),
    "noto-naskh": require("./assets/fonts/noto-naskh.ttf"),
  });

  // Wait for Zustand persist to hydrate from AsyncStorage before deciding the initial screen
  const [hydrated, setHydrated] = useState(false);
  const [splashReady, setSplashReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    const onHydrated = (state: ReturnType<typeof useAppStore.getState>) => {
      setScreen(state.hasCompletedSetup ? "mushaf" : "home");
      setHydrated(true);
    };
    if (useAppStore.persist.hasHydrated()) {
      onHydrated(useAppStore.getState());
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration(onHydrated);
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

  // ─── Deep linking: mushaf.ma/#/a{aya}s{sura}q{quira} & .mrec files ───
  const deepLinkHandled = useRef(false);

  const handleDeepLink = useCallback(async (url: string) => {
    if (!url) return;
    try {
      // Handle .mrec file URIs
      if (url.endsWith(".mrec") || url.includes("mrec")) {
        const quira = useAppStore.getState().quira;
        const profile = await importProfileFromUri(url, quira);
        if (profile) {
          Alert.alert("✓", `${profile.name}`);
          setScreen("recordings");
        }
        return;
      }

      // Extract path from URL
      // Formats: mushaf.ma/#/a1s1q1 | mushafmauri://a1s1q1 | mushaf.ma (no hash)
      const hash = url.includes("#/") ? url.split("#/")[1] : url.split("://")[1];

      // Default values — always open the app even if params are missing
      const store = useAppStore.getState();
      let sura = 1;
      let aya = 1;
      let targetQuira = store.quira; // keep current quira as default

      if (hash) {
        // Parse each part independently — any can be missing
        const sMatch = hash.match(/s(\d+)/i);
        const aMatch = hash.match(/a(\d+)/i);
        const qMatch = hash.match(/q(\d+)/i);

        if (sMatch) {
          const s = parseInt(sMatch[1], 10);
          if (s >= 1 && s <= 114) sura = s;
        }
        if (aMatch) {
          const a = parseInt(aMatch[1], 10);
          if (a >= 1) aya = a;
        }
        if (qMatch) {
          const q = parseInt(qMatch[1], 10);
          targetQuira = q === 2 ? "madina" : "warsh";
        }
      }

      // Switch quira if needed
      if (store.quira !== targetQuira) {
        store.setQuira(targetQuira);
      }

      const page = getPageBySuraAya(sura, aya, targetQuira);
      store.setCurrentPage(page);
      store.setSelectedAya({ sura, aya, page, id: `s${sura}a${aya}z` });
      setScreen("mushaf");
    } catch (e) {
      console.warn("[DeepLink] error:", e);
      // Even on error, open the mushaf
      setScreen("mushaf");
    }
  }, []);

  useEffect(() => {
    // Handle initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url && !deepLinkHandled.current) {
        deepLinkHandled.current = true;
        handleDeepLink(url);
      }
    });

    // Handle URL while app is open
    const sub = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [handleDeepLink]);

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

  // Once fonts + hydration are ready, wait for the 2-second minimum then hide the native splash
  useEffect(() => {
    if (!fontsLoaded || !hydrated) return;
    const elapsed = Date.now() - APP_START;
    const remaining = Math.max(0, SPLASH_MIN_MS - elapsed);
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync().catch(() => {});
      setSplashReady(true);
    }, remaining);
    return () => clearTimeout(timer);
  }, [fontsLoaded, hydrated]);

  if (!splashReady) {
    // Keep rendering nothing — native splash is still covering the screen
    return <View style={{ flex: 1 }} />;
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
      ) : screen === "offline" ? (
        <OfflineScreen onGoBack={() => setScreen("settings")} />
      ) : (
        <MushafViewer
          onGoBack={() => setScreen("home")}
          onNavigate={(s) => setScreen(s as Screen)}
        />
      )}
    </SafeAreaProvider>
  );
}
