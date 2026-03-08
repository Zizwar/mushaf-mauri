import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t, type LangKey } from "../i18n";
import {
  allSuwar,
  getAyahsForSura,
  getSuraName,
  getPageBySuraAya,
} from "../utils/quranHelpers";
import { getAyahText } from "../utils/ayahText";
// @ts-ignore
import { listVoiceMoqri } from "../data/listAuthor";

const ACCENT = "#1a5c2e";
const ACCENT_LIGHT = "#e8f5e9";
const { width: SW } = Dimensions.get("window");

interface RecitingScreenProps {
  onGoBack: () => void;
}

// ── Sura picker modal ────────────────────────────────────────────
function SuraModal({
  visible, onClose, onSelect, selected, title,
}: {
  visible: boolean; onClose: () => void;
  onSelect: (v: number) => void; selected: number; title: string;
}) {
  const [filter, setFilter] = useState("");
  const suwar = useMemo(() => allSuwar(), []);
  const filtered = useMemo(
    () => filter ? suwar.filter((s) => s.label.includes(filter)) : suwar,
    [filter, suwar]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={ms.sheet}>
          <View style={ms.handle} />
          <Text style={ms.title}>{title}</Text>
          <View style={ms.filterRow}>
            <Ionicons name="search-outline" size={18} color="#999" style={ms.searchIcon} />
            <TextInput
              style={ms.filterInput}
              placeholder="ابحث..."
              placeholderTextColor="#aaa"
              value={filter}
              onChangeText={setFilter}
              autoFocus
              textAlign="right"
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(s) => String(s.value)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: s }) => {
              const active = selected === s.value;
              return (
                <Pressable
                  style={[ms.item, active && ms.itemActive]}
                  onPress={() => { onSelect(s.value); setFilter(""); onClose(); }}
                >
                  <Text style={[ms.itemNum, active && ms.itemNumActive]}>{s.value}</Text>
                  <Text style={[ms.itemText, active && ms.itemTextActive]}>{s.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={ACCENT} />}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Aya picker modal ─────────────────────────────────────────────
function AyaModal({
  visible, onClose, onSelect, selected, title, ayahs,
}: {
  visible: boolean; onClose: () => void;
  onSelect: (v: number) => void; selected: number;
  title: string; ayahs: { value: number; label: string }[];
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.sheet, { maxHeight: "50%" }]}>
          <View style={ms.handle} />
          <Text style={ms.title}>{title}</Text>
          <FlatList
            data={ayahs}
            keyExtractor={(a) => String(a.value)}
            numColumns={6}
            contentContainerStyle={ms.ayaGrid}
            renderItem={({ item: a }) => {
              const active = selected === a.value;
              return (
                <Pressable
                  style={[ms.ayaChip, active && ms.ayaChipActive]}
                  onPress={() => { onSelect(a.value); onClose(); }}
                >
                  <Text style={[ms.ayaChipText, active && ms.ayaChipTextActive]}>
                    {a.value}
                  </Text>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Reciter picker modal ──────────────────────────────────────────
function ReciterPickerModal({
  visible, onClose, onSelect, selectedId, lang, isDark, reciters,
}: {
  visible: boolean; onClose: () => void;
  onSelect: (id: string) => void; selectedId: string;
  lang: LangKey; isDark: boolean;
  reciters: { id: string; voice: string }[];
}) {

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.sheet, { backgroundColor: isDark ? "#1a1a2e" : "#fff" }]}>
          <View style={ms.handle} />
          <Text style={[ms.title, { color: isDark ? "#eee" : "#222" }]}>{t("choose_reciter", lang)}</Text>
          <FlatList
            data={reciters}
            keyExtractor={(r) => r.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: r }) => {
              const active = selectedId === r.id;
              return (
                <Pressable
                  style={[ms.item, active && ms.itemActive, { borderBottomColor: isDark ? "#333" : "#f0f0f0" }]}
                  onPress={() => { onSelect(r.id); onClose(); }}
                >
                  <Ionicons name="mic-outline" size={16} color={active ? ACCENT : "#aaa"} />
                  <Text style={[ms.itemText, { flex: 1, textAlign: "right" }, active && ms.itemTextActive,
                    !active && { color: isDark ? "#ccc" : "#333" }]}>
                    {r.voice}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={ACCENT} />}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────
export default function RecitingScreen({ onGoBack }: RecitingScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quranFont = useAppStore((s) => s.quranFont);
  const setSelectedAya = useAppStore((s) => s.setSelectedAya);
  const setPendingPlayAya = useAppStore((s) => s.setPendingPlayAya);
  const setTekrar = useAppStore((s) => s.setTekrar);
  const quira = useAppStore((s) => s.quira);
  const setQuira = useAppStore((s) => s.setQuira);
  const setMoqriId = useAppStore((s) => s.setMoqriId);

  const isDark = !!theme.night;
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;

  const [startSura, setStartSura] = useState(1);
  const [startAya, setStartAya] = useState(1);
  const [endSura, setEndSura] = useState(1);
  const [endAya, setEndAya] = useState(7);
  const [repeatCount, setRepeatCount] = useState(3);   // full-range repeat
  const [ayahRepeat, setAyahRepeat] = useState(1);     // per-ayah repeat

  const [modal, setModal] = useState<"startSura" | "startAya" | "endSura" | "endAya" | "reciter" | null>(null);

  // For warsh mode: pick a madina-compatible reciter to use when auto-switching
  const madinaReciters = useMemo(() => {
    const loc: Record<string, string> = {};
    const keys = [
      "recite_hudhaify","recite_husary","recite_basfar","recite_ayyoub",
      "recite_minshawy","recite_abdul_basit","recite_banna","recite_tablawy",
      "recite_jaber","recite_afasy","recite_shaatree","recite_qatami",
      "recite_khaleefa","recite_salamah","recite_jibreel","recite_ghamadi",
      "recite_sudais","recite_shuraym","recite_maher","recite_ajamy",
      "recite_juhanee","recite_muhsin","recite_abbad","recite_yaser",
      "recite_rifai","recite_ayman","recite_moalim","recite_mujawwad",
      "recite_warsh","recite_ibrahim_dosary","recite_yassin","recite_user",
    ];
    for (const k of keys) loc[k] = t(k as any, lang);
    const all = listVoiceMoqri(loc) as { id: string; voice: string; type?: string }[];
    return all.filter((r) => !r.type && r.id !== "__user_recording__");
  }, [lang]);
  const defaultMadinaId = madinaReciters[0]?.id ?? "Husary_64kbps";
  const [selectedMadinaReciter, setSelectedMadinaReciter] = useState(defaultMadinaId);
  const selectedMadinaVoice = madinaReciters.find((r) => r.id === selectedMadinaReciter)?.voice ?? "";

  const startAyahs = useMemo(() => getAyahsForSura(startSura), [startSura]);
  const endAyahs = useMemo(() => getAyahsForSura(endSura), [endSura]);

  const [startText, setStartText] = useState<string | null>(null);
  const [endText, setEndText] = useState<string | null>(null);
  useEffect(() => {
    getAyahText(startSura, startAya, quira).then(setStartText);
  }, [startSura, startAya, quira]);
  useEffect(() => {
    getAyahText(endSura, endAya, quira).then(setEndText);
  }, [endSura, endAya, quira]);

  const handleStartSuraChange = useCallback((sura: number) => {
    setStartSura(sura); setStartAya(1);
  }, []);
  const handleEndSuraChange = useCallback((sura: number) => {
    setEndSura(sura); setEndAya(1);
  }, []);

  const handleStart = useCallback(() => {
    if (startSura > endSura || (startSura === endSura && startAya > endAya)) {
      Alert.alert(t("recitation", lang), t("search_err_length", lang));
      return;
    }
    // If user is on Warsh Muhammadi, auto-switch to Madina for tekrar compatibility
    const effectiveQuira = quira === "warsh" ? "madina" : quira;
    if (quira === "warsh") {
      setQuira("madina");
      setMoqriId(selectedMadinaReciter);
    }
    const page = getPageBySuraAya(startSura, startAya, effectiveQuira);
    setTekrar({ startSura, startAya, endSura, endAya, repeatCount, currentRepeat: 0, ayahRepeat, currentAyahRepeat: 0, active: true });
    setSelectedAya({ sura: startSura, aya: startAya, page, id: `s${startSura}a${startAya}z` });
    setPendingPlayAya({ sura: startSura, aya: startAya, page });
    onGoBack();
  }, [startSura, startAya, endSura, endAya, repeatCount, ayahRepeat, lang, quira,
    selectedMadinaReciter, setQuira, setMoqriId,
    setTekrar, setSelectedAya, setPendingPlayAya, onGoBack]);

  const REPEATS = [1, 2, 3, 5, 7, 10];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t("recitation", lang)}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <View style={[styles.hero, { backgroundColor: isDark ? "#0d2016" : ACCENT_LIGHT }]}>
          <View style={styles.heroIconRow}>
            <View style={[styles.heroIconBubble, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="headset" size={32} color={ACCENT} />
            </View>
            <View style={[styles.heroDivider, { backgroundColor: ACCENT + "30" }]} />
            <View style={[styles.heroIconBubble, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="mic" size={32} color={ACCENT} />
            </View>
            <View style={[styles.heroDivider, { backgroundColor: ACCENT + "30" }]} />
            <View style={[styles.heroIconBubble, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="repeat" size={32} color={ACCENT} />
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: ACCENT }]}>{t("recitation", lang)}</Text>
          <Text style={[styles.heroSub, { color: isDark ? "#5a9a6e" : "#4a7c5e" }]}>
            {getSuraName(startSura)} → {getSuraName(endSura)}
          </Text>
        </View>

        {/* Warsh notice */}
        {quira === "warsh" && (
          <View style={styles.warshNotice}>
            <View style={styles.warshNoticeTop}>
              <Ionicons name="information-circle" size={20} color="#b45309" />
              <Text style={styles.warshNoticeText}>{t("warsh_tekrar_notice", lang)}</Text>
            </View>
            <Pressable
              style={styles.warshReciterRow}
              onPress={() => setModal("reciter")}
            >
              <Ionicons name="mic-outline" size={16} color="#92400e" />
              <Text style={styles.warshReciterName} numberOfLines={1}>{selectedMadinaVoice}</Text>
              <Ionicons name="chevron-down" size={15} color="#92400e" />
            </Pressable>
          </View>
        )}

        {/* FROM / TO card */}
        <View style={[styles.rangeCard, { backgroundColor: cardBg, borderColor }]}>

          {/* FROM row */}
          <View style={styles.rangeRow}>
            <View style={[styles.rangeBadge, { backgroundColor: "#4285f422" }]}>
              <Ionicons name="play-circle" size={18} color="#4285f4" />
              <Text style={[styles.rangeBadgeText, { color: "#4285f4" }]}>{t("from", lang)}</Text>
            </View>
            <View style={styles.rangeSelectors}>
              <Pressable
                style={[styles.selectorBtn, { borderColor: borderColor, backgroundColor: isDark ? "#111827" : "#f8f9fa" }]}
                onPress={() => setModal("startSura")}
              >
                <Ionicons name="book-outline" size={14} color={ACCENT} />
                <Text style={[styles.selectorText, { color: textColor }]} numberOfLines={1}>
                  {getSuraName(startSura)}
                </Text>
                <Ionicons name="chevron-down" size={13} color={mutedColor} />
              </Pressable>
              <Pressable
                style={[styles.selectorBtnSmall, { borderColor: borderColor, backgroundColor: isDark ? "#111827" : "#f8f9fa" }]}
                onPress={() => setModal("startAya")}
              >
                <Text style={[styles.selectorText, { color: textColor }]}>{startAya}</Text>
                <Ionicons name="chevron-down" size={13} color={mutedColor} />
              </Pressable>
            </View>
          </View>

          {/* Ayah preview */}
          {startText ? (
            <Text style={[styles.ayahPreview, quranFont !== "default" && { fontFamily: quranFont }]}
              numberOfLines={2}>
              {startText}
            </Text>
          ) : null}

          <View style={[styles.rangeDivider, { backgroundColor: borderColor }]} />

          {/* TO row */}
          <View style={styles.rangeRow}>
            <View style={[styles.rangeBadge, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="stop-circle" size={18} color={ACCENT} />
              <Text style={[styles.rangeBadgeText, { color: ACCENT }]}>{t("to", lang)}</Text>
            </View>
            <View style={styles.rangeSelectors}>
              <Pressable
                style={[styles.selectorBtn, { borderColor: borderColor, backgroundColor: isDark ? "#111827" : "#f8f9fa" }]}
                onPress={() => setModal("endSura")}
              >
                <Ionicons name="book-outline" size={14} color={ACCENT} />
                <Text style={[styles.selectorText, { color: textColor }]} numberOfLines={1}>
                  {getSuraName(endSura)}
                </Text>
                <Ionicons name="chevron-down" size={13} color={mutedColor} />
              </Pressable>
              <Pressable
                style={[styles.selectorBtnSmall, { borderColor: borderColor, backgroundColor: isDark ? "#111827" : "#f8f9fa" }]}
                onPress={() => setModal("endAya")}
              >
                <Text style={[styles.selectorText, { color: textColor }]}>{endAya}</Text>
                <Ionicons name="chevron-down" size={13} color={mutedColor} />
              </Pressable>
            </View>
          </View>

          {/* Ayah preview */}
          {endText ? (
            <Text style={[styles.ayahPreview, quranFont !== "default" && { fontFamily: quranFont }]}
              numberOfLines={2}>
              {endText}
            </Text>
          ) : null}
        </View>

        {/* Repeat card */}
        <View style={[styles.repeatCard, { backgroundColor: cardBg, borderColor }]}>

          {/* Per-ayah repeat */}
          <View style={styles.repeatHeader}>
            <Ionicons name="return-down-forward" size={17} color={ACCENT} />
            <Text style={[styles.repeatLabel, { color: textColor }]}>{t("ayah_repeat", lang)}</Text>
          </View>
          <View style={styles.repeatControls}>
            <Pressable
              style={[styles.repeatArrow, { backgroundColor: isDark ? "#222" : "#f0f0f0" }]}
              onPress={() => setAyahRepeat((c) => Math.max(1, c - 1))}
            >
              <Ionicons name="remove" size={20} color={textColor} />
            </Pressable>
            <View style={[styles.repeatCountBox, { borderColor: ACCENT + "40" }]}>
              <Text style={[styles.repeatCountNum, { color: ACCENT }]}>{ayahRepeat}</Text>
              <Text style={[styles.repeatCountSub, { color: mutedColor }]}>{t("times", lang)}</Text>
            </View>
            <Pressable
              style={[styles.repeatArrow, { backgroundColor: isDark ? "#222" : "#f0f0f0" }]}
              onPress={() => setAyahRepeat((c) => Math.min(20, c + 1))}
            >
              <Ionicons name="add" size={20} color={textColor} />
            </Pressable>
          </View>
          <View style={styles.repeatQuick}>
            {REPEATS.map((n) => (
              <Pressable
                key={n}
                style={[styles.repeatQuickChip,
                  ayahRepeat === n && { backgroundColor: ACCENT, borderColor: ACCENT },
                  ayahRepeat !== n && { borderColor }
                ]}
                onPress={() => setAyahRepeat(n)}
              >
                <Text style={[styles.repeatQuickText,
                  { color: ayahRepeat === n ? "#fff" : mutedColor }
                ]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.rangeDivider, { backgroundColor: borderColor, marginVertical: 4 }]} />

          {/* Full-range repeat */}
          <View style={styles.repeatHeader}>
            <Ionicons name="repeat" size={17} color="#4285f4" />
            <Text style={[styles.repeatLabel, { color: textColor }]}>{t("range_repeat", lang)}</Text>
          </View>
          <View style={styles.repeatControls}>
            <Pressable
              style={[styles.repeatArrow, { backgroundColor: isDark ? "#222" : "#f0f0f0" }]}
              onPress={() => setRepeatCount((c) => Math.max(1, c - 1))}
            >
              <Ionicons name="remove" size={20} color={textColor} />
            </Pressable>
            <View style={[styles.repeatCountBox, { borderColor: "#4285f440" }]}>
              <Text style={[styles.repeatCountNum, { color: "#4285f4" }]}>{repeatCount}</Text>
              <Text style={[styles.repeatCountSub, { color: mutedColor }]}>{t("times", lang)}</Text>
            </View>
            <Pressable
              style={[styles.repeatArrow, { backgroundColor: isDark ? "#222" : "#f0f0f0" }]}
              onPress={() => setRepeatCount((c) => Math.min(20, c + 1))}
            >
              <Ionicons name="add" size={20} color={textColor} />
            </Pressable>
          </View>
          <View style={styles.repeatQuick}>
            {REPEATS.map((n) => (
              <Pressable
                key={n}
                style={[styles.repeatQuickChip,
                  repeatCount === n && { backgroundColor: "#4285f4", borderColor: "#4285f4" },
                  repeatCount !== n && { borderColor }
                ]}
                onPress={() => setRepeatCount(n)}
              >
                <Text style={[styles.repeatQuickText,
                  { color: repeatCount === n ? "#fff" : mutedColor }
                ]}>{n}</Text>
              </Pressable>
            ))}
          </View>

        </View>

        {/* Start button */}
        <Pressable style={[styles.startBtn, { backgroundColor: ACCENT }]} onPress={handleStart}>
          <Ionicons name="play-circle" size={26} color="#fff" />
          <Text style={styles.startBtnText}>{t("start_recitation", lang)}</Text>
        </Pressable>

      </ScrollView>

      {/* Modals */}
      <SuraModal visible={modal === "startSura"} title={t("start_sura", lang)}
        selected={startSura} onSelect={handleStartSuraChange} onClose={() => setModal(null)} />
      <SuraModal visible={modal === "endSura"} title={t("end_sura", lang)}
        selected={endSura} onSelect={handleEndSuraChange} onClose={() => setModal(null)} />
      <AyaModal visible={modal === "startAya"} title={t("start_aya", lang)}
        selected={startAya} onSelect={setStartAya} ayahs={startAyahs} onClose={() => setModal(null)} />
      <AyaModal visible={modal === "endAya"} title={t("end_aya", lang)}
        selected={endAya} onSelect={setEndAya} ayahs={endAyahs} onClose={() => setModal(null)} />
      <ReciterPickerModal
        visible={modal === "reciter"}
        lang={lang}
        isDark={isDark}
        reciters={madinaReciters}
        selectedId={selectedMadinaReciter}
        onSelect={setSelectedMadinaReciter}
        onClose={() => setModal(null)}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, gap: 14, paddingBottom: 48 },

  // Hero
  hero: {
    borderRadius: 18, padding: 20, alignItems: "center", gap: 8,
  },
  heroIconRow: { flexDirection: "row", alignItems: "center", gap: 0, marginBottom: 4 },
  heroIconBubble: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  heroDivider: { width: 24, height: 2, marginHorizontal: 4 },
  heroTitle: { fontSize: 20, fontWeight: "800", letterSpacing: 0.5 },
  heroSub: { fontSize: 13, textAlign: "center" },

  // Range card
  rangeCard: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, gap: 10,
  },
  rangeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rangeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    minWidth: 64,
  },
  rangeBadgeText: { fontSize: 12, fontWeight: "700" },
  rangeSelectors: { flex: 1, flexDirection: "row", gap: 8 },
  selectorBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
  },
  selectorBtnSmall: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    minWidth: 56,
  },
  selectorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  rangeDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  ayahPreview: {
    fontSize: 16, lineHeight: 28, textAlign: "center",
    writingDirection: "rtl", color: "#555",
    marginTop: 2, paddingHorizontal: 4,
  },

  // Repeat
  repeatCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  repeatHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  repeatLabel: { fontSize: 15, fontWeight: "700" },
  repeatControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  repeatArrow: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  repeatCountBox: {
    alignItems: "center", borderWidth: 2, borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 8,
  },
  repeatCountNum: { fontSize: 36, fontWeight: "800", lineHeight: 44 },
  repeatCountSub: { fontSize: 12, fontWeight: "500" },
  repeatQuick: { flexDirection: "row", justifyContent: "center", gap: 8 },
  repeatQuickChip: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  repeatQuickText: { fontSize: 13, fontWeight: "600" },

  // Warsh notice
  warshNotice: {
    backgroundColor: "#fef3c7",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f59e0b55",
    gap: 10,
  },
  warshNoticeTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  warshNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#92400e",
    textAlign: "right",
    writingDirection: "rtl",
  },
  warshReciterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fde68a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  warshReciterName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#78350f",
    textAlign: "right",
  },

  // Start button
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, borderRadius: 16, gap: 10,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});

// ── Modal styles ─────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: "75%", paddingBottom: 24,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "700", textAlign: "center", color: "#222", paddingVertical: 10 },
  filterRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 14, marginBottom: 8,
    backgroundColor: "#f5f5f5", borderRadius: 10, paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  filterInput: { flex: 1, paddingVertical: 9, fontSize: 15, color: "#333" },
  item: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 13, paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f0f0f0",
  },
  itemActive: { backgroundColor: ACCENT_LIGHT },
  itemNum: { width: 28, fontSize: 12, color: "#aaa", fontWeight: "600", textAlign: "center" },
  itemNumActive: { color: ACCENT },
  itemText: { flex: 1, fontSize: 16, color: "#333", textAlign: "right" },
  itemTextActive: { fontWeight: "700", color: ACCENT },
  ayaGrid: { paddingHorizontal: 12, paddingBottom: 16, gap: 8 },
  ayaChip: {
    flex: 1, margin: 3, aspectRatio: 1, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  ayaChipActive: { backgroundColor: ACCENT },
  ayaChipText: { fontSize: 14, color: "#444", fontWeight: "600" },
  ayaChipTextActive: { color: "#fff" },
});
