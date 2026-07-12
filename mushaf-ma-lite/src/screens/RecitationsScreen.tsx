import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../i18n";
import { useAppStore, useTheme } from "../store/useAppStore";
import { ACCENT, RECORDING_COLOR } from "../theme/themes";
import { rangeLabel } from "../utils/quranText";
import {
  deleteRecitation,
  exportRecitations,
  getAudioUri,
  importBackup,
  loadIndex,
  shareAudioFile,
  type RecitationMeta,
} from "../utils/recitationsStore";
import { usePlayer, type PlayableItem } from "../hooks/usePlayer";
import { ScreenHeader } from "../components/ScreenHeader";
import { DetailModal } from "./recitations/DetailModal";
import { NoteModal } from "./recitations/NoteModal";
import { UploadModal } from "./recitations/UploadModal";
import { formatDate, formatDuration } from "../utils/format";

type Filter = "all" | "ayah" | "session";

interface Props {
  onGoBack: () => void;
  onReRecord: (sura: number, aya: number) => void;
}

export function RecitationsScreen({ onGoBack, onReRecord }: Props) {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const compareReciterId = useAppStore((s) => s.compareReciterId);
  const dirty = useAppStore((s) => s.recitationsDirty);
  const bumpDirty = useAppStore((s) => s.bumpRecitationsDirty);
  const lastPosition = useAppStore((s) => s.lastPosition);
  const isRTL = lang === "ar";

  const [items, setItems] = useState<RecitationMeta[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [detailMeta, setDetailMeta] = useState<RecitationMeta | null>(null);
  const [noteMeta, setNoteMeta] = useState<RecitationMeta | null>(null);
  const [uploadMeta, setUploadMeta] = useState<RecitationMeta | null>(null);

  const player = usePlayer(compareReciterId);

  const refresh = useCallback(() => {
    const list = loadIndex().sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    setItems(list);
    // keep open modals in sync with fresh metadata
    setDetailMeta((m) => (m ? list.find((x) => x.id === m.id) ?? null : null));
    setNoteMeta((m) => (m ? list.find((x) => x.id === m.id) ?? null : null));
    setUploadMeta((m) => (m ? list.find((x) => x.id === m.id) ?? null : null));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, dirty]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter]
  );

  const playableList: PlayableItem[] = useMemo(() => {
    const out: PlayableItem[] = [];
    for (const m of filtered) {
      const uri = getAudioUri(m.id);
      if (uri) out.push({ key: m.id, uri, sura: m.sura, aya: m.ayaFrom });
    }
    return out;
  }, [filtered]);

  const handlePlayAll = () => player.playAll(playableList);

  const handleImport = async () => {
    const imported = await importBackup();
    if (imported === null) {
      Alert.alert(t("error", lang), t("import_failed", lang));
    } else if (imported > 0) {
      Alert.alert(t("import_success", lang), String(imported));
      bumpDirty();
    }
  };

  const handleExportAll = async () => {
    if (items.length === 0) {
      Alert.alert(t("export_empty", lang));
      return;
    }
    await exportRecitations(
      items.map((i) => i.id),
      "mushaf-ma-lite"
    );
  };

  const handleExportOne = async (meta: RecitationMeta) => {
    await exportRecitations(
      [meta.id],
      rangeLabel(meta.sura, meta.ayaFrom, meta.ayaTo, "en")
    );
  };

  const handleShareAudio = async (meta: RecitationMeta) => {
    await shareAudioFile(meta.id, rangeLabel(meta.sura, meta.ayaFrom, meta.ayaTo, lang));
  };

  const handleDelete = (meta: RecitationMeta) => {
    Alert.alert(
      t("delete_confirm_title", lang),
      t("delete_confirm_message", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("delete", lang),
          style: "destructive",
          onPress: () => {
            player.stopPlayback();
            deleteRecitation(meta.id);
            setDetailMeta(null);
            bumpDirty();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: RecitationMeta }) => {
    const isAyah = item.type === "ayah";
    const isPlaying =
      player.playingKey === item.id && player.playMode === "user";
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.cardColor,
            borderColor: isPlaying ? ACCENT : theme.borderColor,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
        onPress={() => setDetailMeta(item)}
      >
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isAyah ? `${ACCENT}18` : "#33669918" },
          ]}
        >
          <Ionicons
            name={isAyah ? "mic" : "radio"}
            size={18}
            color={isAyah ? ACCENT : "#336699"}
          />
        </View>

        <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={[styles.cardTitle, { color: theme.color }]}>
            {rangeLabel(item.sura, item.ayaFrom, item.ayaTo, lang)}
          </Text>
          <View
            style={[styles.cardSubRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            <Text style={[styles.cardSub, { color: theme.subColor }]}>
              {t(item.riwaya, lang)}
              {" · "}
              {formatDuration(item.durationMs)}
              {" · "}
              {formatDate(item.createdAt, lang)}
            </Text>
          </View>
          <View
            style={[styles.badgeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            {item.noteText ? (
              <Ionicons name="document-text-outline" size={13} color="#8e24aa" />
            ) : null}
            {item.hasVoiceNote ? (
              <Ionicons name="mic-circle-outline" size={14} color="#8e24aa" />
            ) : null}
            {item.upload ? (
              <Ionicons name="cloud-done-outline" size={13} color={ACCENT} />
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.playBtn,
            {
              backgroundColor: isPlaying ? RECORDING_COLOR : ACCENT,
            },
          ]}
          onPress={() => {
            const uri = getAudioUri(item.id);
            if (uri)
              player.togglePlay({
                key: item.id,
                uri,
                sura: item.sura,
                aya: item.ayaFrom,
              });
          }}
        >
          <Ionicons name={isPlaying ? "stop" : "play"} size={18} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader
        title={t("my_recitations", lang)}
        onBack={() => {
          player.stopPlayback();
          onGoBack();
        }}
        right={
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
            <TouchableOpacity style={styles.headerIcon} onPress={handleImport}>
              <Ionicons name="download-outline" size={22} color={theme.color} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={handleExportAll}>
              <Ionicons name="archive-outline" size={22} color={theme.color} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={handlePlayAll}
              disabled={playableList.length === 0}
            >
              <Ionicons
                name={player.isSequentialPlaying ? "stop-circle" : "play-circle"}
                size={24}
                color={player.isSequentialPlaying ? RECORDING_COLOR : ACCENT}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Filter chips */}
      <View
        style={[styles.filterRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      >
        {(
          [
            { key: "all", label: t("filter_all", lang) },
            { key: "ayah", label: t("filter_ayah", lang) },
            { key: "session", label: t("filter_session", lang) },
          ] as const
        ).map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? ACCENT : theme.cardColor,
                  borderColor: active ? ACCENT : theme.borderColor,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={{
                  color: active ? "#fff" : theme.color,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List / empty state */}
      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="mic-off-outline" size={54} color={theme.subColor} />
          <Text style={[styles.emptyTitle, { color: theme.color }]}>
            {t("no_recordings", lang)}
          </Text>
          <Text style={[styles.emptyHint, { color: theme.subColor }]}>
            {t("no_recordings_hint", lang)}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, isRTL ? { left: 20 } : { right: 20 }]}
        onPress={() =>
          onReRecord(lastPosition?.sura ?? 1, lastPosition?.aya ?? 1)
        }
      >
        <Ionicons name="mic" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      <DetailModal
        meta={detailMeta}
        visible={!!detailMeta}
        player={player}
        onClose={() => setDetailMeta(null)}
        onOpenNote={(m) => setNoteMeta(m)}
        onOpenUpload={(m) => setUploadMeta(m)}
        onReRecord={(m) => {
          player.stopPlayback();
          setDetailMeta(null);
          onReRecord(m.sura, m.ayaFrom);
        }}
        onExport={handleExportOne}
        onShareAudio={handleShareAudio}
        onDelete={handleDelete}
      />
      <NoteModal
        meta={noteMeta}
        visible={!!noteMeta}
        onClose={() => setNoteMeta(null)}
        onChanged={bumpDirty}
      />
      <UploadModal
        meta={uploadMeta}
        visible={!!uploadMeta}
        onClose={() => setUploadMeta(null)}
        onChanged={bumpDirty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIcon: { padding: 6 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  typeBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSubRow: { marginTop: 2 },
  cardSub: { fontSize: 12 },
  badgeRow: { gap: 6, marginTop: 4, minHeight: 14 },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 32,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyHint: { fontSize: 13, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: RECORDING_COLOR,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
});
