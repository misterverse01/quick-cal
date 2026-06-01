import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useNutrition, Goals } from "@/context/NutritionContext";

interface GoalFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  color: string;
  icon: string;
}

function GoalField({ label, value, onChange, unit, color, icon }: GoalFieldProps) {
  const colors = useColors();
  return (
    <View style={[styles.goalField, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.goalIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.goalInfo}>
        <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <View style={styles.goalInputRow}>
          <TextInput
            style={[styles.goalInput, { color: colors.foreground }]}
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={[styles.goalUnit, { color: colors.mutedForeground }]}>{unit}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, updateGoals, streak, todayEntries, dailyLogs } = useNutrition();

  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.protein));
  const [carbs, setCarbs] = useState(String(goals.carbs));
  const [fat, setFat] = useState(String(goals.fat));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCalories(String(goals.calories));
    setProtein(String(goals.protein));
    setCarbs(String(goals.carbs));
    setFat(String(goals.fat));
  }, [goals]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  async function handleSave() {
    const c = Number(calories);
    const p = Number(protein);
    const cb = Number(carbs);
    const f = Number(fat);
    if ([c, p, cb, f].some((v) => isNaN(v) || v <= 0)) {
      Alert.alert("Invalid values", "Please enter valid positive numbers for all goals.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateGoals({ calories: c, protein: p, carbs: cb, fat: f });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalEntries = dailyLogs.reduce((s, l) => s + l.entries.length, 0);
  const totalDays = dailyLogs.filter((l) => l.entries.length > 0).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Goals & Profile</Text>
        <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
          Customize your daily nutrition targets
        </Text>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statsItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={20} color={colors.streakActive} />
            <Text style={[styles.statsNum, { color: colors.foreground }]}>{streak}</Text>
            <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>Day Streak</Text>
          </View>
          <View style={[styles.statsItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={20} color={colors.protein} />
            <Text style={[styles.statsNum, { color: colors.foreground }]}>{totalDays}</Text>
            <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>Days Logged</Text>
          </View>
          <View style={[styles.statsItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="list" size={20} color={colors.carbs} />
            <Text style={[styles.statsNum, { color: colors.foreground }]}>{totalEntries}</Text>
            <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>Total Meals</Text>
          </View>
        </View>

        {/* Goals */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Goals</Text>

        <GoalField
          label="Calories"
          value={calories}
          onChange={setCalories}
          unit="kcal"
          color={colors.primary}
          icon="target"
        />
        <GoalField
          label="Protein"
          value={protein}
          onChange={setProtein}
          unit="g"
          color={colors.protein}
          icon="activity"
        />
        <GoalField
          label="Carbohydrates"
          value={carbs}
          onChange={setCarbs}
          unit="g"
          color={colors.carbs}
          icon="layers"
        />
        <GoalField
          label="Fat"
          value={fat}
          onChange={setFat}
          unit="g"
          color={colors.fat}
          icon="droplet"
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saved ? colors.primary + "AA" : colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {saved ? (
            <>
              <Feather name="check" size={18} color={colors.primaryForeground} />
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Saved!</Text>
            </>
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Goals</Text>
          )}
        </TouchableOpacity>

        {/* Macro targets info */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>About Your Targets</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            The recommended daily calorie intake varies by age, weight, height, and activity level. Consult a healthcare professional for personalized guidance.
          </Text>
          <View style={styles.infoMacros}>
            <View style={styles.infoMacroItem}>
              <Text style={[styles.infoMacroLabel, { color: colors.protein }]}>Protein</Text>
              <Text style={[styles.infoMacroVal, { color: colors.mutedForeground }]}>4 kcal/g</Text>
            </View>
            <View style={styles.infoMacroItem}>
              <Text style={[styles.infoMacroLabel, { color: colors.carbs }]}>Carbs</Text>
              <Text style={[styles.infoMacroVal, { color: colors.mutedForeground }]}>4 kcal/g</Text>
            </View>
            <View style={styles.infoMacroItem}>
              <Text style={[styles.infoMacroLabel, { color: colors.fat }]}>Fat</Text>
              <Text style={[styles.infoMacroVal, { color: colors.mutedForeground }]}>9 kcal/g</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
  screenSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statsItem: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statsNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statsLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  goalField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    marginBottom: 10,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  goalInputRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  goalInput: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    padding: 0,
    minWidth: 60,
  },
  goalUnit: { fontSize: 14, fontFamily: "Inter_400Regular" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  infoMacros: { flexDirection: "row", gap: 16, marginTop: 4 },
  infoMacroItem: { gap: 2 },
  infoMacroLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoMacroVal: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
