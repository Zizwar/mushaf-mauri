import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { t, type LangKey } from "../i18n";
import { THEMES } from "../theme/themes";
import type { Quira } from "../store/useAppStore";
import type { Theme } from "../theme/themes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = "#1a5c2e";
const ACCENT_LIGHT = "#e8f5e9";
const GOLD = "#c9a96e";
const TOTAL_STEPS = 4; // welcome, language, mushaf, theme

interface HomeScreenProps {
  onOpenMushaf: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HomeScreen({ onOpenMushaf }: HomeScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const quira = useAppStore((s) => s.quira);
  const theme = useAppStore((s) => s.theme);
  const setLang = useAppStore((s) => s.setLang);
  const setQuira = useAppStore((s) => s.setQuira);
  const setTheme = useAppStore((s) => s.setTheme);
  const setHasCompletedSetup = useAppStore((s) => s.setHasCompletedSetup);

  const [step, setStep] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const welcomeFadeAnim = useRef(new Animated.Value(0)).current;
  const welcomeScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Welcome entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(welcomeFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(welcomeScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateTransition = useCallback(
    (nextStep: number) => {
      const direction = nextStep > step ? 1 : -1;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: direction * -50,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        slideAnim.setValue(direction * 50);
        scaleAnim.setValue(0.95);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 60,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 60,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [step, fadeAnim, slideAnim, scaleAnim]
  );

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    }
  }, [step, animateTransition]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  }, [step, animateTransition]);

  const handleFinish = useCallback(() => {
    setHasCompletedSetup(true);
    onOpenMushaf();
  }, [setHasCompletedSetup, onOpenMushaf]);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0a0a1a" : "#f5f7f3";
  const cardBg = isDark ? "#151528" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#888";
  const borderColor = isDark ? "#2a2a3e" : "#e8e8e8";

  const languages: { key: LangKey; label: string; nativeLabel: string }[] = [
    { key: "ar", label: "Arabic", nativeLabel: "العربية" },
    { key: "en", label: "English", nativeLabel: "English" },
    { key: "fr", label: "French", nativeLabel: "Français" },
    { key: "amz", label: "Tamazight", nativeLabel: "ⵜⴰⵎⴰⵣⵉⵖⵜ" },
  ];

  const mushafs: {
    key: Quira;
    labelKey: string;
    icon: keyof typeof Ionicons.glyphMap;
    descKey: string;
  }[] = [
    {
      key: "madina",
      labelKey: "mosshaf_hafs",
      icon: "book",
      descKey: "mosshaf_hafs",
    },
    {
      key: "warsh",
      labelKey: "mosshaf_warsh",
      icon: "book-outline",
      descKey: "mosshaf_warsh",
    },
  ];

  // Split themes into light and dark
  const lightThemes = THEMES.filter((th) => !th.night);
  const darkThemes = THEMES.filter((th) => th.night);

