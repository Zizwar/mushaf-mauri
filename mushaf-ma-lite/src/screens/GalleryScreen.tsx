import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../i18n";
import { useAppStore, useTheme } from "../store/useAppStore";
import { ACCENT, RECORDING_COLOR } from "../theme/themes";
import { allSuwar, getSuraName, rangeLabel } from "../utils/quranText";
import { fetchGallery, type GalleryItem } from "../utils/serverApi";
import { usePlayer } from "../hooks/usePlayer";
import { ScreenHeader } from "../components/ScreenHeader";
import { formatDate, formatDuration } from "../utils/format";

interface Props {
  onGoBack: () => void;
  onGoSettings: () => void;
}

export function GalleryScreen({ onGoBack, onGoSettings }: Props) {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const serverUrl = useAppStore((s) => s.serverUrl);
  const compareReciterId = useAppStore((s) => s.compareReciterId);
  const isRTL = lang === "ar";

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [suraFilter, setSuraFilter] = useState<number | null>(null);
  const [suraPickerOpen, setSuraPickerOpen] = useState(false);

  const player = usePlayer(compareReciterId);
  const hasServer = !!serverUrl.trim();

  const load = useCallback(async () => {
    if (!hasServer) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetchGallery(serverUrl, {
        sura: suraFilter ?? undefined,
        q: query.trim() || undefined,
      });
      setItems(res.items);
    } catch {
      setFailed(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [hasServer, serverUrl, suraFilter, query]);

  // reload on server/filter change; text search triggers via submit only
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasServer, serverUrl, suraFilter]);

  const suwar = useMemo(() => allSuwar(lang, "hafs"), [lang]);

  const renderItem = ({ item }: { item: GalleryItem }) => {
    const isPlaying =
      player.playingKey === item.id && player.playMode === "user";
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardColor,
            borderColor: isPlaying ? ACCENT : theme.borderColor,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: `${ACCENT}18` }]}>
          <Ionicons name="person" size={18} color={ACCENT} />
        </View>
        <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={[styles.cardTitle, { color: theme.color }]} numberOfLines={1}>
            {item.title ||
              rangeLabel(item.sura, item.ayaFrom, item.ayaTo, lang)}
          </Text>
          <Text style={[styles.cardSub, { color: theme.subColor }]} numberOfLines={1}>
            {item.reciterName ? `${item.reciterName} · ` : ""}
            {t(item.riwaya, lang)}
            {" · "}
            {formatDuration((item.duration ?? 0) * 1000)}
            {" · "}
            {formatDate(item.createdAt, lang)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Share.share({ message: item.shareUrl }).catch(() => {})}
        >
          <Ionicons name="share-social-outline" size={20} color={theme.subColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.playBtn,
            { backgroundColor: isPlaying ? RECORDING_COLOR : ACCENT },
          ]}
          onPress={() =>
            player.togglePlay({ key: item.id, uri: item.audioUrl })
          }
        >
          <Ionicons name={isPlaying ? "stop" : "play"} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader
        title={t("gallery_title", lang)}
        onBack={() => {
          player.stopPlayback();
          onGoBack();
        }}
      />

      {!hasServer ? (
        <View style={styles.emptyBox}>
          <Ionicons name="server-outline" size={54} color={theme.subColor} />
          <Text style={[styles.emptyTitle, { color: theme.color }]}>
            {t("gallery_no_server", lang)}
          </Text>
          <Text style={[styles.emptyHint, { color: theme.subColor }]}>
            {t("gallery_no_server_hint", lang)}
          </Text>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: ACCENT }]}
            onPress={onGoSettings}
          >
            <Ionicons name="settings-outline" size={16} color="#fff" />
            <Text style={styles.settingsBtnText}>{t("go_to_settings", lang)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Filters */}
          <View
            style={[styles.filterRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            <TouchableOpacity
              style={[
                styles.suraFilterChip,
                {
                  backgroundColor: suraFilter ? ACCENT : theme.cardColor,
                  borderColor: suraFilter ? ACCENT : theme.borderColor,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              onPress={() => setSuraPickerOpen(true)}
            >
              <Ionicons
                name="book-outline"
                size={14}
                color={suraFilter ? "#fff" : theme.color}
              />
              <Text
                style={{
                  color: suraFilter ? "#fff" : theme.color,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {suraFilter ? getSuraName(suraFilter, lang) : t("all_suras", lang)}
              </Text>
              {suraFilter ? (
                <TouchableOpacity onPress={() => setSuraFilter(null)}>
                  <Ionicons name="close-circle" size={14} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>

            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: theme.cardColor,
                  borderColor: theme.borderColor,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
            >
              <Ionicons name="search" size={16} color={theme.subColor} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme.color, textAlign: isRTL ? "right" : "left" },
                ]}
                placeholder={t("search_by_name", lang)}
                placeholderTextColor={theme.subColor}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => void load()}
                returnKeyType="search"
              />
            </View>
          </View>

          {/* List */}
          {failed ? (
            <View style={styles.emptyBox}>
              <Ionicons name="cloud-offline-outline" size={54} color={theme.subColor} />
              <Text style={[styles.emptyTitle, { color: theme.color }]}>
                {t("connection_failed", lang)}
              </Text>
              <TouchableOpacity
                style={[styles.settingsBtn, { backgroundColor: ACCENT }]}
                onPress={() => void load()}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.settingsBtnText}>{t("retry", lang)}</Text>
              </TouchableOpacity>
            </View>
          ) : items.length === 0 && !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="musical-notes-outline" size={54} color={theme.subColor} />
              <Text style={[styles.emptyTitle, { color: theme.color }]}>
                {t("gallery_empty", lang)}
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={() => void load()}
                  tintColor={ACCENT}
                />
              }
            />
          )}
        </>
      )}

      {/* Sura picker modal */}
      <Modal
        visible={suraPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSuraPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <View
            style={[
              styles.pickerCard,
              { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
            ]}
          >
            <View
              style={[styles.pickerHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            >
              <Text style={[styles.pickerTitle, { color: theme.color }]}>
                {t("sura", lang)}
              </Text>
              <TouchableOpacity onPress={() => setSuraPickerOpen(false)}>
                <Ionicons name="close" size={22} color={theme.subColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={suwar}
              keyExtractor={(item) => String(item.sura)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerRow,
                    {
                      borderBottomColor: theme.borderColor,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                  onPress={() => {
                    setSuraFilter(item.sura);
                    setSuraPickerOpen(false);
                  }}
                >
                  <Text style={{ color: theme.subColor, fontSize: 13, width: 30, textAlign: "center" }}>
                    {item.sura}
                  </Text>
                  <Text style={{ color: theme.color, fontSize: 15 }}>
                    {item.nameLocalized}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: "center" },
  suraFilterChip: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  searchWrap: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardSub: { fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 6 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 32,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyHint: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
  },
  settingsBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "70%",
    padding: 16,
  },
  pickerHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerTitle: { fontSize: 16, fontWeight: "800" },
  pickerRow: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
