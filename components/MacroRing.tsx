import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface MacroRingProps {
  value: number;
  goal: number;
  color: string;
  label: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
}

export function MacroRing({
  value,
  goal,
  color,
  label,
  unit = "g",
  size = 80,
  strokeWidth = 7,
}: MacroRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
          {Math.round(value)}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  unit: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    lineHeight: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
