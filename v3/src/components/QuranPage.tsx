import React, { useMemo } from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  I18nManager,
} from "react-native";
import { getPageCoordinates } from "../utils/coordinates";
import { getImagePageUri } from "../utils/api";
import type { AyahPosition } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NISBA = 1.471676300578035;
const MARGIN_PAGE_WIDTH = 5;
const IMAGE_HEIGHT = SCREEN_WIDTH * NISBA - MARGIN_PAGE_WIDTH;

interface QuranPageProps {
  pageId: number;
  isVisible: boolean;
}

const AyahOverlay = React.memo(
  ({ position }: { position: AyahPosition }) => {
    const isRTL = I18nManager.isRTL;

    const onPress = () => {
      Alert.alert(
        `سورة ${position.wino.sura} - آية ${position.wino.aya}`,
        `سورة: ${position.wino.sura}\nآية: ${position.wino.aya}\nصفحة: ${position.wino.page}`,
        [{ text: "حسناً" }]
      );
    };

    const positionStyle = !isRTL
      ? { left: position.left, width: position.width }
      : { right: position.left, width: position.width };

    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.ayahButton,
          {
            top: position.top,
            height: position.height,
          },
          positionStyle,
        ]}
      />
    );
  }
);

function QuranPage({ pageId, isVisible }: QuranPageProps) {
  const imageUri = useMemo(() => getImagePageUri(pageId), [pageId]);
  const positions = useMemo(() => getPageCoordinates(pageId), [pageId]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUri }}
        style={styles.pageImage}
        resizeMode="stretch"
      />
      {isVisible &&
        positions.map((pos, index) => (
          <AyahOverlay key={`${pos.id}_${index}`} position={pos} />
        ))}
    </View>
  );
}

export default React.memo(QuranPage);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: "center",
  },
  pageImage: {
    width: SCREEN_WIDTH - MARGIN_PAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  ayahButton: {
    position: "absolute",
    // Transparent but touchable
    backgroundColor: "transparent",
  },
});
