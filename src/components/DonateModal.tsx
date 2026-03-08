import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../store/useAppStore";
import { t } from "../i18n";

interface DonateModalProps {
  visible: boolean;
  onClose: () => void;
}

const TIERS = [
  { emoji: "☕", amount: 20 },
  { emoji: "🍕", amount: 60 },
  { emoji: "🫕", amount: 180 },
  { emoji: "📿", amount: 420 },
];

export default function DonateModal({ visible, onClose }: DonateModalProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const [thanked, setThanked] = useState(false);

  const isDark = !!theme.night;
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8f0" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#777";
  const borderColor = theme.borderColor;
  const accentGreen = "#1a5c2e";
  const accentBlue = "#336699";

  const handleTierPress = () => {
    // Placeholder — real payment integration goes here
    setThanked(true);
    setTimeout(() => {
      setThanked(false);
      onClose();
    }, 2200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: cardBg }]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: borderColor }]} />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header icon */}
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "#1a2e1a" : "#e8f5e9" }]}>
              <Ionicons name="heart-circle" size={52} color={accentGreen} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: textColor }]}>
              {t("donate_title", lang)}
            </Text>

            {/* Free badge — icon only, no emoji */}
            <View style={[styles.freeBadge, { backgroundColor: isDark ? "#1a3a1a" : "#e8f5e9", borderColor: isDark ? "#2a5a2a" : "#c8e6c9" }]}>
              <Ionicons name="shield-checkmark" size={22} color={accentGreen} />
              <View style={styles.freeBadgeTexts}>
                <Text style={[styles.freeBadgeTitle, { color: accentGreen }]}>
                  {t("donate_free_badge", lang)}
                </Text>
                <Text style={[styles.freeBadgeSub, { color: isDark ? "#6aaf6a" : "#388e3c" }]}>
                  {t("donate_free_sub", lang)}
                </Text>
              </View>
            </View>

            {/* Message — centered, avoids LTR/RTL conflict */}
            <Text style={[styles.message, { color: mutedColor }]}>
              {t("donate_msg", lang)}
            </Text>

            {/* Tiers */}
            {thanked ? (
              <View style={[styles.thanksBox, { backgroundColor: isDark ? "#1a2e1a" : "#e8f5e9" }]}>
                <Ionicons name="heart" size={32} color={accentGreen} style={{ marginBottom: 8 }} />
                <Text style={[styles.thanksText, { color: accentGreen }]}>
                  {t("donate_thanks", lang)}
                </Text>
              </View>
            ) : (
              <View style={styles.tiersGrid}>
                {TIERS.map((tier) => (
                  <Pressable
                    key={tier.amount}
                    style={({ pressed }) => [
                      styles.tierCard,
                      {
                        backgroundColor: isDark ? "#1e1e36" : "#f5f7fa",
                        borderColor: pressed ? accentBlue : borderColor,
                        borderWidth: pressed ? 2 : StyleSheet.hairlineWidth,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    onPress={handleTierPress}
                  >
                    <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                    <Text style={[styles.tierAmount, { color: accentBlue }]}>
                      {tier.amount}
                    </Text>
                    <Text style={[styles.tierCurrency, { color: mutedColor }]}>
                      MAD
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Later button */}
            {!thanked && (
              <Pressable
                style={({ pressed }) => [styles.laterBtn, { opacity: pressed ? 0.6 : 1 }]}
                onPress={onClose}
              >
                <Text style={[styles.laterText, { color: mutedColor }]}>
                  {t("donate_later", lang)}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: "90%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 16 },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  content: {
    padding: 24,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  freeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    width: "100%",
    marginBottom: 16,
  },
  freeBadgeTexts: {
    flex: 1,
    alignItems: "center",
  },
  freeBadgeTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  freeBadgeSub: {
    fontSize: 11,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  tiersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
  },
  tierCard: {
    width: "44%",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 4,
  },
  tierEmoji: {
    fontSize: 34,
    marginBottom: 4,
  },
  tierAmount: {
    fontSize: 20,
    fontWeight: "800",
  },
  tierCurrency: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  thanksBox: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  thanksText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  laterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  laterText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
