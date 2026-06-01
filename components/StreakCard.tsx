import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  const colors = useColors();

  const flames = Array.from({ length: 7 }, (_, i) => i < streak % 7 || streak >= 7);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.left}>
        <View style={[styles.iconBg, { backgroundColor: colors.streakActive + "20" }]}>
          <Feather name="zap" size={22} color={colors.streakActive} />
        </View>
        <View>
          <Text style={[styles.streakNum, { color: colors.foreground }]}>
            {streak} day{streak !== 1 ? "s" : ""}
          </Text>
          <Text style={[styles.streakLabel, { color: colors.mutedForeground }]}>
            {streak === 0 ? "Start your streak today!" : "Logging streak"}
          </Text>
        </View>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: 7 }, (_, i) => {
          const active = i < (streak > 7 ? 7 : streak);
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: active ? colors.streakActive : colors.streakInactive,
                  transform: [{ scale: active ? 1 : 0.7 }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  streakNum: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  dots: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
