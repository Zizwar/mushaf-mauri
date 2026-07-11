import React from "react";
import { StyleSheet, View } from "react-native";
import { ACCENT, RECORDING_COLOR } from "../theme/themes";

interface Props {
  /** metering value in dBFS (typically -60..0), undefined when idle */
  metering?: number;
  active: boolean;
}

const BAR_COUNT = 14;

/** Simple live input-level meter (bar row) for the recording screen. */
export function LevelMeter({ metering, active }: Props) {
  const db = typeof metering === "number" ? metering : -60;
  const level = Math.min(1, Math.max(0, (db + 50) / 50));
  const lit = active ? Math.round(level * BAR_COUNT) : 0;

  return (
    <View style={styles.row}>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const isLit = i < lit;
        const isHot = i >= BAR_COUNT - 3;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 6 + i * 1.6,
                backgroundColor: isLit
                  ? isHot
                    ? RECORDING_COLOR
                    : ACCENT
                  : "rgba(128,128,128,0.25)",
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 30,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
