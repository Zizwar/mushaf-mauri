import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Linking,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";
import { PLAYLIST_RECITERS, type PlaylistReciter } from "../data/mediaData";

// Import the Quran radio stations
const { Stations: QURAN_STATIONS } = require("../data/QuranStations") as {
  Stations: Array<{
    id: string;
    name: string;
    name_en: string;
    radio_url: string;
    category: string;
    category_en: string;
  }>;
};

const { width: SW } = Dimensions.get("window");

interface MediaScreenProps {
  onGoBack: () => void;
}

type Tab = "video" | "radio";

// Recitation sort order: ورش first, then close riwayat, then حفص last
const RECITATION_ORDER: Record<string, number> = {
  "ورش": 0,
  "قالون": 1,
  "السوسي": 2,
  "الدوري": 3,
  "رويس": 4,
  "روح": 5,
  "شعبة": 6,
  "إسحاق": 7,
  "إدريس": 8,
  "ابن ذكوان": 9,
  "هشام": 10,
  "خلاد": 11,
  "خلف": 12,
  "قنبل": 13,
  "البزي": 14,
  "ابن وردان": 15,
  "ابن جماز": 16,
  "ابي الحارث": 17,
  "حفص": 99,
};

const VIDEO_FILTERS = ["الكل", "ورش", "قالون", "شعبة", "روايات أخرى", "حفص"];

const RADIO_CATEGORIES = [
  "الكل",
  "رواية ورش عن نافع",
  "رواية قالون عن نافع",
  "روايات اخرى",
  "قراء",
  "تفسير",
  "منوعات",
  "أذكار",
  "الرقية الشرعية",
  "السيرة النبوية",
  "ترجمة",
];

// ── Playlist reciter card ──────────────────────────────────────────
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

  const isWarsh = item.isWarsh;
  const isNearWarsh =
    !isWarsh && item.recitation !== "حفص";

  const badgeColor = isWarsh
    ? "#1a5c2e"
    : isNearWarsh
    ? "#6a1b9a"
    : "#1565c0";
  const badgeBg = isWarsh
    ? "#e8f5e9"
    : isNearWarsh
    ? "#f3e5f5"
    : "#e3f2fd";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.playlistCard,
        { backgroundColor: cardBg, borderColor: isWarsh ? "#1a5c2e44" : borderColor },
        pressed && { opacity: 0.82 },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.playlistIconWrap, { backgroundColor: badgeColor + "22" }]}>
        <Ionicons name="mic" size={22} color={badgeColor} />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.playlistDesc, { color: mutedColor }]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
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

