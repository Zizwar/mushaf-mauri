import React, { useMemo, useRef, useCallback, useState } from "react";
import {
  View,
  Image,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPageCoordinates } from "../utils/coordinates";
import { getImageUriSync, getCachedPageSet, backgroundCachePage } from "../utils/imageCache";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import type { AyahPosition } from "../types";

// Show the "switch to text mode" hint at most once per app session
let textModeHintShown = false;

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
    highlightColor,
    highlightOpacity,
  }: {
    position: AyahPosition;
    isSelected: boolean;
    isRecorded: boolean;
    onLongPress?: () => void;
    highlightColor: string;
    highlightOpacity: number;
  }) => {
    const setSelectedAya = useAppStore((s) => s.setSelectedAya);
    const lastTapRef = useRef(0);

    const onPress = () => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap — open action modal
        onLongPress?.();
        lastTapRef.current = 0;
      } else {
        // Single tap — select ayah
        setSelectedAya({
          sura: position.wino.sura,
          aya: position.wino.aya,
          page: position.wino.page,
          id: position.wino.id,
        });
        lastTapRef.current = now;
      }
    };

    // Helper: parse hex → rgba string
    const toRgba = (hex: string, alpha: number) => {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={[
          styles.ayahButton,
          {
            top: position.top + 5,
            left: position.left + 8,
            width: position.width,
            height: position.height + 1,
          },
          isRecorded && !isSelected && {
            backgroundColor: "rgba(76,175,80,0.18)",
          },
          isSelected && {
            backgroundColor: toRgba(highlightColor, highlightOpacity),
          },
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
  const lang = useAppStore((s) => s.lang);
  const setMushafMode = useAppStore((s) => s.setMushafMode);
  const recordedAyahs = useAppStore((s) => s.recordedAyahs);
  const showRecordingHighlights = useAppStore((s) => s.showRecordingHighlights);
  const highlightColor = useAppStore((s) => s.highlightColor);
  const highlightOpacity = useAppStore((s) => s.highlightOpacity);

  const [imageError, setImageError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { imageUri, isRemote } = useMemo(() => {
    if (!cachedPageSets[quira] || !cacheInitialized[quira]) {
      cachedPageSets[quira] = getCachedPageSet(quira);
      cacheInitialized[quira] = true;
    }
    const uri = getImageUriSync(pageId, quira, cachedPageSets[quira]);
    const remote = !cachedPageSets[quira].has(pageId);
    return { imageUri: uri, isRemote: remote };
  }, [pageId, quira]);

  // Auto-cache remote images after successful load
  const handleImageLoad = useCallback(() => {
    if (isRemote) {
      backgroundCachePage(pageId, quira);
    }
  }, [pageId, quira, isRemote]);

  // Handle image load error — show text mode hint once
  const handleImageError = useCallback(() => {
    setImageError(true);
    if (!textModeHintShown) {
      textModeHintShown = true;
      setShowHint(true);
    }
  }, []);

  const handleSwitchToText = useCallback(() => {
    setMushafMode("text");
    setShowHint(false);
  }, [setMushafMode]);

  const positions = useMemo(
    () => getPageCoordinates(pageId, quira),
    [pageId, quira]
  );

  const selectedId = selectedAya?.id ?? null;
  const isDark = !!theme.night;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.pageImage,
          theme.night
            ? styles.nightImage
            : quira === "warsh" && theme.imageFilter
            ? { filter: theme.imageFilter }
            : null,
        ] as any}
        resizeMode="stretch"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {/* Text mode hint on image error */}
      {imageError && showHint && (
        <View style={[styles.hintBanner, { backgroundColor: isDark ? "#2a2a1a" : "#fff8e1" }]}>
          <Text style={{ color: isDark ? "#e8d080" : "#6d5300", fontSize: 13, flex: 1, lineHeight: 18 }}>
            {t("image_load_error", lang)}
          </Text>
          <Pressable
            onPress={handleSwitchToText}
            style={[styles.hintBtn, { backgroundColor: "#336699" }]}
          >
            <Ionicons name="reader-outline" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              {t("switch_text_mode", lang)}
            </Text>
          </Pressable>
          <Pressable onPress={() => setShowHint(false)} hitSlop={10}>
            <Ionicons name="close" size={18} color={isDark ? "#888" : "#999"} />
          </Pressable>
        </View>
      )}
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
            highlightColor={highlightColor}
            highlightOpacity={highlightOpacity}
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
    borderRadius: 2,
  },
  hintBanner: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  hintBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
