import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, type DhikrItem } from "../store/useAppStore";
import { t } from "../i18n";
import { getAyahText } from "../utils/ayahText";
import { allSuwar, getAyahCount } from "../utils/quranHelpers";

const ACCENT = "#1a5c2e";
const BLUE = "#336699";
const SCREEN_HEIGHT = Dimensions.get("window").height;
const RING_SIZE = 220;
const RING_STROKE = 8;
const SEGMENT_COUNT = 72;
const INFINITY_TARGET = 0; // 0 means infinite

let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch (_) {}

// ────────────────────────────────────────────────────────────────────────────
// Progress ring (segment-based, no SVG dependency)
// ────────────────────────────────────────────────────────────────────────────
function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const segmentAngle = 360 / SEGMENT_COUNT;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);

  return (
    <View style={{ width: size, height: size, position: "absolute" }}>
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
        const angleDeg = i * segmentAngle - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = center + radius * Math.cos(angleRad) - strokeWidth / 2;
        const y = center + radius * Math.sin(angleRad) - strokeWidth / 2;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: strokeWidth,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: i < filledSegments ? color : trackColor,
            }}
          />
        );
      })}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Target stepper (- number +) with presets + infinity
// ────────────────────────────────────────────────────────────────────────────
const TARGET_PRESETS = [33, 99, 100, 200, 500, 1000];

