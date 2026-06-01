import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { MacroEntry } from "@/context/NutritionContext";

interface FoodCardProps {
  entry: MacroEntry;
  onDelete: (id: string) => void;
}

export function FoodCard({ entry, onDelete }: FoodCardProps) {
  const colors = useColors();

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Remove food?", entry.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onDelete(entry.id),
      },
    ]);
  }

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {entry.imageUri ? (
        <Image source={{ uri: entry.imageUri }} style={styles.foodImage} />
      ) : (
        <View style={[styles.foodImagePlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="image" size={20} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{time}</Text>
        </View>
        {entry.servingSize ? (
          <Text style={[styles.serving, { color: colors.mutedForeground }]}>{entry.servingSize}</Text>
        ) : null}
        <View style={styles.macros}>
          <MacroPill value={entry.calories} label="kcal" color={colors.primary} bold />
          <MacroPill value={entry.protein} label="P" color={colors.protein} />
          <MacroPill value={entry.carbs} label="C" color={colors.carbs} />
          <MacroPill value={entry.fat} label="F" color={colors.fat} />
        </View>
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={10}>
        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

function MacroPill({
  value,
  label,
  color,
  bold,
}: {
  value: number;
  label: string;
  color: string;
  bold?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: color + "18" }]}>
      <Text
        style={[
          styles.pillText,
          { color, fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold" },
        ]}
      >
        {Math.round(value)}
        <Text style={[styles.pillLabel, { color }]}>{label}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  foodImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  foodImagePlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  serving: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  macros: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  pillLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    padding: 4,
  },
});
