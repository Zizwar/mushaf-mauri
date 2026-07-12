import React, { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, Linking, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { t } from "./src/i18n";
import { useAppStore, useTheme } from "./src/store/useAppStore";
import { importFromUri } from "./src/utils/recitationsStore";
import { HomeScreen } from "./src/screens/HomeScreen";
import { RecorderScreen } from "./src/screens/RecorderScreen";
import { RecitationsScreen } from "./src/screens/RecitationsScreen";
import { GalleryScreen } from "./src/screens/GalleryScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = "home" | "recorder" | "recitations" | "gallery" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [recorderTarget, setRecorderTarget] = useState<{
    sura: number;
    aya: number;
  }>({ sura: 1, aya: 1 });

  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const lang = useAppStore((s) => s.lang);
  const bumpDirty = useAppStore((s) => s.bumpRecitationsDirty);
  const theme = useTheme();

  const [fontsLoaded] = useFonts({
    Maghribi: require("./assets/fonts/maghribi.otf"),
    hafs: require("./assets/fonts/hafs.ttf"),
    uthmanic: require("./assets/fonts/uthmanic.ttf"),
  });

  const ready = fontsLoaded && hasHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // ---- .mlrec import via deep link / file association ----------------------

  const handleIncomingUrl = useCallback(
    async (url: string | null) => {
      if (!url) return;
      if (!url.toLowerCase().includes(".mlrec") && !url.startsWith("content://"))
        return;
      const imported = await importFromUri(url);
      if (imported !== null && imported > 0) {
        bumpDirty();
        Alert.alert(t("import_success", lang), String(imported));
        setScreen("recitations");
      }
    },
    [bumpDirty, lang]
  );

  useEffect(() => {
    Linking.getInitialURL().then(handleIncomingUrl).catch(() => {});
    const sub = Linking.addEventListener("url", (e) => {
      void handleIncomingUrl(e.url);
    });
    return () => sub.remove();
  }, [handleIncomingUrl]);

  // ---- Android hardware back ----------------------------------------------

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // RecorderScreen guards its own back (discard confirmation) — let its
      // handler take it regardless of registration order.
      if (screen === "recorder") return false;
      if (screen !== "home") {
        setScreen("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  const openSura = useCallback((sura: number, aya = 1) => {
    setRecorderTarget({ sura, aya });
    setScreen("recorder");
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.night ? "light" : "dark"} />
      {screen === "home" ? (
        <HomeScreen
          onOpenSura={openSura}
          onNavigate={(s) => setScreen(s)}
        />
      ) : null}
      {screen === "recorder" ? (
        <RecorderScreen
          sura={recorderTarget.sura}
          initialAya={recorderTarget.aya}
          onGoBack={() => setScreen("home")}
        />
      ) : null}
      {screen === "recitations" ? (
        <RecitationsScreen
          onGoBack={() => setScreen("home")}
          onReRecord={(sura, aya) => openSura(sura, aya)}
        />
      ) : null}
      {screen === "gallery" ? (
        <GalleryScreen
          onGoBack={() => setScreen("home")}
          onGoSettings={() => setScreen("settings")}
        />
      ) : null}
      {screen === "settings" ? (
        <SettingsScreen onGoBack={() => setScreen("home")} />
      ) : null}
    </SafeAreaProvider>
  );
}
