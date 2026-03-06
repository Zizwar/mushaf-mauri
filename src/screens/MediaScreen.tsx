import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  Linking,
  Dimensions,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import {
  DGHUSH_VIDEOS,
  RADIO_STATIONS,
  PLAYLIST_RECITERS,
  ytThumb,
  type YoutubeVideo,
  type RadioStation,
  type PlaylistReciter,
} from "../data/mediaData";

const { width: SW } = Dimensions.get("window");
const CARD_W = (SW - 48) / 2;

interface MediaScreenProps {
  onGoBack: () => void;
}

type Tab = "video" | "radio";

// ── YouTube video card (Dghush per-sura) ──────────────────────────
function VideoCard({
  item,
  cardBg,
  textColor,
  mutedColor,
  borderColor,
}: {
  item: YoutubeVideo;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  const handlePress = useCallback(() => {
    Linking.openURL(item.youtubeLink);
  }, [item.youtubeLink]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.videoCard,
        { backgroundColor: cardBg, borderColor },
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
      onPress={handlePress}
    >
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: ytThumb(item.id) }}
          style={styles.thumb}
          resizeMode="cover"
        />
        {/* Play overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        </View>
        {/* YouTube badge */}
        <View style={styles.ytBadge}>
          <Ionicons name="logo-youtube" size={14} color="#ff0000" />
        </View>
      </View>

      {/* Title */}
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: textColor }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.videoSub, { color: mutedColor }]} numberOfLines={1}>
          ورش عن نافع — الدغوش
        </Text>
      </View>
    </Pressable>
  );
}

// ── Playlist reciter card (one per reciter, full width) ────────────
function PlaylistCard({
  item,
  cardBg,
  textColor,
  mutedColor,
  borderColor,
}: {
  item: PlaylistReciter;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  const handlePress = useCallback(() => {
    Linking.openURL(item.playlistUrl);
  }, [item.playlistUrl]);

  const badgeColor = item.isWarsh ? "#1a5c2e" : "#1565c0";
  const badgeBg = item.isWarsh ? "#e8f5e9" : "#e3f2fd";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.playlistCard,
        { backgroundColor: cardBg, borderColor },
        pressed && { opacity: 0.82 },
      ]}
      onPress={handlePress}
    >
      {/* Left: mic icon */}
      <View style={[styles.playlistIconWrap, { backgroundColor: badgeColor + "22" }]}>
        <Ionicons name="mic" size={22} color={badgeColor} />
      </View>

      {/* Center: info */}
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.playlistDesc, { color: mutedColor }]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>

      {/* Right: badge + play icon */}
      <View style={styles.playlistRight}>
        <View style={[styles.recitationBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.recitationBadgeText, { color: badgeColor }]}>
            {item.recitation}
          </Text>
        </View>
        <Ionicons name="play-circle" size={26} color={badgeColor} style={{ marginTop: 6 }} />
      </View>
    </Pressable>
  );
}

// ── Radio card ────────────────────────────────────────────────────
function RadioCard({
  item,
  cardBg,
  textColor,
  borderColor,
}: {
  item: RadioStation;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.radioCard,
        { backgroundColor: cardBg, borderColor },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.radioIconWrap, { backgroundColor: "#1a5c2e22" }]}>
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.radioLogo} resizeMode="contain" />
        ) : (
          <Ionicons name="radio" size={28} color="#1a5c2e" />
        )}
      </View>
      <View style={styles.radioInfo}>
        <Text style={[styles.radioName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
      </View>
      <Ionicons name="play-circle" size={30} color="#1a5c2e" />
    </Pressable>
  );
}

// ── Section header ────────────────────────────────────────────────
function SectionHeader({ title, color, bg }: { title: string; color: string; bg: string }) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: bg }]}>
      <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
    </View>
  );
}

