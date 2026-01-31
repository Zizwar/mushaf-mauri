import React, { useMemo } from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { getPageCoordinates } from "../utils/coordinates";
import { getImagePageUri } from "../utils/api";
import { useAppStore } from "../store/useAppStore";
import type { AyahPosition } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NISBA = 1.471676300578035;
const MARGIN_PAGE_WIDTH = 5;
const IMAGE_HEIGHT = SCREEN_WIDTH * NISBA - MARGIN_PAGE_WIDTH;

interface QuranPageProps {
  pageId: number;
  isVisible: boolean;
}

const AyahOverlay = React.memo(
  ({ position, isSelected }: { position: AyahPosition; isSelected: boolean }) => {
    const setSelectedAya = useAppStore((s) => s.setSelectedAya);

    const onPress = () => {
      setSelectedAya({
        sura: position.wino.sura,
        aya: position.wino.aya,
        page: position.wino.page,
        id: position.wino.id,
      });
    };

    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.ayahButton,
          {
            top: position.top,
            left: position.left,
            width: position.width,
            height: position.height,
          },
          isSelected && styles.ayahSelected,
        ]}
      />
    );
  }
);

function QuranPage({ pageId, isVisible }: QuranPageProps) {
  const quira = useAppStore((s) => s.quira);
  const selectedAya = useAppStore((s) => s.selectedAya);
  const theme = useAppStore((s) => s.theme);

  const imageUri = useMemo(() => getImagePageUri(pageId, quira), [pageId, quira]);
  const positions = useMemo(() => getPageCoordinates(pageId, quira), [pageId, quira]);

  const selectedId = selectedAya?.id ?? null;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.pageImage,
          theme.night && styles.nightImage,
        ]}
        resizeMode="stretch"
      />
      {isVisible &&
        positions.map((pos, index) => (
          <AyahOverlay
            key={`${pos.id}_${index}`}
            position={pos}
            isSelected={selectedId === pos.wino.id}
          />
        ))}
    </View>
  );
}

export default React.memo(QuranPage);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: "center",
  },
  pageImage: {
    width: SCREEN_WIDTH - MARGIN_PAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  nightImage: {
    opacity: 0.85,
  },
  ayahButton: {
    position: "absolute",
    backgroundColor: "transparent",
    borderRadius: 3,
  },
  ayahSelected: {
    backgroundColor: "rgba(66, 133, 244, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(66, 133, 244, 0.3)",
  },
});
