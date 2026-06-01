import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface DayData {
  date: string;
  calories: number;
}

interface WeeklyChartProps {
  data: DayData[];
  goal: number;
}

const SCREEN_W = Dimensions.get("window").width;
const CHART_H = 160;
const BAR_AREA_H = 120;
const PADDING_H = 16;

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_LABELS[d.getDay()] ?? "";
}

export function WeeklyChart({ data, goal }: WeeklyChartProps) {
  const colors = useColors();
  const chartWidth = SCREEN_W - 48;
  const barWidth = Math.floor((chartWidth - PADDING_H * 2) / data.length) - 6;
  const maxVal = Math.max(goal * 1.2, ...data.map((d) => d.calories), 100);

  const today = new Date().toISOString().split("T")[0]!;

  const goalY = BAR_AREA_H - (goal / maxVal) * BAR_AREA_H;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_H}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.5" />
          </LinearGradient>
          <LinearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#00A8D4" stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.7" />
          </LinearGradient>
          <LinearGradient id="overGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.destructive} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.destructive} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* Goal line */}
        <Line
          x1={PADDING_H}
          y1={goalY}
          x2={chartWidth - PADDING_H}
          y2={goalY}
          stroke={colors.mutedForeground}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <SvgText
          x={chartWidth - PADDING_H - 2}
          y={goalY - 4}
          fontSize={9}
          fill={colors.mutedForeground}
          textAnchor="end"
          fontFamily="Inter_500Medium"
        >
          GOAL
        </SvgText>

        {data.map((item, i) => {
          const barH = item.calories > 0 ? (item.calories / maxVal) * BAR_AREA_H : 0;
          const x = PADDING_H + i * ((chartWidth - PADDING_H * 2) / data.length);
          const barX = x + ((chartWidth - PADDING_H * 2) / data.length - barWidth) / 2;
          const barY = BAR_AREA_H - barH;
          const isToday = item.date === today;
          const isOver = item.calories > goal && item.calories > 0;
          const gradId = isOver ? "url(#overGrad)" : isToday ? "url(#todayGrad)" : "url(#barGrad)";

          return (
            <React.Fragment key={item.date}>
              <Rect
                x={barX}
                y={barH > 0 ? barY : BAR_AREA_H - 3}
                width={barWidth}
                height={barH > 0 ? barH : 3}
                fill={barH > 0 ? gradId : colors.muted}
                rx={5}
              />
              <SvgText
                x={barX + barWidth / 2}
                y={CHART_H - 4}
                fontSize={10}
                fill={isToday ? colors.primary : colors.mutedForeground}
                textAnchor="middle"
                fontFamily={isToday ? "Inter_700Bold" : "Inter_400Regular"}
              >
                {dayLabel(item.date)}
              </SvgText>
              {item.calories > 0 && (
                <SvgText
                  x={barX + barWidth / 2}
                  y={barY - 4}
                  fontSize={8}
                  fill={isToday ? colors.primary : colors.mutedForeground}
                  textAnchor="middle"
                  fontFamily="Inter_500Medium"
                >
                  {item.calories >= 1000
                    ? `${(item.calories / 1000).toFixed(1)}k`
                    : item.calories}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
