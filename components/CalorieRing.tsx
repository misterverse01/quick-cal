import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({ consumed, goal, size = 180, strokeWidth = 14 }: CalorieRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;
  const remaining = Math.max(0, goal - consumed);
  const isOver = consumed > goal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00C896" />
            <Stop offset="100%" stopColor="#00A8D4" />
          </LinearGradient>
          <LinearGradient id="overGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF6B6B" />
            <Stop offset="100%" stopColor="#FF4D4F" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isOver ? "url(#overGrad)" : "url(#calGrad)"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={[styles.innerContent, { width: size, height: size }]}>
        <Text style={[styles.calorieNumber, { color: isOver ? colors.destructive : colors.foreground }]}>
          {Math.round(consumed)}
        </Text>
        <Text style={[styles.calorieLabel, { color: colors.mutedForeground }]}>
          {isOver ? "over goal" : "kcal eaten"}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.remainingNum, { color: colors.primary }]}>
          {isOver ? `+${Math.round(consumed - goal)}` : Math.round(remaining)}
        </Text>
        <Text style={[styles.remainingLabel, { color: colors.mutedForeground }]}>
          {isOver ? "over" : "remaining"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  calorieNumber: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    lineHeight: 46,
  },
  calorieLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    width: 30,
    height: 1,
    marginVertical: 6,
  },
  remainingNum: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  remainingLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
