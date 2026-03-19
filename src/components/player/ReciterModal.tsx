import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type LangKey } from "../../i18n";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const RECORDING_COLOR = "#d32f2f";

export interface ReciterItem {
  id: string;
  voice: string;
  isProfile?: boolean;
  type?: string;
}

export interface ReciterColors {
  modalBg: string;
  modalText: string;
  modalBorder: string;
  accent: string;
}

interface ReciterModalProps {
  visible: boolean;
  colors: ReciterColors;
  lang: LangKey;
  reciters: ReciterItem[];
  moqriId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const USER_RECORDING_ID = "__user_recording__";

export default function ReciterModal({
  visible,
  colors,
  lang,
  reciters,
  moqriId,
  onClose,
  onSelect,
}: ReciterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.modalBg }]}>
          {/* Handle bar */}
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.modalBorder }]} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.modalText }]}>
            {t("chooseQaree", lang)}
          </Text>

          {/* Reciter list */}
          <FlatList
            data={reciters}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              if (item.type === "separator") {
                return (
                  <View style={[styles.separator, { backgroundColor: colors.modalBorder }]} />
                );
              }
              const isActive = item.id === moqriId;
              const isUser = item.id === USER_RECORDING_ID;
              const isProfile = !!item.isProfile;
              return (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={[
                    styles.item,
                    { borderBottomColor: colors.modalBorder },
                    isActive && { backgroundColor: colors.accent + "18" },
                  ]}
                >
                  <View style={styles.itemContent}>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.accent}
                        style={styles.checkIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.itemText,
                        { color: colors.modalText },
                        isActive && { color: colors.accent, fontWeight: "700" },
                        isUser && !isActive && { color: RECORDING_COLOR, fontWeight: "600" },
                        isProfile && !isActive && { color: "#e91e63", fontWeight: "600" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.voice}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />

          {/* Close button */}
          <Pressable
            style={[styles.closeBtn, { borderTopColor: colors.modalBorder }]}
            onPress={onClose}
          >
            <Text style={[styles.closeBtnText, { color: colors.accent }]}>
              {t("close", lang)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingTop: 8,
  },
  handle: { alignItems: "center", paddingVertical: 8 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  listContent: { paddingBottom: 8 },
  separator: { height: 1, marginVertical: 4, marginHorizontal: 20 },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemContent: { flexDirection: "row", alignItems: "center" },
  checkIcon: { marginRight: 10 },
  itemText: { fontSize: 16, flex: 1, textAlign: "right" },
  closeBtn: { padding: 18, alignItems: "center", borderTopWidth: 1 },
  closeBtnText: { fontSize: 16, fontWeight: "700" },
});
