import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import MushafViewer from "./src/screens/MushafViewer";
import SettingsScreen from "./src/screens/SettingsScreen";

export default function App() {
  const [screen, setScreen] = useState<"home" | "mushaf" | "settings">("home");

  return (
    <SafeAreaProvider>
      {screen === "home" ? (
        <HomeScreen onOpenMushaf={() => setScreen("mushaf")} />
      ) : screen === "settings" ? (
        <SettingsScreen onGoBack={() => setScreen("mushaf")} />
      ) : (
        <MushafViewer
          onGoBack={() => setScreen("home")}
          onNavigate={(s) => setScreen(s as any)}
        />
      )}
    </SafeAreaProvider>
  );
}
