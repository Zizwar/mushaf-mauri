import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../i18n";
import {
  resolveQuranFont,
  useAppStore,
  useTheme,
  type Riwaya,
} from "../store/useAppStore";
import { ACCENT } from "../theme/themes";
import { allSuwar, rangeLabel, toArabicNum, type SuraInfo } from "../utils/quranText";

interface Props {
  onOpenSura: (sura: number, aya?: number) => void;
  onNavigate: (screen: "recitations" | "gallery" | "settings") => void;
}

export function HomeScreen({ onOpenSura, onNavigate }: Props) {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const riwaya = useAppStore((s) => s.riwaya);
  const setRiwaya = useAppStore((s) => s.setRiwaya);
  const fontFamily = useAppStore((s) => s.textFontFamily);
  const lastPosition = useAppStore((s) => s.lastPosition);
  const isRTL = lang === "ar";
  const [query, setQuery] = useState("");

  const suwar = useMemo(() => allSuwar(lang, riwaya), [lang, riwaya]);
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return suwar;
    const lower = q.toLowerCase();
    return suwar.filter(
      (s) =>
        s.nameAr.includes(q) ||
        s.nameLocalized.toLowerCase().includes(lower) ||
        String(s.sura) === q
    );
  }, [suwar, query]);

  const quranFont = resolveQuranFont(fontFamily, riwaya);

  const renderSura = ({ item }: { item: SuraInfo }) => (
    <TouchableOpacity
      style={[
        styles.suraRow,
        {
          backgroundColor: theme.cardColor,
          borderColor: theme.borderColor,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
      onPress={() => onOpenSura(item.sura)}
    >
      <View style={[styles.suraBadge, { borderColor: ACCENT }]}>
        <Text style={[styles.suraBadgeText, { color: ACCENT }]}>
          {isRTL ? toArabicNum(item.sura) : item.sura}
        </Text>
      </View>
      <View style={[styles.suraNameWrap, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text
          style={[styles.suraNameAr, { color: theme.color, fontFamily: quranFont }]}
        >
          {item.nameAr}
        </Text>
        {lang !== "ar" ? (
          <Text style={[styles.suraSub, { color: theme.subColor }]}>
            {item.nameLocalized}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
        <Text style={[styles.ayahCount, { color: theme.subColor }]}>
          {isRTL ? toArabicNum(item.ayahCount) : item.ayahCount} {t("ayahs", lang)}
        </Text>
        <Ionicons
          name="mic-outline"
          size={16}
          color={theme.subColor}
          style={{ marginTop: 2 }}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={[styles.appName, { color: theme.color }]}>
            {t("app_name", lang)}
          </Text>
          <Text style={[styles.tagline, { color: theme.subColor }]}>
            {t("app_tagline", lang)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.topIcon}
          onPress={() => onNavigate("settings")}
        >
          <Ionicons name="settings-outline" size={24} color={theme.color} />
        </TouchableOpacity>
      </View>

      {/* Riwaya toggle */}
      <View
        style={[
          styles.riwayaRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {(["warsh", "hafs"] as Riwaya[]).map((r) => {
          const active = riwaya === r;
          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.riwayaChip,
                {
                  backgroundColor: active ? ACCENT : theme.cardColor,
                  borderColor: active ? ACCENT : theme.borderColor,
                },
              ]}
              onPress={() => setRiwaya(r)}
            >
              <Text
                style={[
                  styles.riwayaChipText,
                  { color: active ? "#fff" : theme.color },
                ]}
              >
                {t(r, lang)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
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
        <Ionicons name="search" size={18} color={theme.subColor} />
        <TextInput
          style={[
            styles.searchInput,
            { color: theme.color, textAlign: isRTL ? "right" : "left" },
          ]}
          placeholder={t("search_sura", lang)}
          placeholderTextColor={theme.subColor}
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={theme.subColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Continue card */}
      {lastPosition && !query ? (
        <TouchableOpacity
          style={[
            styles.continueCard,
            {
              backgroundColor: theme.cardColor,
              borderColor: ACCENT,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
          onPress={() => {
            if (lastPosition.riwaya !== riwaya) setRiwaya(lastPosition.riwaya);
            onOpenSura(lastPosition.sura, lastPosition.aya);
          }}
        >
          <Ionicons name="play-circle" size={28} color={ACCENT} />
          <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
            <Text style={[styles.continueTitle, { color: theme.color }]}>
              {t("continue_recitation", lang)}
            </Text>
            <Text style={[styles.continueSub, { color: theme.subColor }]}>
              {rangeLabel(lastPosition.sura, lastPosition.aya, lastPosition.aya, lang)}
              {"  ·  "}
              {t(lastPosition.riwaya, lang)}
            </Text>
          </View>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={theme.subColor}
          />
        </TouchableOpacity>
      ) : null}

      {/* Surah list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.sura)}
        renderItem={renderSura}
        contentContainerStyle={styles.listContent}
        initialNumToRender={16}
        windowSize={8}
      />

      {/* Bottom nav */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.cardColor,
            borderTopColor: theme.borderColor,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <BottomItem
          icon="albums-outline"
          label={t("my_recitations", lang)}
          color={theme.color}
          onPress={() => onNavigate("recitations")}
        />
        <TouchableOpacity
          style={[styles.micFab, { backgroundColor: ACCENT }]}
          onPress={() =>
            onOpenSura(lastPosition?.sura ?? 1, lastPosition?.aya ?? 1)
          }
        >
          <Ionicons name="mic" size={30} color="#fff" />
        </TouchableOpacity>
        <BottomItem
          icon="earth-outline"
          label={t("gallery", lang)}
          color={theme.color}
          onPress={() => onNavigate("gallery")}
        />
      </View>
    </SafeAreaView>
  );
}

function BottomItem({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.bottomItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.bottomLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appName: { fontSize: 22, fontWeight: "800" },
  tagline: { fontSize: 12, marginTop: 2 },
  topIcon: { padding: 8 },
  riwayaRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  riwayaChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  riwayaChipText: { fontSize: 15, fontWeight: "700" },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  continueCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  continueTitle: { fontSize: 14, fontWeight: "700" },
  continueSub: { fontSize: 12, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 8 },
  suraRow: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  suraBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  suraBadgeText: { fontSize: 13, fontWeight: "700" },
  suraNameWrap: { flex: 1 },
  suraNameAr: { fontSize: 20 },
  suraSub: { fontSize: 12, marginTop: 1 },
  ayahCount: { fontSize: 12 },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 6,
    paddingBottom: 10,
  },
  bottomItem: { alignItems: "center", gap: 2, minWidth: 90 },
  bottomLabel: { fontSize: 11 },
  micFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
