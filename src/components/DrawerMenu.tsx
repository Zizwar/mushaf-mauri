import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore, type Quira } from "../store/useAppStore";
import { t, type LangKey } from "../i18n";
import { THEMES, type Theme } from "../theme/themes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const LANGUAGES: { key: LangKey; label: string }[] = [
  { key: "ar", label: "عربي" },
  { key: "en", label: "EN" },
  { key: "fr", label: "FR" },
  { key: "amz", label: "ⵣ" },
  { key: "he", label: "עב" },
];

const MUSHAFS: { key: Quira; labelKey: string }[] = [
  { key: "madina", labelKey: "mosshaf_hafs" },
  { key: "warsh", labelKey: "mosshaf_warsh" },
];

export default function DrawerMenu({ visible, onClose, onNavigate }: DrawerMenuProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const setLang = useAppStore((s) => s.setLang);
  const setQuira = useAppStore((s) => s.setQuira);
  const setTheme = useAppStore((s) => s.setTheme);

  const isNight = !!theme.night;
  const isRTL = lang === "ar" || lang === "amz" || lang === "he";
  const textColor = theme.color;
  const mutedColor = isNight ? "#888" : "#999";
  const bgColor = isNight ? "#111122" : "#fafafa";
  const cardBg = isNight ? "#1a1a2e" : "#fff";
  const borderColor = isNight ? "#2a2a3e" : "#eee";
  const accentColor = "#1a5c2e";

  const handleMenuPress = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer Panel - positioned on the right for RTL */}
        <View style={[styles.drawer, { width: DRAWER_WIDTH, backgroundColor: bgColor }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cover Image */}
            <View style={styles.coverWrapper}>
              <Image
                source={require("../../assets/cover3.png")}
                style={styles.coverImage}
                resizeMode="cover"
              />
              {/* Close button on cover */}
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              {/* 1. Mushaf Type */}
              <View style={[styles.menuBlock, { backgroundColor: cardBg, borderColor }]}>
                <Pressable
                  style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                  onPress={() => handleMenuPress("mushaf_type")}
                >
                  <Ionicons name="book-outline" size={22} color={accentColor} />
                  <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                    {t("mosshaf_type", lang)}
                  </Text>
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
                </Pressable>
                <View style={[styles.inlineRow, { borderTopColor: borderColor }]}>
                  {MUSHAFS.map((m) => (
                    <Pressable
                      key={m.key}
                      style={[
                        styles.inlineChip,
                        {
                          borderColor: quira === m.key ? accentColor : borderColor,
                          backgroundColor:
                            quira === m.key
                              ? isNight
                                ? "#1a3a2e"
                                : "#e8f5e9"
                              : "transparent",
                        },
                      ]}
                      onPress={() => setQuira(m.key)}
                    >
                      {quira === m.key && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={accentColor}
                          style={styles.checkIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.inlineChipText,
                          {
                            color: quira === m.key ? accentColor : textColor,
                            fontWeight: quira === m.key ? "700" : "400",
                          },
                        ]}
                      >
                        {t(m.labelKey, lang)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 2. Bookmarks */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("bookmarks")}
              >
                <Ionicons name="bookmark-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("favs", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* 3. Tafsir */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("tafsir")}
              >
                <Ionicons name="document-text-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("tafsir", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* 4. Recitation */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("recitation")}
              >
                <Ionicons name="headset-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("telawa", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* Recordings */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("recordings")}
              >
                <Ionicons name="mic-circle-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("my_recordings", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* Khatma */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("khatma")}
              >
                <Ionicons name="calendar-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("khatma", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* Tasbih */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("tasbih")}
              >
                <Ionicons name="radio-button-on-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("tasbih", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* Auto-scroll / Prayer Mode */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("autoscroll")}
              >
                <Ionicons name="swap-vertical-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("prayer_mode", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* 5. Theme */}
              <View style={[styles.menuBlock, { backgroundColor: cardBg, borderColor }]}>
                <Pressable
                  style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                  onPress={() => handleMenuPress("theme")}
                >
                  <Ionicons name="color-palette-outline" size={22} color={accentColor} />
                  <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                    {t("theme", lang)}
                  </Text>
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
                </Pressable>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.themeRow}
                  style={[styles.themeScrollView, { borderTopColor: borderColor }]}
                >
                  {THEMES.map((th, idx) => (
                    <Pressable
                      key={idx}
                      style={[
                        styles.themeCircle,
                        {
                          backgroundColor: th.backgroundColor,
                          borderColor:
                            theme.name === th.name ? accentColor : th.night ? "#555" : "#ccc",
                          borderWidth: theme.name === th.name ? 3 : 1.5,
                        },
                      ]}
                      onPress={() => setTheme(th)}
                    >
                      {th.night && (
                        <Ionicons name="moon" size={14} color="#aaa" />
                      )}
                      {theme.name === th.name && !th.night && (
                        <Ionicons name="checkmark" size={16} color={accentColor} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 6. Language */}
              <View style={[styles.menuBlock, { backgroundColor: cardBg, borderColor }]}>
                <Pressable
                  style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                  onPress={() => handleMenuPress("language")}
                >
                  <Ionicons name="language-outline" size={22} color={accentColor} />
                  <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                    {t("choose_lang", lang)}
                  </Text>
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
                </Pressable>
                <View style={[styles.langRow, { borderTopColor: borderColor }]}>
                  {LANGUAGES.map((l) => (
                    <Pressable
                      key={l.key}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor:
                            lang === l.key
                              ? accentColor
                              : isNight
                              ? "#2a2a3e"
                              : "#f0f0f0",
                          borderColor:
                            lang === l.key ? accentColor : "transparent",
                        },
                      ]}
                      onPress={() => setLang(l.key)}
                    >
                      <Text
                        style={[
                          styles.langChipText,
                          {
                            color:
                              lang === l.key
                                ? "#fff"
                                : isNight
                                ? "#bbb"
                                : "#555",
                            fontWeight: lang === l.key ? "700" : "500",
                          },
                        ]}
                      >
                        {l.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 7. Settings */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("settings")}
              >
                <Ionicons name="settings-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("settings", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>

              {/* 8. About */}
              <Pressable
                style={[styles.menuBlock, styles.menuItem, isRTL && styles.menuItemRTL, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleMenuPress("about")}
              >
                <Ionicons name="information-circle-outline" size={22} color={accentColor} />
                <Text style={[styles.menuLabel, { color: textColor }, isRTL && styles.menuLabelRTL]}>
                  {t("about", lang)}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={mutedColor} />
              </Pressable>
            </View>

            {/* Night mode indicator */}
            <View style={styles.footerSection}>
              <Ionicons
                name={isNight ? "moon" : "sunny-outline"}
                size={16}
                color={mutedColor}
              />
              <Text style={[styles.footerText, { color: mutedColor }]}>
                {t(isNight ? "vision_night" : "vision_normal", lang)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    height: SCREEN_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Cover
  coverWrapper: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.28,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Menu
  menuSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 8,
  },
  menuBlock: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "left",
  },
  menuItemRTL: {
    flexDirection: "row-reverse",
  },
  menuLabelRTL: {
    textAlign: "right",
  },
  // Inline Mushaf selection
  inlineRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inlineChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 4,
  },
  inlineChipText: {
    fontSize: 13,
  },
  checkIcon: {
    marginEnd: 2,
  },
  // Theme circles
  themeScrollView: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  themeRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    gap: 10,
  },
  themeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Language chips
  langRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  langChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  langChipText: {
    fontSize: 13,
  },
  // Footer
  footerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 20,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 12,
  },
});
