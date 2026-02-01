import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Paths, File } from "expo-file-system";
import { useAppStore, type Bookmark } from "../store/useAppStore";
import { t } from "../i18n";
import { getSuraName } from "../utils/quranHelpers";

const BOOKMARKS_FILE = new File(Paths.document, "bookmarks.json");
const ACCENT = "#1a5c2e";

interface BookmarksScreenProps {
  onGoBack: () => void;
  onNavigateToPage?: (page: number) => void;
}

function loadBookmarks(): Bookmark[] {
  try {
    if (BOOKMARKS_FILE.exists) {
      const json = BOOKMARKS_FILE.textSync();
      return JSON.parse(json);
    }
  } catch {}
  return [];
}

function saveBookmarks(bookmarks: Bookmark[]) {
  try {
    BOOKMARKS_FILE.write(JSON.stringify(bookmarks));
  } catch {}
}

export default function BookmarksScreen({ onGoBack, onNavigateToPage }: BookmarksScreenProps) {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const setBookmarks = useAppStore((s) => s.setBookmarks);
  const removeBookmark = useAppStore((s) => s.removeBookmark);

  const isDark = !!theme.night;
  const bgColor = isDark ? "#0d0d1a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a2e" : "#ffffff";
  const textColor = isDark ? "#e8e8e8" : "#1a1a2e";
  const mutedColor = isDark ? "#888" : "#999";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#eee";

  // Load bookmarks from file on mount
  useEffect(() => {
    const saved = loadBookmarks();
    if (saved.length > 0) {
      setBookmarks(saved);
    }
  }, [setBookmarks]);

  // Save bookmarks to file whenever they change
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const handleRemove = (sura: number, aya: number) => {
    Alert.alert(t("remove", lang), "", [
      { text: t("cancel", lang), style: "cancel" },
      {
        text: t("yes", lang),
        style: "destructive",
        onPress: () => removeBookmark(sura, aya),
      },
    ]);
  };

  const handleGoToPage = (page: number) => {
    if (onNavigateToPage) {
      onNavigateToPage(page);
    }
    onGoBack();
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <Pressable
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => handleGoToPage(item.page)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={[styles.suraName, { color: textColor }]}>
            {getSuraName(item.sura)}
          </Text>
          <Text style={[styles.details, { color: mutedColor }]}>
            {t("aya_s", lang)} {item.aya} • {t("page", lang)} {item.page}
          </Text>
        </View>
        <Pressable
          onPress={() => handleRemove(item.sura, item.aya)}
          hitSlop={10}
          style={styles.removeBtn}
        >
          <Ionicons name="trash-outline" size={20} color="#d32f2f" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t("bookmarks", lang)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={48} color={mutedColor} />
          <Text style={[styles.emptyText, { color: mutedColor }]}>
            {t("no_bookmarks", lang)}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => `bm_${item.sura}_${item.aya}_${item.timestamp}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
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
  list: {
    padding: 16,
    gap: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardInfo: {
    flex: 1,
  },
  suraName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
  },
  removeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
