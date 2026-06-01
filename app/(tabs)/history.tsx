import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useNutrition, type AILog } from "@/context/NutritionContext";
import { WeeklyChart } from "@/components/WeeklyChart";
import * as Haptics from "expo-haptics";

type Tab = "overview" | "ai-logs";

function StatCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statVal, { color }]} numberOfLines={1}>
        {Math.round(value)}
        <Text style={[styles.statUnit, { color: colors.mutedForeground }]}>{unit}</Text>
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function AILogCard({ log }: { log: AILog }) {
  const colors = useColors();
  const time = new Date(log.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const confColor = log.confidence >= 0.8 ? colors.primary : log.confidence >= 0.6 ? colors.carbs : colors.destructive;

  return (
    <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.aiCardTop}>
        {log.imageUri ? (
          <Image source={{ uri: log.imageUri }} style={styles.aiThumb} />
        ) : (
          <View style={[styles.aiThumbPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="camera" size={16} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.aiCardInfo}>
          <View style={styles.aiCardTitleRow}>
            <Text style={[styles.aiCardName, { color: colors.foreground }]} numberOfLines={1}>
              {log.foodName}
            </Text>
            <View style={[styles.confBadge, { backgroundColor: confColor + "18" }]}>
              <Text style={[styles.confText, { color: confColor }]}>
                {Math.round(log.confidence * 100)}%
              </Text>
            </View>
          </View>
          <Text style={[styles.aiCardTime, { color: colors.mutedForeground }]}>{time}</Text>
          <Text style={[styles.aiCardServing, { color: colors.mutedForeground }]}>
            {log.servingSize} · {log.modelUsed} · {log.responseTimeMs}ms
          </Text>
        </View>
      </View>

      <View style={styles.aiMacroRow}>
        <AIMacro label="Cal" value={log.calories} unit="kcal" color={colors.primary} />
        <AIMacro label="P" value={log.protein} unit="g" color={colors.protein} />
        <AIMacro label="C" value={log.carbs} unit="g" color={colors.carbs} />
        <AIMacro label="F" value={log.fat} unit="g" color={colors.fat} />
        <View style={styles.aiDiaryBadge}>
          <Feather
            name={log.addedToDiary ? "check-circle" : "circle"}
            size={14}
            color={log.addedToDiary ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.aiDiaryText, { color: log.addedToDiary ? colors.primary : colors.mutedForeground }]}>
            {log.addedToDiary ? "Saved" : "Not saved"}
          </Text>
        </View>
      </View>

      {log.healthNotes ? (
        <Text style={[styles.aiNotes, { color: colors.mutedForeground }]} numberOfLines={2}>
          {log.healthNotes}
        </Text>
      ) : null}

      {log.ingredients.length > 0 && (
        <Text style={[styles.aiIngredients, { color: colors.mutedForeground }]} numberOfLines={1}>
          {log.ingredients.slice(0, 5).join(", ")}
          {log.ingredients.length > 5 ? ` +${log.ingredients.length - 5} more` : ""}
        </Text>
      )}
    </View>
  );
}

function AIMacro({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.aiMacroItem}>
      <Text style={[styles.aiMacroVal, { color }]}>{Math.round(value)}</Text>
      <Text style={[styles.aiMacroLabel, { color: "#888" }]}>{label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getWeeklyData, goals, dailyLogs, aiLogs, clearAILogs } = useNutrition();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const weeklyData = getWeeklyData();

  const weekStats = useMemo(() => {
    const activeDays = weeklyData.filter((d) => d.calories > 0);
    const avgCals = activeDays.length
      ? activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length
      : 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = dailyLogs.filter((l) => new Date(l.date) >= sevenDaysAgo);
    const allEntries = recentLogs.flatMap((l) => l.entries);
    const n = Math.max(activeDays.length, 1);
    return {
      avgCals,
      avgProtein: allEntries.reduce((s, e) => s + e.protein, 0) / n,
      avgCarbs: allEntries.reduce((s, e) => s + e.carbs, 0) / n,
      avgFat: allEntries.reduce((s, e) => s + e.fat, 0) / n,
      activeDays: activeDays.length,
    };
  }, [weeklyData, dailyLogs]);

  const recentDays = useMemo(() => {
    const result: { date: string; label: string; calories: number; entries: number }[] = [];
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const dateStr = day.toISOString().split("T")[0]!;
      const log = dailyLogs.find((l) => l.date === dateStr);
      if (log && log.entries.length > 0) {
        result.push({
          date: dateStr,
          label: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          calories: log.entries.reduce((s, e) => s + e.calories, 0),
          entries: log.entries.length,
        });
      }
    }
    return result;
  }, [dailyLogs]);

  const aiStats = useMemo(() => {
    if (!aiLogs.length) return null;
    const avgConf = aiLogs.reduce((s, l) => s + l.confidence, 0) / aiLogs.length;
    const avgTime = aiLogs.reduce((s, l) => s + l.responseTimeMs, 0) / aiLogs.length;
    const saved = aiLogs.filter((l) => l.addedToDiary).length;
    return { avgConf, avgTime, saved, total: aiLogs.length };
  }, [aiLogs]);

  function handleClearLogs() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Clear AI Logs?", "This will permanently delete all AI scan history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearAILogs },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Segmented tab bar */}
      <View style={[styles.segHeader, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>History</Text>
        <View style={[styles.segControl, { backgroundColor: colors.muted }]}>
          {(["overview", "ai-logs"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.segBtn,
                activeTab === t && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(t); }}
            >
              <Text style={[
                styles.segBtnText,
                { color: activeTab === t ? colors.foreground : colors.mutedForeground },
              ]}>
                {t === "overview" ? "Overview" : "AI Logs"}
              </Text>
              {t === "ai-logs" && aiLogs.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                    {aiLogs.length > 99 ? "99+" : aiLogs.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" ? (
          <>
            {/* Weekly chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.foreground }]}>Weekly Calories</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Logged</Text>
                  <View style={[styles.legendDot, { backgroundColor: colors.mutedForeground }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Goal</Text>
                </View>
              </View>
              <WeeklyChart data={weeklyData} goal={goals.calories} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>7-Day Averages</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Avg Calories" value={weekStats.avgCals} unit="kcal" color={colors.primary} />
              <StatCard label="Avg Protein" value={weekStats.avgProtein} unit="g" color={colors.protein} />
              <StatCard label="Avg Carbs" value={weekStats.avgCarbs} unit="g" color={colors.carbs} />
              <StatCard label="Avg Fat" value={weekStats.avgFat} unit="g" color={colors.fat} />
            </View>

            <View style={[styles.activeBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Feather name="activity" size={18} color={colors.primary} />
              <Text style={[styles.activeBannerText, { color: colors.foreground }]}>
                You logged food on{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>
                  {weekStats.activeDays} of 7
                </Text>{" "}
                days this week
              </Text>
            </View>

            {recentDays.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Days</Text>
                {recentDays.map((day) => {
                  const pct = goals.calories > 0 ? (day.calories / goals.calories) * 100 : 0;
                  const isOver = day.calories > goals.calories;
                  return (
                    <View key={day.date} style={[styles.dayRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.dayInfo}>
                        <Text style={[styles.dayLabel, { color: colors.foreground }]}>{day.label}</Text>
                        <Text style={[styles.dayEntries, { color: colors.mutedForeground }]}>
                          {day.entries} item{day.entries !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={styles.dayRight}>
                        <Text style={[styles.dayCal, { color: isOver ? colors.destructive : colors.foreground }]}>
                          {day.calories}
                        </Text>
                        <Text style={[styles.dayCalLabel, { color: colors.mutedForeground }]}>kcal</Text>
                        <View style={[styles.dayBar, { backgroundColor: colors.muted }]}>
                          <View style={[styles.dayBarFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: isOver ? colors.destructive : colors.primary }]} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="calendar" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No history yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                  Start logging meals to see your history
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* AI Logs tab */}
            {aiStats && (
              <View style={[styles.aiStatsBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.aiStatItem}>
                  <Text style={[styles.aiStatVal, { color: colors.primary }]}>{aiStats.total}</Text>
                  <Text style={[styles.aiStatLabel, { color: colors.mutedForeground }]}>Total Scans</Text>
                </View>
                <View style={[styles.aiStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.aiStatItem}>
                  <Text style={[styles.aiStatVal, { color: colors.protein }]}>{Math.round(aiStats.avgConf * 100)}%</Text>
                  <Text style={[styles.aiStatLabel, { color: colors.mutedForeground }]}>Avg Confidence</Text>
                </View>
                <View style={[styles.aiStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.aiStatItem}>
                  <Text style={[styles.aiStatVal, { color: colors.carbs }]}>{Math.round(aiStats.avgTime)}ms</Text>
                  <Text style={[styles.aiStatLabel, { color: colors.mutedForeground }]}>Avg Response</Text>
                </View>
                <View style={[styles.aiStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.aiStatItem}>
                  <Text style={[styles.aiStatVal, { color: colors.fat }]}>{aiStats.saved}</Text>
                  <Text style={[styles.aiStatLabel, { color: colors.mutedForeground }]}>Saved</Text>
                </View>
              </View>
            )}

            {aiLogs.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 }]}>
                <Feather name="cpu" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No AI scans yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                  Scan food in the Scan tab — every AI analysis is logged here
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.aiLogsHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                    All Scans ({aiLogs.length})
                  </Text>
                  <TouchableOpacity onPress={handleClearLogs} style={styles.clearBtn}>
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                    <Text style={[styles.clearBtnText, { color: colors.destructive }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {aiLogs.map((log) => (
                  <AILogCard key={log.id} log={log} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 12 },
  segControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  segBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 24 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  statVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statUnit: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  activeBannerText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  dayInfo: { gap: 2 },
  dayLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dayEntries: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dayRight: { alignItems: "flex-end", gap: 4 },
  dayCal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  dayCalLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -4 },
  dayBar: { width: 80, height: 4, borderRadius: 2, overflow: "hidden" },
  dayBarFill: { height: "100%", borderRadius: 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
  aiStatsBanner: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  aiStatItem: { flex: 1, alignItems: "center", gap: 4 },
  aiStatDivider: { width: 1, height: 36 },
  aiStatVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  aiStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  aiLogsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  clearBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  aiCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  aiCardTop: { flexDirection: "row", gap: 12 },
  aiThumb: { width: 52, height: 52, borderRadius: 10 },
  aiThumbPlaceholder: { width: 52, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  aiCardInfo: { flex: 1, gap: 3 },
  aiCardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  aiCardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  confText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  aiCardTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  aiCardServing: { fontSize: 11, fontFamily: "Inter_400Regular" },
  aiMacroRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiMacroItem: { alignItems: "center", flex: 1 },
  aiMacroVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  aiMacroLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  aiDiaryBadge: { flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 4 },
  aiDiaryText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  aiNotes: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, fontStyle: "italic" },
  aiIngredients: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
