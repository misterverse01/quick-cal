import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useNutrition } from "@/context/NutritionContext";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroRing } from "@/components/MacroRing";
import { FoodCard } from "@/components/FoodCard";
import { StreakCard } from "@/components/StreakCard";

export default function DiaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayEntries, goals, streak, getTodayTotals, removeEntry } = useNutrition();
  const [refreshing, setRefreshing] = React.useState(false);

  const totals = getTodayTotals();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Today</Text>
            <Text style={[styles.date, { color: colors.foreground }]}>{today}</Text>
          </View>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringSection}>
          <CalorieRing consumed={totals.calories} goal={goals.calories} />
        </View>

        {/* Macro Rings */}
        <View style={[styles.macroRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MacroRing
            value={totals.protein}
            goal={goals.protein}
            color={colors.protein}
            label="Protein"
          />
          <View style={[styles.macroDivider, { backgroundColor: colors.border }]} />
          <MacroRing
            value={totals.carbs}
            goal={goals.carbs}
            color={colors.carbs}
            label="Carbs"
          />
          <View style={[styles.macroDivider, { backgroundColor: colors.border }]} />
          <MacroRing
            value={totals.fat}
            goal={goals.fat}
            color={colors.fat}
            label="Fat"
          />
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <StreakCard streak={streak} />
        </View>

        {/* Food Log */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Today's Food
          </Text>
          {todayEntries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>📸</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No entries yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Tap Scan to photograph your food
              </Text>
            </View>
          ) : (
            todayEntries
              .slice()
              .reverse()
              .map((entry) => (
                <FoodCard key={entry.id} entry={entry} onDelete={removeEntry} />
              ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  date: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  ringSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  macroDivider: {
    width: 1,
    height: 60,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
