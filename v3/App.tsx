import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import MushafViewer from "./src/screens/MushafViewer";

export default function App() {
  const [screen, setScreen] = useState<"home" | "mushaf">("home");

  return (
    <SafeAreaProvider>
      {screen === "home" ? (
        <HomeScreen onOpenMushaf={() => setScreen("mushaf")} />
      ) : (
        <MushafViewer />
      )}
    </SafeAreaProvider>
  );
}
