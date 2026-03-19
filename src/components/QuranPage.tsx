import React, { useMemo, useRef, useCallback, useState } from "react";
import {
  View,
  Image,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPageCoordinates, madinaConfig } from "../utils/coordinates";
import { getImageUriSync, getCachedPageSet, backgroundCachePage } from "../utils/imageCache";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import type { AyahPosition } from "../types";

// Debug flag — set to true to show the tuning panel
const __DEV_COORD_TUNER__ = true;

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
    isMadina,
    onLongPress,
    highlightColor,
    highlightOpacity,
  }: {
    position: AyahPosition;
    isSelected: boolean;
    isRecorded: boolean;
    isMadina: boolean;
    onLongPress?: () => void;
    highlightColor: string;
    highlightOpacity: number;
  }) => {
    const setSelectedAya = useAppStore((s) => s.setSelectedAya);
    const lastTapRef = useRef(0);

    const onPress = () => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        onLongPress?.();
        lastTapRef.current = 0;
      } else {
        setSelectedAya({
          sura: position.wino.sura,
          aya: position.wino.aya,
          page: position.wino.page,
          id: position.wino.id,
        });
        lastTapRef.current = now;
      }
    };

    const toRgba = (hex: string, alpha: number) => {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    // Only apply madinaConfig extra offsets for Hafs — Warsh coords are already correct
    const extraTop = isMadina ? madinaConfig.overlayTopExtra : 0;
    const extraLeft = isMadina ? madinaConfig.overlayLeftExtra : 0;

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={[
          styles.ayahButton,
          {
            top: position.top + extraTop,
            left: position.left + extraLeft,
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

// ────────────────────────────────────────────────────────────────────────────
// DEBUG: Coordinate Tuner Panel — remove after calibration
// ────────────────────────────────────────────────────────────────────────────
let Clipboard: any = null;
try { Clipboard = require("expo-clipboard"); } catch (_) {}

const TUNER_FIELDS: { key: keyof typeof madinaConfig; label: string; step: number }[] = [
  { key: "SCREEN_DEFAULT_WIDTH", label: "ImgW", step: 1 },
  { key: "MARGIN_PAGE", label: "MrgP", step: 1 },
  { key: "LEFT_OFFSET", label: "L.Off", step: 1 },
  { key: "TOP_OFFSET", label: "T.Off", step: 1 },
  { key: "overlayTopExtra", label: "OvT", step: 1 },
  { key: "overlayLeftExtra", label: "OvL", step: 1 },
  { key: "height", label: "LnH", step: 1 },
  { key: "tWidth", label: "TxW", step: 1 },
  { key: "ofWidth", label: "ofW", step: 1 },
  { key: "ofHeight", label: "ofH", step: 1 },
  { key: "mgWidth", label: "MgW", step: 1 },
];

// Defaults snapshot for reset
const MADINA_DEFAULTS: Record<string, number> = {
  SCREEN_DEFAULT_WIDTH: 456, MARGIN_PAGE: 48,
  LEFT_OFFSET: -10, TOP_OFFSET: -20,
  overlayTopExtra: 5, overlayLeftExtra: 8,
  height: 30, tWidth: 416, ofWidth: 10, ofHeight: 15, mgWidth: 40,
};

function CoordTunerPanel({ onApply }: { onApply: () => void }) {
  const [localVals, setLocalVals] = useState(() => {
    const vals: Record<string, number> = {};
    TUNER_FIELDS.forEach((f) => { vals[f.key] = madinaConfig[f.key] as number; });
    return vals;
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (key: string, text: string) => {
    const n = parseFloat(text);
    if (!isNaN(n)) setLocalVals((prev) => ({ ...prev, [key]: n }));
  };

  const handleStep = (key: string, step: number) => {
    setLocalVals((prev) => ({ ...prev, [key]: +(prev[key] + step).toFixed(1) }));
  };

  const handleApply = () => {
    TUNER_FIELDS.forEach((f) => { (madinaConfig as any)[f.key] = localVals[f.key]; });
    madinaConfig._rev++;
    onApply();
  };

  const handleReset = () => {
    setLocalVals({ ...MADINA_DEFAULTS });
    TUNER_FIELDS.forEach((f) => { (madinaConfig as any)[f.key] = MADINA_DEFAULTS[f.key]; });
    madinaConfig._rev++;
    onApply();
  };

  const handleCopy = async () => {
    const lines = TUNER_FIELDS.map((f) => `${f.key}: ${localVals[f.key]}`).join("\n");
    try {
      if (Clipboard?.setStringAsync) await Clipboard.setStringAsync(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  const PW = SCREEN_WIDTH * 0.72; // panel width — centered & compact

  return (
    <View style={{
      position: "absolute", top: 40, left: (SCREEN_WIDTH - PW) / 2, width: PW, zIndex: 998,
      backgroundColor: "rgba(0,0,0,0.92)", borderRadius: 14, padding: 8,
      maxHeight: 320,
    }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {TUNER_FIELDS.map((f) => {
          const changed = localVals[f.key] !== MADINA_DEFAULTS[f.key];
          return (
            <View key={f.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3, gap: 3 }}>
              <Text style={{ color: changed ? "#0f0" : "#888", fontSize: 9, width: 32, fontWeight: changed ? "700" : "400" }}>{f.label}</Text>
              <Pressable
                onPress={() => handleStep(f.key, -f.step)}
                style={{ backgroundColor: "#444", borderRadius: 5, width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>−</Text>
              </Pressable>
              <TextInput
                style={{
                  flex: 1, backgroundColor: "#1a1a1a", color: changed ? "#0f0" : "#aaa",
                  fontSize: 12, fontWeight: "700", textAlign: "center", borderRadius: 5,
                  paddingVertical: 1, fontVariant: ["tabular-nums"],
                }}
                value={String(localVals[f.key])}
                onChangeText={(t) => handleChange(f.key, t)}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Pressable
                onPress={() => handleStep(f.key, f.step)}
                style={{ backgroundColor: "#444", borderRadius: 5, width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>+</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
        <Pressable
          onPress={handleReset}
          style={{ flex: 1, backgroundColor: "#555", borderRadius: 7, paddingVertical: 7, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
        >
          <Ionicons name="refresh" size={13} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>إعادة</Text>
        </Pressable>
        <Pressable
          onPress={handleCopy}
          style={{ flex: 1, backgroundColor: copied ? "#1a5c2e" : "#336699", borderRadius: 7, paddingVertical: 7, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
        >
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={13} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{copied ? "تم" : "نسخ"}</Text>
        </Pressable>
        <Pressable
          onPress={handleApply}
          style={{ flex: 1.3, backgroundColor: "#1a5c2e", borderRadius: 7, paddingVertical: 7, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>تطبيق</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
  const [configRev, setConfigRev] = useState(0);
  const [showTuner, setShowTuner] = useState(false);

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
    [pageId, quira, configRev]
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
            isMadina={quira === "madina"}
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

      {/* ── DEBUG: Coordinate Tuner Panel (Hafs only) ── */}
      {__DEV_COORD_TUNER__ && isVisible && quira === "madina" && (
        <>
          {/* Toggle button */}
          <Pressable
            onPress={() => setShowTuner((v) => !v)}
            style={{
              position: "absolute", top: 4, left: 4, zIndex: 999,
              backgroundColor: showTuner ? "#c0392b" : "rgba(0,0,0,0.5)",
              borderRadius: 14, width: 28, height: 28,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name={showTuner ? "close" : "construct"} size={16} color="#fff" />
          </Pressable>

          {showTuner && (
            <CoordTunerPanel
              onApply={() => setConfigRev((r) => r + 1)}
            />
          )}
        </>
      )}
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