  // =========================================================================
  // Step 0: Welcome
  // =========================================================================
  const renderWelcome = () => (
    <Animated.View
      style={[
        styles.welcomeContainer,
        {
          opacity: welcomeFadeAnim,
          transform: [{ scale: welcomeScaleAnim }],
        },
      ]}
    >
      {/* Decorative Islamic geometric pattern border */}
      <View style={styles.welcomeGeometric}>
        <View style={[styles.geometricLine, { backgroundColor: GOLD }]} />
        <View style={[styles.geometricDiamond, { borderColor: GOLD }]} />
        <View style={[styles.geometricLine, { backgroundColor: GOLD }]} />
      </View>

      {/* App Icon */}
      <View style={[styles.welcomeIconWrap, { backgroundColor: isDark ? "#1a2a1e" : ACCENT_LIGHT }]}>
        <Image
          source={require("../../assets/mauri.png")}
          style={styles.welcomeIcon}
          resizeMode="contain"
        />
      </View>

      {/* Bismillah */}
      <Text style={[styles.welcomeBismillah, { color: GOLD }]}>
        {t("welcome_title", lang)}
      </Text>

      {/* App Title */}
      <Text style={[styles.welcomeTitle, { color: textColor }]}>
        {t("welcome_subtitle", lang)}
      </Text>

      {/* Description */}
      <Text style={[styles.welcomeDesc, { color: mutedColor }]}>
        {t("welcome_desc", lang)}
      </Text>

      {/* Decorative geometric bottom */}
      <View style={styles.welcomeGeometric}>
        <View style={[styles.geometricLine, { backgroundColor: GOLD }]} />
        <View style={[styles.geometricDiamond, { borderColor: GOLD }]} />
        <View style={[styles.geometricLine, { backgroundColor: GOLD }]} />
      </View>

      {/* Start Button */}
      <Pressable
        style={({ pressed }) => [
          styles.welcomeBtn,
          { backgroundColor: ACCENT },
          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        ]}
        onPress={handleNext}
      >
        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.welcomeBtnText}>{t("welcome_start", lang)}</Text>
      </Pressable>
    </Animated.View>
  );

  // =========================================================================
  // Step 1: Language Selection
  // =========================================================================
  const renderLanguageStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <View style={[styles.stepIconCircle, { backgroundColor: isDark ? "#1a2a3e" : "#e3f2fd" }]}>
          <Ionicons name="language" size={36} color="#4285f4" />
        </View>
      </View>
      <Text style={[styles.stepTitle, { color: textColor }]}>
        {t("step_language", lang)}
      </Text>
      <Text style={[styles.stepDesc, { color: mutedColor }]}>
        {t("step_language_desc", lang)}
      </Text>

      <View style={styles.langGrid}>
        {languages.map((l) => {
          const isActive = lang === l.key;
          return (
            <Pressable
              key={l.key}
              style={({ pressed }) => [
                styles.langCard,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? "#1a3a2e"
                      : ACCENT_LIGHT
                    : cardBg,
                  borderColor: isActive ? ACCENT : borderColor,
                  borderWidth: isActive ? 2 : 1,
                },
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => setLang(l.key)}
            >
              {isActive && (
                <View style={[styles.langCheckBadge, { backgroundColor: ACCENT }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
              <Text
                style={[
                  styles.langNative,
                  {
                    color: isActive ? ACCENT : textColor,
                    fontWeight: isActive ? "800" : "600",
                  },
                ]}
              >
                {l.nativeLabel}
              </Text>
              <Text style={[styles.langSub, { color: mutedColor }]}>
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // =========================================================================
  // Step 2: Mushaf Selection
  // =========================================================================
  const renderMushafStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <View style={[styles.stepIconCircle, { backgroundColor: isDark ? "#2a1a2e" : "#fce4ec" }]}>
          <Ionicons name="book" size={36} color="#c62828" />
        </View>
      </View>
      <Text style={[styles.stepTitle, { color: textColor }]}>
        {t("step_mushaf", lang)}
      </Text>
      <Text style={[styles.stepDesc, { color: mutedColor }]}>
        {t("step_mushaf_desc", lang)}
      </Text>

      <View style={styles.mushafGrid}>
        {mushafs.map((m) => {
          const isActive = quira === m.key;
          return (
            <Pressable
              key={m.key}
              style={({ pressed }) => [
                styles.mushafCard,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? "#1a3a2e"
                      : ACCENT_LIGHT
                    : cardBg,
                  borderColor: isActive ? ACCENT : borderColor,
                  borderWidth: isActive ? 2.5 : 1,
                },
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => setQuira(m.key)}
            >
              <View
                style={[
                  styles.mushafIconCircle,
                  {
                    backgroundColor: isActive
                      ? ACCENT
                      : isDark
                      ? "#2a2a3e"
                      : "#f0f0f0",
                  },
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={32}
                  color={isActive ? "#fff" : mutedColor}
                />
              </View>
              <Text
                style={[
                  styles.mushafLabel,
                  {
                    color: isActive ? ACCENT : textColor,
                    fontWeight: isActive ? "800" : "600",
                  },
                ]}
              >
                {t(m.labelKey, lang)}
              </Text>
              {isActive && (
                <View style={[styles.mushafCheckBadge, { backgroundColor: ACCENT }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // =========================================================================
  // Step 3: Theme Selection
  // =========================================================================
  const renderThemeStep = () => {
    const renderThemeCircle = (th: Theme, idx: number) => {
      const isActive = theme.name === th.name;
      return (
        <Pressable
          key={idx}
          style={({ pressed }) => [
            styles.themeCircle,
            {
              backgroundColor: th.backgroundColor,
              borderColor: isActive ? ACCENT : th.night ? "#555" : "#ddd",
              borderWidth: isActive ? 3 : 1.5,
            },
            pressed && { transform: [{ scale: 0.9 }] },
          ]}
          onPress={() => setTheme(th)}
        >
          {th.night && !isActive && (
            <Ionicons name="moon" size={16} color="#aaa" />
          )}
          {isActive && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={th.night ? "#4285f4" : ACCENT}
            />
          )}
        </Pressable>
      );
    };

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepIconWrap}>
          <View
            style={[
              styles.stepIconCircle,
              { backgroundColor: isDark ? "#2a2a1e" : "#fff3e0" },
            ]}
          >
            <Ionicons name="color-palette" size={36} color="#ff9800" />
          </View>
        </View>
        <Text style={[styles.stepTitle, { color: textColor }]}>
          {t("step_theme", lang)}
        </Text>
        <Text style={[styles.stepDesc, { color: mutedColor }]}>
          {t("step_theme_desc", lang)}
        </Text>

        {/* Preview Card */}
        <View
          style={[
            styles.themePreview,
            {
              backgroundColor: theme.backgroundColor,
              borderColor: borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.themePreviewText,
              { color: theme.color },
            ]}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </Text>
          <Text
            style={[
              styles.themePreviewVerse,
              { color: theme.color, opacity: 0.7 },
            ]}
          >
            الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
          </Text>
        </View>

        {/* Light Themes */}
        <Text style={[styles.themeGroupLabel, { color: mutedColor }]}>
          {t("light_themes", lang)}
        </Text>
        <View style={styles.themeGrid}>
          {lightThemes.map((th, idx) => renderThemeCircle(th, idx))}
        </View>

        {/* Dark Themes */}
        <Text style={[styles.themeGroupLabel, { color: mutedColor }]}>
          {t("dark_themes", lang)}
        </Text>
        <View style={styles.themeGrid}>
          {darkThemes.map((th, idx) =>
            renderThemeCircle(th, idx + lightThemes.length)
          )}
        </View>
      </View>
    );
  };

  // =========================================================================
  // Progress Indicator
  // =========================================================================
  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            {
              backgroundColor:
                i === step
                  ? ACCENT
                  : i < step
                  ? GOLD
                  : isDark
                  ? "#333"
                  : "#ddd",
              width: i === step ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  // =========================================================================
  // Navigation Buttons
  // =========================================================================
  const renderNavigation = () => {
    if (step === 0) return null;

    const isLastStep = step === TOTAL_STEPS - 1;

    return (
      <View style={styles.navContainer}>
        {/* Back button */}
        <Pressable
          style={({ pressed }) => [
            styles.navBtnSecondary,
            {
              backgroundColor: isDark ? "#1a1a2e" : "#f0f0f0",
              borderColor: borderColor,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handlePrev}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={textColor}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.navBtnSecondaryText, { color: textColor }]}>
            {t("step_prev", lang)}
          </Text>
        </Pressable>

        {/* Step counter */}
        <Text style={[styles.stepCounter, { color: mutedColor }]}>
          {step} {t("step_of", lang)} {TOTAL_STEPS - 1}
        </Text>

        {/* Next / Finish button */}
        <Pressable
          style={({ pressed }) => [
            styles.navBtnPrimary,
            { backgroundColor: isLastStep ? GOLD : ACCENT },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={isLastStep ? handleFinish : handleNext}
        >
          <Text style={styles.navBtnPrimaryText}>
            {isLastStep ? t("step_finish", lang) : t("step_next", lang)}
          </Text>
          <Ionicons
            name={isLastStep ? "book-outline" : "arrow-forward"}
            size={18}
            color="#fff"
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      </View>
    );
  };

  // =========================================================================
  // Main Render
  // =========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      {step === 0 ? (
        // Welcome: full-screen centered
        <View style={styles.welcomeWrapper}>
          {renderWelcome()}
        </View>
      ) : (
        // Steps: scrollable content
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateX: slideAnim },
                  { scale: scaleAnim },
                ],
              }}
            >
              {step === 1 && renderLanguageStep()}
              {step === 2 && renderMushafStep()}
              {step === 3 && renderThemeStep()}
            </Animated.View>
          </ScrollView>

          {renderProgress()}
          {renderNavigation()}
        </>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    paddingTop: 20,
  },

  // ---- Welcome Screen ----
  welcomeWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeContainer: {
    alignItems: "center",
    width: "100%",
  },
  welcomeGeometric: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 20,
    width: "80%",
  },
  geometricLine: {
    flex: 1,
    height: 1,
    opacity: 0.4,
  },
  geometricDiamond: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  welcomeIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  welcomeBismillah: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
    lineHeight: 36,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  welcomeDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  welcomeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 12,
    shadowColor: "#1a5c2e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  // ---- Step Content ----
  stepContent: {
    alignItems: "center",
    paddingTop: 16,
  },
  stepIconWrap: {
    marginBottom: 16,
  },
  stepIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },

  // ---- Language Cards ----
  langGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  langCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  langCheckBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  langNative: {
    fontSize: 20,
    marginBottom: 6,
  },
  langSub: {
    fontSize: 12,
  },

  // ---- Mushaf Cards ----
  mushafGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
  },
  mushafCard: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mushafIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  mushafLabel: {
    fontSize: 15,
    textAlign: "center",
  },
  mushafCheckBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // ---- Theme Selection ----
  themePreview: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  themePreviewText: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
    lineHeight: 36,
  },
  themePreviewVerse: {
    fontSize: 18,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : undefined,
    lineHeight: 30,
  },
  themeGroupLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  themeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ---- Progress Dots ----
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },

  // ---- Navigation Buttons ----
  navContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  navBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  navBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepCounter: {
    fontSize: 13,
    fontWeight: "500",
  },
  navBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: "#1a5c2e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