function TargetStepper({
  value,
  onChange,
  textColor,
  borderColor,
  mutedColor,
  lang,
}: {
  value: number;
  onChange: (v: number) => void;
  textColor: string;
  borderColor: string;
  mutedColor: string;
  lang: string;
}) {
  const isInfinite = value === INFINITY_TARGET;
  const dec = () => {
    if (isInfinite) onChange(1000);
    else onChange(Math.max(1, value - 1));
  };
  const inc = () => {
    if (isInfinite) return;
    onChange(value + 1);
  };

  return (
    <View style={{ gap: 8 }}>
      {/* Stepper row */}
      <View style={styles.stepperRow}>
        <Pressable
          onPress={dec}
          style={[styles.stepperBtn, { borderColor }]}
          hitSlop={6}
        >
          <Ionicons name="remove" size={20} color={ACCENT} />
        </Pressable>
        <TextInput
          style={[styles.stepperInput, { color: textColor, borderColor }]}
          value={isInfinite ? "∞" : String(value)}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n > 0) onChange(n);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!isInfinite}
        />
        <Pressable
          onPress={inc}
          style={[styles.stepperBtn, { borderColor }]}
          hitSlop={6}
        >
          <Ionicons name="add" size={20} color={ACCENT} />
        </Pressable>
      </View>
      {/* Quick presets + infinity */}
      <View style={styles.presetsRow}>
        {TARGET_PRESETS.map((p) => (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={[
              styles.presetPill,
              {
                borderColor: value === p ? ACCENT : borderColor,
                backgroundColor: value === p ? ACCENT + "18" : "transparent",
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                color: value === p ? ACCENT : mutedColor,
                fontWeight: value === p ? "700" : "400",
              }}
            >
              {p}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onChange(INFINITY_TARGET)}
          style={[
            styles.presetPill,
            {
              borderColor: isInfinite ? ACCENT : borderColor,
              backgroundColor: isInfinite ? ACCENT + "18" : "transparent",
            },
          ]}
        >
          <Text
            style={{
              fontSize: 14,
              color: isInfinite ? ACCENT : mutedColor,
              fontWeight: isInfinite ? "700" : "400",
            }}
          >
            ∞
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sura picker modal (full bottom sheet like PrayerMode)
// ────────────────────────────────────────────────────────────────────────────
function SuraPickerModal({
  visible,
  isDark,
  textColor,
  mutedColor,
  borderColor,
  lang,
  onSelect,
  onClose,
}: {
  visible: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  lang: string;
  onSelect: (sura: number, aya: number) => void;
  onClose: () => void;
}) {
  const [selectedSura, setSelectedSura] = useState<number | null>(null);
  const [suraFilter, setSuraFilter] = useState("");
  const suwar = useMemo(() => allSuwar(), []);
  const ayaCount = selectedSura ? getAyahCount(selectedSura) : 0;
  const inputBg = isDark ? "#2a2a3e" : "#f5f5f5";
  const sheetBg = isDark ? "#1a1a2e" : "#fff";

  // Reset on open
  React.useEffect(() => {
    if (visible) {
      setSelectedSura(null);
      setSuraFilter("");
    }
  }, [visible]);

  const handleClose = () => {
    setSuraFilter("");
    setSelectedSura(null);
    onClose();
  };

  if (selectedSura !== null) {
    // Show aya number grid
    const ayaNumbers = Array.from({ length: ayaCount }, (_, i) => i + 1);
    return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
        <Pressable style={suraPickerStyles.overlay} onPress={handleClose}>
          <Pressable style={[suraPickerStyles.sheet, { backgroundColor: sheetBg }]}>
            <View style={[suraPickerStyles.header, { borderBottomColor: borderColor }]}>
              <Pressable onPress={() => setSelectedSura(null)} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="arrow-back" size={22} color={ACCENT} />
              </Pressable>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: "700", flex: 1, textAlign: "right", writingDirection: "rtl" }}>
                {suwar.find((s) => s.value === selectedSura)?.label}
              </Text>
              <Text style={{ color: mutedColor, fontSize: 13 }}>
                {t("aya_s", lang as any)}
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 6 }}
              keyboardShouldPersistTaps="handled"
            >
              {ayaNumbers.map((num) => (
                <Pressable
                  key={num}
                  style={{
                    width: 50,
                    height: 40,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "#333" : "#e8e8e8",
                  }}
                  onPress={() => {
                    onSelect(selectedSura, num);
                    handleClose();
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: "600" }}>{num}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <Pressable style={suraPickerStyles.overlay} onPress={handleClose}>
        <Pressable style={[suraPickerStyles.sheet, { backgroundColor: sheetBg }]}>
          {/* Filter input */}
          <View style={[suraPickerStyles.header, { borderBottomColor: borderColor }]}>
            <TextInput
              style={[suraPickerStyles.filterInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder="ابحث عن سورة..."
              placeholderTextColor={mutedColor}
              value={suraFilter}
              onChangeText={setSuraFilter}
              autoFocus
              textAlign="right"
            />
            <Pressable onPress={handleClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={mutedColor} />
            </Pressable>
          </View>
          {/* Sura list */}
          <FlatList
            data={suwar.filter((s) => !suraFilter || s.label.includes(suraFilter))}
            keyExtractor={(s) => String(s.value)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: s }) => (
              <Pressable
                style={suraPickerStyles.item}
                onPress={() => setSelectedSura(s.value)}
              >
                <Text style={[suraPickerStyles.itemText, { color: textColor }]}>
                  {s.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={mutedColor} />
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const suraPickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  filterInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    writingDirection: "rtl",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  itemText: {
    fontSize: 16,
    textAlign: "right",
    flex: 1,
    writingDirection: "rtl",
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Add / Edit modal
// ────────────────────────────────────────────────────────────────────────────
function AddEditModal({
  visible,
  initial,
  quira,
  isDark,
  textColor,
  mutedColor,
  borderColor,
  cardBg,
  lang,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: Partial<DhikrItem> | null;
  quira: "madina" | "warsh";
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  cardBg: string;
  lang: string;
  onSave: (item: Omit<DhikrItem, "id">) => void;
  onClose: () => void;
}) {
  const [arabic, setArabic] = useState(initial?.arabic ?? "");
  const [target, setTarget] = useState(initial?.target ?? 33);
  const [ayahRef, setAyahRef] = useState<{ sura: number; aya: number } | undefined>(
    initial?.ayahRef
  );
  const [loadingAyah, setLoadingAyah] = useState(false);
  const [showQuranPicker, setShowQuranPicker] = useState(false);

  // Reset when modal opens with new initial
  React.useEffect(() => {
    if (visible) {
      setArabic(initial?.arabic ?? "");
      setTarget(initial?.target ?? 33);
      setAyahRef(initial?.ayahRef);
      setShowQuranPicker(false);
    }
  }, [visible, initial?.arabic, initial?.target, initial?.ayahRef]);

  const handleQuranSelect = async (sura: number, aya: number) => {
    setLoadingAyah(true);
    try {
      const text = await getAyahText(sura, aya, quira);
      if (text) {
        setArabic(text);
        setAyahRef({ sura, aya });
      }
    } catch (_) {}
    setLoadingAyah(false);
    setShowQuranPicker(false);
  };

  const handleSave = () => {
    if (!arabic.trim()) return;
    onSave({
      arabic: arabic.trim(),
      target,
      ayahRef,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: cardBg },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: borderColor }]} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Arabic text */}
              <Text style={[styles.modalLabel, { color: mutedColor }]}>
                {t("dhikr_arabic", lang as any)}
              </Text>
              <TextInput
                style={[
                  styles.arabicInput,
                  { color: textColor, borderColor },
                ]}
                value={arabic}
                onChangeText={setArabic}
                placeholder="..."
                placeholderTextColor={mutedColor}
                multiline
                textAlign="right"
              />

              {/* Target */}
              <Text style={[styles.modalLabel, { color: mutedColor }]}>
                {t("target", lang as any)}
              </Text>
              <TargetStepper
                value={target}
                onChange={setTarget}
                textColor={textColor}
                borderColor={borderColor}
                mutedColor={mutedColor}
                lang={lang}
              />

              {/* From Quran */}
              <Text style={[styles.modalLabel, { color: mutedColor, marginTop: 16 }]}>
                {t("from_quran", lang as any)}
              </Text>

              {loadingAyah ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <Ionicons name="hourglass-outline" size={24} color={mutedColor} />
                </View>
              ) : (
                <Pressable
                  style={[styles.loadBtn, { backgroundColor: BLUE, alignSelf: "flex-start" }]}
                  onPress={() => setShowQuranPicker(true)}
                >
                  <Ionicons name="book-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                    {t("load_ayah", lang as any)}
                  </Text>
                </Pressable>
              )}

              <SuraPickerModal
                visible={showQuranPicker}
                isDark={isDark}
                textColor={textColor}
                mutedColor={mutedColor}
                borderColor={borderColor}
                lang={lang}
                onSelect={handleQuranSelect}
                onClose={() => setShowQuranPicker(false)}
              />
            </ScrollView>

            {/* Save / Cancel */}
            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, { borderColor, borderWidth: 1 }]}
                onPress={onClose}
              >
                <Text style={{ color: mutedColor, fontWeight: "600" }}>
                  {t("cancel", lang as any)}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: arabic.trim() ? ACCENT : borderColor,
                  },
                ]}
                onPress={handleSave}
                disabled={!arabic.trim()}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {t("save_note", lang as any)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────────────────────────────────
interface TasbihScreenProps {
  onGoBack: () => void;
}

export default function TasbihScreen({ onGoBack }: TasbihScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const quira = useAppStore((s) => s.quira);
  const dhikrList = useAppStore((s) => s.dhikrList);
  const setDhikrList = useAppStore((s) => s.setDhikrList);
  const vibrateEnabled = useAppStore((s) => s.vibrateEnabled);
  const setVibrateEnabled = useAppStore((s) => s.setVibrateEnabled);

  const isRTL = lang === "ar" || lang === "he";
  const isDark = !!theme.night;
  const bgColor = theme.backgroundColor;
  const cardBg = isDark ? "#1a1a2e" : theme.backgroundColor;
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = theme.borderColor;

  // Per-dhikr counts (not persisted — resets on screen leave)
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalSession, setTotalSession] = useState(0);
  const [selectedId, setSelectedId] = useState<string>(
    () => dhikrList[0]?.id ?? ""
  );
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DhikrItem | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const selectedDhikr = dhikrList.find((d) => d.id === selectedId) ?? dhikrList[0];
  const currentCount = selectedDhikr ? (counts[selectedDhikr.id] ?? 0) : 0;
  const isInfinite = selectedDhikr?.target === INFINITY_TARGET;
  const progress = selectedDhikr
    ? isInfinite
      ? 0
      : Math.min(currentCount / selectedDhikr.target, 1)
    : 0;
  const isCompleted = selectedDhikr
    ? !isInfinite && currentCount >= selectedDhikr.target
    : false;

  const triggerHaptic = useCallback(
    (style: "light" | "medium" = "light") => {
      if (!vibrateEnabled) return;
      try {
        if (Haptics?.impactAsync) {
          const feedbackStyle =
            style === "medium"
              ? Haptics.ImpactFeedbackStyle?.Medium ?? "medium"
              : Haptics.ImpactFeedbackStyle?.Light ?? "light";
          Haptics.impactAsync(feedbackStyle);
        }
      } catch (_) {}
    },
    [vibrateEnabled]
  );

  const handleTap = useCallback(() => {
    if (!selectedDhikr) return;
    triggerHaptic("light");
    pulseAnim.setValue(0.93);
    Animated.spring(pulseAnim, {
      toValue: 1,
      friction: 3,
      tension: 120,
      useNativeDriver: true,
    }).start();
    const newCount = (counts[selectedDhikr.id] ?? 0) + 1;
    setCounts((prev) => ({
      ...prev,
      [selectedDhikr.id]: newCount,
    }));
    setTotalSession((prev) => prev + 1);

    // Auto-advance to next dhikr when target reached (not for infinite)
    if (
      !isInfinite &&
      newCount >= selectedDhikr.target &&
      dhikrList.length > 1
    ) {
      const currentIdx = dhikrList.findIndex((d) => d.id === selectedDhikr.id);
      const nextIdx = (currentIdx + 1) % dhikrList.length;
      setTimeout(() => setSelectedId(dhikrList[nextIdx].id), 600);
    }
  }, [selectedDhikr, pulseAnim, triggerHaptic, counts, dhikrList, isInfinite]);

  const handleReset = useCallback(() => {
    if (!selectedDhikr) return;
    setCounts((prev) => ({ ...prev, [selectedDhikr.id]: 0 }));
  }, [selectedDhikr]);

  const handleSelectDhikr = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: DhikrItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (item: DhikrItem) => {
    Alert.alert(
      t("delete_dhikr", lang),
      t("delete_dhikr_confirm", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("delete_dhikr", lang),
          style: "destructive",
          onPress: () => {
            const next = dhikrList.filter((d) => d.id !== item.id);
            setDhikrList(next);
            if (selectedId === item.id && next.length > 0) {
              setSelectedId(next[0].id);
            }
          },
        },
      ]
    );
  };

  const handleSaveModal = (data: Omit<DhikrItem, "id">) => {
    if (editingItem) {
      // Edit existing
      setDhikrList(
        dhikrList.map((d) =>
          d.id === editingItem.id ? { ...d, ...data } : d
        )
      );
    } else {
      // Add new
      const newItem: DhikrItem = {
        id: `custom_${Date.now()}`,
        ...data,
      };
      setDhikrList([...dhikrList, newItem]);
      setSelectedId(newItem.id);
    }
    setShowModal(false);
  };

  const completedColor = "#d4af37";
  const ringTrackColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const ringFillColor = isCompleted ? completedColor : ACCENT;
  const accentFaded = isDark
    ? "rgba(26,92,46,0.25)"
    : "rgba(26,92,46,0.08)";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.headerBtn}>
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={textColor}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("tasbih_title", lang)}
        </Text>
        {/* Vibrate toggle */}
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            const newVal = !vibrateEnabled;
            setVibrateEnabled(newVal);
            // Always vibrate on enable to confirm vibration works
            if (newVal) {
              try {
                if (Haptics?.notificationAsync) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType?.Success ?? "success"
                  );
                } else if (Haptics?.impactAsync) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Heavy ?? "heavy");
                }
              } catch (_) {}
            }
          }}
          hitSlop={10}
        >
          <Ionicons
            name={vibrateEnabled ? "phone-portrait-outline" : "phone-portrait"}
            size={22}
            color={vibrateEnabled ? ACCENT : mutedColor}
          />
        </Pressable>
      </View>

      {/* Dhikr chip list */}
      <View style={styles.chipSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.chipScroll,
            isRTL && { flexDirection: "row-reverse" },
          ]}
        >
          {dhikrList.map((dhikr) => {
            const isSelected = dhikr.id === selectedId;
            const cnt = counts[dhikr.id] ?? 0;
            return (
              <Pressable
                key={dhikr.id}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? ACCENT : borderColor,
                    backgroundColor: isSelected
                      ? isDark
                        ? "#1a3a2e"
                        : "#e8f5e9"
                      : cardBg,
                  },
                ]}
                onPress={() => handleSelectDhikr(dhikr.id)}
              >
                <Text
                  style={[
                    styles.chipArabic,
                    { color: isSelected ? ACCENT : textColor },
                  ]}
                  numberOfLines={1}
                >
                  {dhikr.arabic}
                </Text>
                <Text
                  style={[
                    styles.chipTarget,
                    { color: isSelected ? ACCENT : mutedColor },
                  ]}
                >
                  {cnt > 0 ? `${cnt}/` : ""}
                  {dhikr.target === INFINITY_TARGET ? "∞" : dhikr.target}
                </Text>
              </Pressable>
            );
          })}

          {/* Add button */}
          <Pressable
            style={[
              styles.chip,
              styles.addChip,
              { borderColor: BLUE, backgroundColor: isDark ? "#1a1a3a" : "#eef3f9" },
            ]}
            onPress={handleOpenAdd}
          >
            <Ionicons name="add-circle-outline" size={20} color={BLUE} />
          </Pressable>
        </ScrollView>
      </View>

      {/* Main counter */}
      <View style={styles.mainContent}>
        {/* Arabic text with edit/delete inline */}
        {selectedDhikr && (
          <View style={styles.dhikrTextRow}>
            <ScrollView
              style={styles.dhikrTextScroll}
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.dhikrArabic, { color: textColor }]}>
                {selectedDhikr.arabic}
              </Text>
            </ScrollView>
            <View style={styles.dhikrActions}>
              <Pressable
                style={styles.dhikrActionBtn}
                onPress={() => handleOpenEdit(selectedDhikr)}
                hitSlop={6}
              >
                <Ionicons name="pencil-outline" size={16} color={mutedColor} />
              </Pressable>
              {dhikrList.length > 1 && (
                <Pressable
                  style={styles.dhikrActionBtn}
                  onPress={() => handleDelete(selectedDhikr)}
                  hitSlop={6}
                >
                  <Ionicons name="trash-outline" size={16} color="#c0392b" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Tap circle */}
        <Pressable onPress={handleTap} style={styles.tapArea}>
          <Animated.View
            style={[
              styles.tapCircle,
              {
                backgroundColor: isCompleted
                  ? completedColor + "15"
                  : accentFaded,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.ringContainer}>
              {!isInfinite && (
                <ProgressRing
                  progress={progress}
                  size={RING_SIZE}
                  strokeWidth={RING_STROKE}
                  color={ringFillColor}
                  trackColor={ringTrackColor}
                />
              )}
              {isInfinite && (
                <ProgressRing
                  progress={1}
                  size={RING_SIZE}
                  strokeWidth={RING_STROKE}
                  color={ACCENT + "30"}
                  trackColor={ringTrackColor}
                />
              )}
              <View style={styles.countContainer}>
                <Text
                  style={[
                    styles.countText,
                    { color: isCompleted ? completedColor : ACCENT },
                  ]}
                >
                  {currentCount}
                </Text>
                {isCompleted && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={completedColor}
                    style={{ marginTop: 4 }}
                  />
                )}
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* count / target */}
        <Text style={[styles.targetText, { color: mutedColor }]}>
          {isInfinite
            ? currentCount.toString()
            : `${currentCount} / ${selectedDhikr?.target ?? 0}`}
          {isCompleted ? `  •  ${t("completed", lang)}` : ""}
        </Text>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.controlBtn, { backgroundColor: cardBg, borderColor }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={22} color={ACCENT} />
            <Text style={[styles.controlBtnText, { color: textColor }]}>
              {t("reset", lang)}
            </Text>
          </Pressable>
          <View
            style={[styles.controlBtn, { backgroundColor: cardBg, borderColor }]}
          >
            <Ionicons name="analytics-outline" size={22} color={ACCENT} />
            <Text style={[styles.controlBtnText, { color: textColor }]}>
              {t("total_count", lang)}: {totalSession}
            </Text>
          </View>
        </View>
      </View>

      {/* Add/Edit modal */}
      <AddEditModal
        visible={showModal}
        initial={editingItem}
        quira={quira}
        isDark={isDark}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        cardBg={cardBg}
        lang={lang}
        onSave={handleSaveModal}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────
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
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Chip list
  chipSection: {
    paddingTop: 12,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 80,
    maxWidth: 160,
  },
  addChip: {
    justifyContent: "center",
    paddingHorizontal: 16,
    minWidth: 48,
  },
  chipArabic: {
    fontSize: 15,
    fontWeight: "600",
    writingDirection: "rtl",
    textAlign: "center",
  },
  chipTarget: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  // Main counter
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Dhikr text row with inline edit/delete
  dhikrTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    maxHeight: 80,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dhikrTextScroll: {
    flex: 1,
    maxHeight: 80,
  },
  dhikrArabic: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 34,
  },
  dhikrActions: {
    gap: 8,
    paddingLeft: 8,
    paddingTop: 4,
  },
  dhikrActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  tapArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  tapCircle: {
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  countContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 56,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  targetText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 28,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 400,
  },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  controlBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Add/Edit modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  arabicInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    minHeight: 70,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 16,
  },

  // Target stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },

  // From Quran
  ayahPickerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  ayahInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    textAlign: "center",
  },
  loadBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // Modal buttons
  modalBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
});