// ── Dghush grid wrapper (FlatList inside SectionList) ─────────────
function DghushGrid({
  cardBg,
  textColor,
  mutedColor,
  borderColor,
}: {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  const rows: YoutubeVideo[][] = [];
  for (let i = 0; i < DGHUSH_VIDEOS.length; i += 2) {
    rows.push(DGHUSH_VIDEOS.slice(i, i + 2));
  }
  return (
    <>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.row}>
          {row.map((item) => (
            <VideoCard
              key={item.id}
              item={item}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
          ))}
          {row.length === 1 && <View style={{ width: CARD_W }} />}
        </View>
      ))}
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function MediaScreen({ onGoBack }: MediaScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const isDark = !!theme.night;

  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";
  const accentColor = "#1a5c2e";
  const sectionBg = isDark ? "#0d2016" : "#f0f4f0";

  const [tab, setTab] = useState<Tab>("video");

  const renderPlaylistItem = useCallback(
    ({ item }: { item: PlaylistReciter }) => (
      <PlaylistCard
        item={item}
        cardBg={cardBg}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
      />
    ),
    [cardBg, textColor, mutedColor, borderColor]
  );

  const renderRadioItem = useCallback(
    ({ item }: { item: RadioStation }) => (
      <RadioCard
        item={item}
        cardBg={cardBg}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
      />
    ),
    [cardBg, textColor, mutedColor, borderColor]
  );

  // Build video tab sections: Dghush first, then playlist reciters
  type VideoSection =
    | { key: "dghush"; data: [null] }
    | { key: "playlists"; data: PlaylistReciter[] };

  const videoSections: VideoSection[] = [
    { key: "dghush", data: [null] },
    { key: "playlists", data: PLAYLIST_RECITERS },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("media", lang)}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: borderColor }]}>
        <Pressable
          style={[styles.tab, tab === "video" && { borderBottomColor: accentColor, borderBottomWidth: 2.5 }]}
          onPress={() => setTab("video")}
        >
          <Ionicons name="logo-youtube" size={18} color={tab === "video" ? accentColor : mutedColor} />
          <Text style={[styles.tabText, { color: tab === "video" ? accentColor : mutedColor }]}>
            {t("media_video", lang)}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "radio" && { borderBottomColor: accentColor, borderBottomWidth: 2.5 }]}
          onPress={() => setTab("radio")}
        >
          <Ionicons name="radio" size={18} color={tab === "radio" ? accentColor : mutedColor} />
          <Text style={[styles.tabText, { color: tab === "radio" ? accentColor : mutedColor }]}>
            {t("media_radio", lang)}
          </Text>
        </Pressable>
      </View>

      {tab === "video" ? (
        <SectionList
          sections={videoSections as any}
          keyExtractor={(item, index) =>
            item ? (item as PlaylistReciter).id : `dghush-${index}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => {
            if ((section as VideoSection).key === "dghush") {
              return (
                <View style={[styles.reciterBanner, { backgroundColor: sectionBg }]}>
                  <View style={[styles.reciterIconWrap, { backgroundColor: accentColor + "22" }]}>
                    <Ionicons name="mic" size={24} color={accentColor} />
                  </View>
                  <View style={styles.reciterInfo}>
                    <Text style={[styles.reciterName, { color: accentColor }]}>
                      الشيخ عبد الكريم الدغوش
                    </Text>
                    <Text style={[styles.reciterSub, { color: mutedColor }]}>
                      {t("warsh_recitation", lang)} — {DGHUSH_VIDEOS.length} {t("suras_count", lang)}
                    </Text>
                  </View>
                </View>
              );
            }
            return (
              <SectionHeader
                title={`قوائم تشغيل — ${PLAYLIST_RECITERS.length} قارئ`}
                color={accentColor}
                bg={sectionBg}
              />
            );
          }}
          renderItem={({ item, section }) => {
            if ((section as VideoSection).key === "dghush") {
              return (
                <DghushGrid
                  cardBg={cardBg}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  borderColor={borderColor}
                />
              );
            }
            return renderPlaylistItem({ item: item as PlaylistReciter });
          }}
        />
      ) : RADIO_STATIONS.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="radio-outline" size={64} color={mutedColor} />
          <Text style={[styles.emptyText, { color: mutedColor }]}>{t("coming_soon", lang)}</Text>
        </View>
      ) : (
        <FlatList
          data={RADIO_STATIONS}
          keyExtractor={(r) => r.id}
          renderItem={renderRadioItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 14, fontWeight: "700" },

  // Reciter banner (Dghush)
  reciterBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
  },
  reciterIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  reciterInfo: { flex: 1 },
  reciterName: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  reciterSub: { fontSize: 12, textAlign: "right", marginTop: 2 },

  // Section header (playlists)
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  sectionHeaderText: { fontSize: 13, fontWeight: "700", textAlign: "right" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },
  row: { flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 12 },

  // Video card (Dghush)
  videoCard: {
    width: CARD_W,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbWrap: {
    width: "100%",
    height: CARD_W * 0.56,
    position: "relative",
    backgroundColor: "#000",
  },
  thumb: { width: "100%", height: "100%" },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  ytBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 4,
    padding: 3,
  },
  videoInfo: { padding: 10, gap: 4 },
  videoTitle: { fontSize: 12, fontWeight: "700", textAlign: "right", lineHeight: 18 },
  videoSub: { fontSize: 10, textAlign: "right" },

  // Playlist reciter card
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  playlistIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  playlistDesc: { fontSize: 11, textAlign: "right", marginTop: 2, lineHeight: 16 },
  playlistRight: { alignItems: "center", flexShrink: 0 },
  recitationBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recitationBadgeText: { fontSize: 11, fontWeight: "700" },

  // Radio card
  radioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  radioIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  radioLogo: { width: 36, height: 36, borderRadius: 18 },
  radioInfo: { flex: 1 },
  radioName: { fontSize: 15, fontWeight: "700", textAlign: "right" },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyText: { fontSize: 18, fontWeight: "600" },
});
