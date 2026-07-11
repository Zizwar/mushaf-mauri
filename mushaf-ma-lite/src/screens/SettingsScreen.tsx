import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { t, type LangKey } from "../i18n";
import {
  resolveQuranFont,
  useAppStore,
  useTheme,
  type FontFamilyKey,
  type Riwaya,
} from "../store/useAppStore";
import { ACCENT, THEMES } from "../theme/themes";
import { getReciterName, RECITERS } from "../data/reciters";
import { getAyahText } from "../utils/quranText";
import { checkServer } from "../utils/serverApi";
import { ScreenHeader } from "../components/ScreenHeader";

interface Props {
  onGoBack: () => void;
}

const LANGS: { key: LangKey; label: string }[] = [
  { key: "ar", label: "العربية" },
  { key: "en", label: "English" },
  { key: "fr", label: "Français" },
];

const FONTS: { key: FontFamilyKey; labelKey: string }[] = [
  { key: "auto", labelKey: "font_auto" },
  { key: "Maghribi", labelKey: "font_maghribi" },
  { key: "hafs", labelKey: "font_hafs" },
  { key: "uthmanic", labelKey: "font_uthmanic" },
];

export function SettingsScreen({ onGoBack }: Props) {
  const theme = useTheme();
  const s = useAppStore();
  const lang = s.lang;
  const isRTL = lang === "ar";

  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [serverInput, setServerInput] = useState(s.serverUrl);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "fail">(
    "idle"
  );

  const handleTest = async () => {
    const url = serverInput.trim();
    s.setServerUrl(url);
    if (!url) return;
    setTestState("testing");
    const ok = await checkServer(url);
    setTestState(ok ? "ok" : "fail");
  };

  const align = { alignItems: isRTL ? ("flex-end" as const) : ("flex-start" as const) };
  const rowDir = { flexDirection: isRTL ? ("row-reverse" as const) : ("row" as const) };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title={t("settings_title", lang)} onBack={onGoBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Language */}
        <Section title={t("language", lang)} theme={theme} align={align}>
          <View style={[styles.chipRow, rowDir]}>
            {LANGS.map((l) => (
              <Chip
                key={l.key}
                label={l.label}
                active={lang === l.key}
                theme={theme}
                onPress={() => s.setLang(l.key)}
              />
            ))}
          </View>
        </Section>

        {/* Theme */}
        <Section title={t("theme", lang)} theme={theme} align={align}>
          <View style={[styles.chipRow, rowDir]}>
            {THEMES.map((th) => (
              <TouchableOpacity
                key={th.name}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: th.backgroundColor,
                    borderColor:
                      s.themeName === th.name ? ACCENT : theme.borderColor,
                    borderWidth: s.themeName === th.name ? 2.5 : 1,
                  },
                ]}
                onPress={() => s.setThemeName(th.name)}
              >
                <Text style={{ color: th.color, fontSize: 11 }}>
                  {t(`theme_${th.name}`, lang)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Riwaya */}
        <Section title={t("default_riwaya", lang)} theme={theme} align={align}>
          <View style={[styles.chipRow, rowDir]}>
            {(["warsh", "hafs"] as Riwaya[]).map((r) => (
              <Chip
                key={r}
                label={t(r, lang)}
                active={s.riwaya === r}
                theme={theme}
                onPress={() => s.setRiwaya(r)}
              />
            ))}
          </View>
        </Section>

        {/* Quran font */}
        <Section title={t("quran_font", lang)} theme={theme} align={align}>
          <View style={[styles.chipRow, rowDir]}>
            {FONTS.map((f) => (
              <Chip
                key={f.key}
                label={t(f.labelKey, lang)}
                active={s.textFontFamily === f.key}
                theme={theme}
                onPress={() => s.setTextFontFamily(f.key)}
              />
            ))}
          </View>
          {/* Font size + preview */}
          <View style={[styles.fontSizeRow, rowDir]}>
            <Text style={{ color: theme.subColor, fontSize: 13 }}>
              {t("font_size", lang)}
            </Text>
            <TouchableOpacity
              onPress={() => s.setTextFontSize(Math.max(18, s.textFontSize - 2))}
            >
              <Ionicons name="remove-circle-outline" size={26} color={ACCENT} />
            </TouchableOpacity>
            <Text style={{ color: theme.color, fontSize: 15, fontWeight: "700" }}>
              {s.textFontSize}
            </Text>
            <TouchableOpacity
              onPress={() => s.setTextFontSize(Math.min(40, s.textFontSize + 2))}
            >
              <Ionicons name="add-circle-outline" size={26} color={ACCENT} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.previewBox,
              { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor },
            ]}
          >
            <Text
              style={{
                color: theme.color,
                fontFamily: resolveQuranFont(s.textFontFamily, s.riwaya),
                fontSize: s.textFontSize,
                lineHeight: s.textFontSize * 1.9,
                textAlign: "center",
                writingDirection: "rtl",
              }}
            >
              {getAyahText(1, 1, s.riwaya)}
            </Text>
          </View>
        </Section>

        {/* Compare reciter */}
        <Section title={t("compare_reciter", lang)} theme={theme} align={align}>
          <TouchableOpacity
            style={[
              styles.selectRow,
              { borderColor: theme.borderColor, ...rowDir },
            ]}
            onPress={() => setReciterPickerOpen(true)}
          >
            <Ionicons name="headset" size={18} color="#336699" />
            <Text style={{ color: theme.color, fontSize: 14, flex: 1, textAlign: isRTL ? "right" : "left" }}>
              {getReciterName(s.compareReciterId, lang)}
            </Text>
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={16}
              color={theme.subColor}
            />
          </TouchableOpacity>
        </Section>

        {/* Reciter name */}
        <Section
          title={t("uploader_name_setting", lang)}
          hint={t("uploader_name_hint", lang)}
          theme={theme}
          align={align}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: theme.color,
                borderColor: theme.borderColor,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            value={s.uploaderName}
            onChangeText={s.setUploaderName}
            placeholder={t("your_name_placeholder", lang)}
            placeholderTextColor={theme.subColor}
            maxLength={80}
          />
        </Section>

        {/* Server URL */}
        <Section
          title={t("server_url", lang)}
          hint={t("server_url_hint", lang)}
          theme={theme}
          align={align}
        >
          <TextInput
            style={[
              styles.input,
              { color: theme.color, borderColor: theme.borderColor, textAlign: "left" },
            ]}
            value={serverInput}
            onChangeText={(v) => {
              setServerInput(v);
              setTestState("idle");
            }}
            onBlur={() => s.setServerUrl(serverInput.trim())}
            placeholder="http://192.168.1.10:4000"
            placeholderTextColor={theme.subColor}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={[styles.testRow, rowDir]}>
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: ACCENT }]}
              onPress={handleTest}
            >
              <Ionicons name="pulse" size={14} color="#fff" />
              <Text style={styles.testBtnText}>
                {testState === "testing"
                  ? t("loading", lang)
                  : t("test_connection", lang)}
              </Text>
            </TouchableOpacity>
            {testState === "ok" ? (
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "700" }}>
                {t("connection_ok", lang)}
              </Text>
            ) : null}
            {testState === "fail" ? (
              <Text style={{ color: "#d32f2f", fontSize: 13, fontWeight: "700" }}>
                {t("connection_failed", lang)}
              </Text>
            ) : null}
          </View>
        </Section>

        {/* About */}
        <Section title={t("about", lang)} theme={theme} align={align}>
          <Text
            style={{
              color: theme.subColor,
              fontSize: 13,
              lineHeight: 21,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {t("about_text", lang)}
          </Text>
          <Text style={{ color: theme.subColor, fontSize: 12, marginTop: 6 }}>
            {t("version", lang)} 1.0.0
          </Text>
        </Section>
      </ScrollView>

      {/* Reciter picker */}
      <Modal
        visible={reciterPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReciterPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <View
            style={[
              styles.pickerCard,
              { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
            ]}
          >
            <View style={[styles.pickerHeader, rowDir]}>
              <Text style={{ color: theme.color, fontSize: 16, fontWeight: "800" }}>
                {t("choose_reciter", lang)}
              </Text>
              <TouchableOpacity onPress={() => setReciterPickerOpen(false)}>
                <Ionicons name="close" size={22} color={theme.subColor} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {RECITERS.map((r) => {
                const active = s.compareReciterId === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.pickerRow,
                      { borderBottomColor: theme.borderColor, ...rowDir },
                    ]}
                    onPress={() => {
                      s.setCompareReciterId(r.id);
                      setReciterPickerOpen(false);
                    }}
                  >
                    <Ionicons
                      name={active ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={active ? ACCENT : theme.subColor}
                    />
                    <Text style={{ color: theme.color, fontSize: 15 }}>
                      {lang === "ar" ? r.nameAr : r.nameLat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  title,
  hint,
  theme,
  align,
  children,
}: {
  title: string;
  hint?: string;
  theme: { cardColor: string; borderColor: string; color: string; subColor: string };
  align: { alignItems: "flex-start" | "flex-end" };
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
      ]}
    >
      <View style={align}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>{title}</Text>
        {hint ? (
          <Text style={[styles.sectionHint, { color: theme.subColor }]}>{hint}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  theme,
  onPress,
}: {
  label: string;
  active: boolean;
  theme: { cardColor: string; borderColor: string; color: string };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? ACCENT : "transparent",
          borderColor: active ? ACCENT : theme.borderColor,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={{
          color: active ? "#fff" : theme.color,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  sectionHint: { fontSize: 11, marginTop: 2 },
  chipRow: { flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  swatch: {
    width: 74,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeRow: { alignItems: "center", gap: 12, marginTop: 4 },
  previewBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  selectRow: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  testRow: { alignItems: "center", gap: 10 },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  testBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
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
  pickerRow: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
