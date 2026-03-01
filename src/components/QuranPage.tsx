import React, { useMemo } from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { getPageCoordinates } from "../utils/coordinates";
import { getImageUriSync, getCachedPageSet } from "../utils/imageCache";
import { useAppStore } from "../store/useAppStore";
import type { AyahPosition } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NISBA = 1.471676300578035;
const MARGIN_PAGE_WIDTH = 5;
const IMAGE_HEIGHT = SCREEN_WIDTH * NISBA - MARGIN_PAGE_WIDTH;

interface QuranPageProps {
  pageId: number;
  isVisible: boolean;
  onLongPressAya?: (sura: number, aya: number, page: number) => void;
}

const AyahOverlay = React.memo(
  ({
    position,
    isSelected,
    isRecorded,
    onLongPress,
  }: {
    position: AyahPosition;
    isSelected: boolean;
    isRecorded: boolean;
    onLongPress?: () => void;
  }) => {
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
        onLongPress={onLongPress}
        delayLongPress={400}
        style={[
          styles.ayahButton,
          {
            top: position.top,
            left: position.left,
            width: position.width,
            height: position.height,
          },
          isRecorded && !isSelected && styles.ayahRecorded,
          isSelected && styles.ayahSelected,
        ]}
      />
    );
  }
);

// Module-level cache for cached page sets
let cachedPageSets: Record<string, Set<number>> = {};
let cacheInitialized: Record<string, boolean> = {};

function QuranPage({ pageId, isVisible, onLongPressAya }: QuranPageProps) {
  const quira = useAppStore((s) => s.quira);
  const selectedAya = useAppStore((s) => s.selectedAya);
  const theme = useAppStore((s) => s.theme);
  const recordedAyahs = useAppStore((s) => s.recordedAyahs);
  const showRecordingHighlights = useAppStore((s) => s.showRecordingHighlights);

  const imageUri = useMemo(() => {
    if (!cachedPageSets[quira] || !cacheInitialized[quira]) {
      cachedPageSets[quira] = getCachedPageSet(quira);
      cacheInitialized[quira] = true;
    }
    return getImageUriSync(pageId, quira, cachedPageSets[quira]);
  }, [pageId, quira]);

  const positions = useMemo(
    () => getPageCoordinates(pageId, quira),
    [pageId, quira]
  );

  const selectedId = selectedAya?.id ?? null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <Image
        source={{ uri: imageUri }}
        style={[styles.pageImage, theme.night && styles.nightImage] as any}
        resizeMode="stretch"
      />
      {isVisible &&
        positions.map((pos, index) => (
          <AyahOverlay
            key={`${pos.id}_${index}`}
            position={pos}
            isSelected={selectedId === pos.wino.id}
            isRecorded={
              showRecordingHighlights &&
              !!recordedAyahs[`s${pos.wino.sura}a${pos.wino.aya}`]
            }
            onLongPress={
              onLongPressAya
                ? () =>
                    onLongPressAya(
                      pos.wino.sura,
                      pos.wino.aya,
                      pos.wino.page
                    )
                : undefined
            }
          />
        ))}
    </View>
  );
}

/**
 * Call this to invalidate the cached page set (e.g., after downloading or deleting).
 */
export function invalidateImageCacheSet(quira?: string) {
  if (quira) {
    delete cachedPageSets[quira];
    delete cacheInitialized[quira];
  } else {
    cachedPageSets = {};
    cacheInitialized = {};
  }
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
    filter: [{ invert: 1 }],
    opacity: 0.9,
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
  ayahRecorded: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.25)",
  },
});
