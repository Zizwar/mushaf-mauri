import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MushafViewer from "./src/screens/MushafViewer";

export default function App() {
  return (
    <SafeAreaProvider>
      <MushafViewer />
    </SafeAreaProvider>
  );
}
