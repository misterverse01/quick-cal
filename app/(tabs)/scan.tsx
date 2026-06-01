import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useNutrition } from "@/context/NutritionContext";
import { fetch } from "expo/fetch";

interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence: number;
  ingredients?: string[];
  healthNotes?: string;
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addEntry, addAILog } = useNutrition();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const startTimeRef = useRef<number>(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 80;

  async function pickFromCamera() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to scan food.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setAnalysis(null);
      setSaved(false);
      if (asset.base64) analyzeFood(asset.uri, asset.base64);
    }
  }

  async function pickFromLibrary() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setAnalysis(null);
      setSaved(false);
      if (asset.base64) analyzeFood(asset.uri, asset.base64);
    }
  }

  async function analyzeFood(uri: string, base64: string) {
    setLoading(true);
    startTimeRef.current = Date.now();
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const response = await fetch(`https://${domain}/api/ai/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = (await response.json()) as { analysis: FoodAnalysis };
      const result = data.analysis;
      const elapsed = Date.now() - startTimeRef.current;

      setAnalysis(result);

      await addAILog({
        timestamp: Date.now(),
        foodName: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        servingSize: result.servingSize,
        confidence: result.confidence,
        imageUri: uri,
        ingredients: result.ingredients ?? [],
        healthNotes: result.healthNotes,
        addedToDiary: false,
        modelUsed: "gpt-5.2",
        responseTimeMs: elapsed,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Analysis failed", `Could not analyze the image. ${msg}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  async function saveToLog() {
    if (!analysis) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addEntry({
      name: analysis.name,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      imageUri: imageUri ?? undefined,
      servingSize: analysis.servingSize,
      confidence: analysis.confidence,
    });
    setSaved(true);
  }

  function reset() {
    setImageUri(null);
    setAnalysis(null);
    setSaved(false);
    setLoading(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>AI Food Scanner</Text>
        <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
          Photograph your meal for instant nutritional breakdown
        </Text>

        <View style={[styles.imageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.foodImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="camera" size={48} color={colors.mutedForeground} />
              <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                No image yet
              </Text>
            </View>
          )}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: "#fff" }]}>
                Analyzing with AI...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={pickFromCamera}
            activeOpacity={0.8}
          >
            <Feather name="camera" size={20} color={colors.primaryForeground} />
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={pickFromLibrary}
            activeOpacity={0.8}
          >
            <Feather name="image" size={20} color={colors.foreground} />
            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Library</Text>
          </TouchableOpacity>
        </View>

        {analysis && !loading && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleRow}>
                <Text style={[styles.foodName, { color: colors.foreground }]}>{analysis.name}</Text>
                <View style={[styles.confidenceBadge, {
                  backgroundColor: analysis.confidence >= 0.8 ? colors.primary + "20" : colors.carbs + "20"
                }]}>
                  <Text style={[styles.confidenceText, {
                    color: analysis.confidence >= 0.8 ? colors.primary : colors.carbs
                  }]}>
                    {Math.round(analysis.confidence * 100)}% match
                  </Text>
                </View>
              </View>
              <Text style={[styles.servingText, { color: colors.mutedForeground }]}>
                {analysis.servingSize}
              </Text>
            </View>

            <View style={[styles.calorieHighlight, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.calorieBigNum, { color: colors.primary }]}>
                {analysis.calories}
              </Text>
              <Text style={[styles.calorieBigLabel, { color: colors.primary }]}>calories</Text>
            </View>

            <View style={styles.macroGrid}>
              <MacroItem value={analysis.protein} label="Protein" color={colors.protein} />
              <MacroItem value={analysis.carbs} label="Carbs" color={colors.carbs} />
              <MacroItem value={analysis.fat} label="Fat" color={colors.fat} />
            </View>

            {analysis.ingredients && analysis.ingredients.length > 0 && (
              <View style={[styles.ingredientsBox, { backgroundColor: colors.muted }]}>
                <Text style={[styles.ingredientsTitle, { color: colors.foreground }]}>Ingredients</Text>
                <Text style={[styles.ingredientsText, { color: colors.mutedForeground }]}>
                  {analysis.ingredients.join(", ")}
                </Text>
              </View>
            )}

            {analysis.healthNotes ? (
              <View style={[styles.noteBox, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
                <Feather name="info" size={14} color={colors.secondaryForeground} />
                <Text style={[styles.noteText, { color: colors.secondaryForeground }]}>
                  {analysis.healthNotes}
                </Text>
              </View>
            ) : null}

            {saved ? (
              <View style={[styles.savedRow, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="check-circle" size={18} color={colors.primary} />
                <Text style={[styles.savedText, { color: colors.primary }]}>Added to diary</Text>
                <TouchableOpacity onPress={reset} style={styles.scanAgainBtn}>
                  <Text style={[styles.scanAgainText, { color: colors.mutedForeground }]}>Scan again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={saveToLog}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={18} color={colors.primaryForeground} />
                <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                  Add to Diary
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MacroItem({ value, label, color }: { value: number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.macroItem, { backgroundColor: color + "12" }]}>
      <Text style={[styles.macroVal, { color }]}>{Math.round(value)}g</Text>
      <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
  screenSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20, lineHeight: 20 },
  imageContainer: {
    height: 240,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  foodImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  placeholderText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  analyzingText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  resultCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16, marginBottom: 20 },
  resultHeader: { gap: 4 },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  foodName: { fontSize: 20, fontFamily: "Inter_700Bold", flex: 1 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  confidenceText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  servingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  calorieHighlight: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 6,
  },
  calorieBigNum: { fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 52 },
  calorieBigLabel: { fontSize: 16, fontFamily: "Inter_500Medium" },
  macroGrid: { flexDirection: "row", gap: 10 },
  macroItem: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, gap: 4 },
  macroVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  macroLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ingredientsBox: { padding: 12, borderRadius: 12, gap: 6 },
  ingredientsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  ingredientsText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  noteBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  noteText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  savedText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scanAgainBtn: { marginLeft: 8 },
  scanAgainText: { fontSize: 13, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
});