// ── Video Tab ─────────────────────────────────────────────────────
function VideoTab({
  isDark,
  cardBg,
  textColor,
  mutedColor,
  borderColor,
}: {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("الكل");

  const accentColor = "#1a5c2e";
  const inputBg = isDark ? "#1a1a2e" : "#f5f5f5";

  const sortedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = PLAYLIST_RECITERS.filter((item) => {
      const matchFilter =
        selectedFilter === "الكل" ||
        (selectedFilter === "ورش" && item.isWarsh) ||
        (selectedFilter === "حفص" && item.recitation === "حفص") ||
        (selectedFilter === "قالون" && item.recitation === "قالون") ||
        (selectedFilter === "شعبة" && item.recitation === "شعبة") ||
        (selectedFilter === "روايات أخرى" &&
          !item.isWarsh &&
          item.recitation !== "حفص" &&
          item.recitation !== "قالون" &&
          item.recitation !== "شعبة");
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.recitation.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });

    return filtered.slice().sort((a, b) => {
      const oa = RECITATION_ORDER[a.recitation] ?? 50;
      const ob = RECITATION_ORDER[b.recitation] ?? 50;
      return oa - ob;
    });
  }, [search, selectedFilter]);

  const renderItem = useCallback(
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

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search" size={18} color={mutedColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="ابحث عن قارئ أو رواية..."
          placeholderTextColor={mutedColor}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={mutedColor} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {VIDEO_FILTERS.map((f) => {
          const active = selectedFilter === f;
          const chipColor =
            f === "ورش"
              ? "#1a5c2e"
              : f === "روايات أخرى"
              ? "#6a1b9a"
              : f === "قالون"
              ? "#6a1b9a"
              : f === "شعبة"
              ? "#e65100"
              : "#1565c0";
          return (
            <Pressable
              key={f}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? chipColor
                    : isDark
                    ? "#1a1a2e"
                    : "#f0f0f0",
                },
              ]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : textColor }]}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.resultCount, { color: mutedColor }]}>
        {sortedAndFiltered.length} قائمة تشغيل
      </Text>

      <FlatList
        data={sortedAndFiltered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.listFlex}
        contentContainerStyle={styles.videoListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="musical-notes-outline" size={48} color={mutedColor} />
            <Text style={[styles.emptyText, { color: mutedColor }]}>لا توجد نتائج</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Radio Tab ─────────────────────────────────────────────────────
function RadioTab({
  isDark,
  cardBg,
  textColor,
  mutedColor,
  borderColor,
}: {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const accentColor = "#1a5c2e";
  const inputBg = isDark ? "#1a1a2e" : "#f5f5f5";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return QURAN_STATIONS.filter((s) => {
      if (s.category === "فتاوى") return false;
      const matchCat =
        selectedCategory === "الكل" || s.category === selectedCategory;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.name_en.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const handlePlay = useCallback(
    async (station: (typeof QURAN_STATIONS)[0]) => {
      if (playingId === station.id) {
        status.playing ? player.pause() : player.play();
        return;
      }
      setPlayingId(station.id);
      setLoadingId(station.id);
      try {
        player.replace({ uri: station.radio_url });
        player.play();
      } catch {
        setPlayingId(null);
      } finally {
        setLoadingId(null);
      }
    },
    [playingId, status.playing, player]
  );

  const getCategoryColor = (cat: string) =>
    cat === "رواية ورش عن نافع"
      ? "#1a5c2e"
      : cat === "رواية قالون عن نافع" || cat === "روايات اخرى"
      ? "#6a1b9a"
      : cat === "تفسير"
      ? "#0277bd"
      : "#555";

  const renderStation = useCallback(
    ({ item }: { item: (typeof QURAN_STATIONS)[0] }) => {
      const isActive = playingId === item.id;
      const isPlaying = isActive && status.playing;
      const isLoading = loadingId === item.id;
      const catColor = getCategoryColor(item.category);

      return (
        <Pressable
          style={({ pressed }) => [
            styles.stationCard,
            {
              backgroundColor: isActive ? (isDark ? "#0d2016" : "#e8f5e9") : cardBg,
              borderColor: isActive ? accentColor : borderColor,
            },
            pressed && { opacity: 0.82 },
          ]}
          onPress={() => handlePlay(item)}
        >
          <View
            style={[
              styles.stationIconWrap,
              { backgroundColor: isActive ? accentColor : accentColor + "18" },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isActive ? "#fff" : accentColor} />
            ) : isPlaying ? (
              <Ionicons name="pause" size={20} color={isActive ? "#fff" : accentColor} />
            ) : (
              <Ionicons name="radio" size={20} color={isActive ? "#fff" : accentColor} />
            )}
          </View>
          <View style={styles.stationInfo}>
            <Text
              style={[styles.stationName, { color: isActive ? accentColor : textColor }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <View style={[styles.categoryPill, { backgroundColor: catColor + "18" }]}>
              <Text style={[styles.categoryPillText, { color: catColor }]}>
                {item.category}
              </Text>
            </View>
          </View>
          {isPlaying ? (
            <Ionicons name="volume-high" size={20} color={accentColor} />
          ) : (
            <Ionicons
              name="play-circle-outline"
              size={28}
              color={isActive ? accentColor : mutedColor}
            />
          )}
        </Pressable>
      );
    },
    [playingId, status.playing, loadingId, isDark, cardBg, textColor, mutedColor, borderColor, handlePlay]
  );

  const currentStation = playingId
    ? QURAN_STATIONS.find((s) => s.id === playingId)
    : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search" size={18} color={mutedColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="ابحث عن محطة أو قارئ..."
          placeholderTextColor={mutedColor}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={mutedColor} />
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {RADIO_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          const catColor =
            cat === "رواية ورش عن نافع"
              ? "#1a5c2e"
              : cat === "رواية قالون عن نافع" || cat === "روايات اخرى"
              ? "#6a1b9a"
              : cat === "تفسير"
              ? "#0277bd"
              : "#1a5c2e";
          return (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                { backgroundColor: active ? catColor : isDark ? "#1a1a2e" : "#f0f0f0" },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : textColor }]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.resultCount, { color: mutedColor }]}>
        {filtered.length} محطة
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={renderStation}
        style={styles.listFlex}
        contentContainerStyle={[
          styles.radioListContent,
          currentStation && { paddingBottom: 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="radio-outline" size={48} color={mutedColor} />
            <Text style={[styles.emptyText, { color: mutedColor }]}>لا توجد نتائج</Text>
          </View>
        }
      />

      {/* Mini player */}
      {currentStation && (
        <View
          style={[
            styles.miniPlayer,
            { backgroundColor: isDark ? "#0d2016" : "#1a5c2e" },
          ]}
        >
          <Pressable
            style={styles.miniPlayBtn}
            onPress={() => (status.playing ? player.pause() : player.play())}
          >
            <Ionicons
              name={status.playing ? "pause-circle" : "play-circle"}
              size={40}
              color="#fff"
            />
          </Pressable>
          <View style={styles.miniInfo}>
            <Text style={styles.miniName} numberOfLines={1}>
              {currentStation.name}
            </Text>
            <Text style={styles.miniStatus}>
              {!status.isLoaded
                ? "جاري التحميل..."
                : status.playing
                ? "يعزف الآن ▶"
                : "متوقف مؤقتاً ⏸"}
            </Text>
          </View>
          <Pressable
            hitSlop={12}
            onPress={() => {
              player.pause();
              setPlayingId(null);
            }}
          >
            <Ionicons name="close" size={22} color="#ffffffaa" />
          </Pressable>
        </View>
      )}
    </View>
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

  const [tab, setTab] = useState<Tab>("video");

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
          style={[
            styles.tab,
            tab === "video" && { borderBottomColor: accentColor, borderBottomWidth: 2.5 },
          ]}
          onPress={() => setTab("video")}
        >
          <Ionicons
            name="logo-youtube"
            size={18}
            color={tab === "video" ? accentColor : mutedColor}
          />
          <Text style={[styles.tabText, { color: tab === "video" ? accentColor : mutedColor }]}>
            {t("media_video", lang)}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            tab === "radio" && { borderBottomColor: accentColor, borderBottomWidth: 2.5 },
          ]}
          onPress={() => setTab("radio")}
        >
          <Ionicons
            name="radio"
            size={18}
            color={tab === "radio" ? accentColor : mutedColor}
          />
          <Text style={[styles.tabText, { color: tab === "radio" ? accentColor : mutedColor }]}>
            {t("media_radio", lang)}
          </Text>
        </Pressable>
      </View>

      {tab === "video" ? (
        <VideoTab
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          mutedColor={mutedColor}
          borderColor={borderColor}
        />
      ) : (
        <RadioTab
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          mutedColor={mutedColor}
          borderColor={borderColor}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
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

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  // List
  listFlex: { flex: 1 },

  // Chips
  chipsScroll: { height: 46, flexShrink: 0 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, alignItems: "center" },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  resultCount: {
    fontSize: 11,
    textAlign: "right",
    paddingHorizontal: 18,
    marginBottom: 4,
  },

  // Playlist cards (video tab)
  videoListContent: { paddingHorizontal: 16, paddingBottom: 40 },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
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
  recitationBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recitationBadgeText: { fontSize: 11, fontWeight: "700" },

  // Radio station cards
  radioListContent: { paddingHorizontal: 16, paddingBottom: 20 },
  stationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  stationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stationInfo: { flex: 1 },
  stationName: { fontSize: 13, fontWeight: "700", textAlign: "right", lineHeight: 18 },
  categoryPill: {
    alignSelf: "flex-end",
    marginTop: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryPillText: { fontSize: 10, fontWeight: "600" },

  // Mini player
  miniPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  miniPlayBtn: { flexShrink: 0 },
  miniInfo: { flex: 1 },
  miniName: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "right" },
  miniStatus: { color: "#ffffffaa", fontSize: 11, textAlign: "right", marginTop: 2 },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyText: { fontSize: 16, fontWeight: "600" },
});
