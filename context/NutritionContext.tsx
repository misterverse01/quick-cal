import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface MacroEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUri?: string;
  timestamp: number;
  servingSize?: string;
  confidence?: number;
}

export interface DailyLog {
  date: string;
  entries: MacroEntry[];
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AILog {
  id: string;
  timestamp: number;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence: number;
  imageUri?: string;
  ingredients: string[];
  healthNotes?: string;
  addedToDiary: boolean;
  modelUsed: string;
  responseTimeMs: number;
}

const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

interface NutritionContextType {
  todayEntries: MacroEntry[];
  dailyLogs: DailyLog[];
  goals: Goals;
  streak: number;
  aiLogs: AILog[];
  addEntry: (entry: Omit<MacroEntry, "id" | "timestamp">) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  updateGoals: (goals: Goals) => Promise<void>;
  addAILog: (log: Omit<AILog, "id">) => Promise<void>;
  clearAILogs: () => Promise<void>;
  getTodayTotals: () => { calories: number; protein: number; carbs: number; fat: number };
  getWeeklyData: () => { date: string; calories: number }[];
}

const NutritionContext = createContext<NutritionContextType | null>(null);

const STORAGE_KEYS = {
  LOGS: "wellcal_logs",
  GOALS: "wellcal_goals",
  AI_LOGS: "wellcal_ai_logs",
};

function todayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

function calcStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const today = todayString();
  const logMap = new Map(logs.map((l) => [l.date, l]));
  const d = new Date();
  const startDate = logMap.get(today)?.entries.length
    ? d
    : (() => { const y = new Date(d); y.setDate(y.getDate() - 1); return y; })();
  const cur = new Date(startDate);
  let streak = 0;
  while (true) {
    const key = cur.toISOString().split("T")[0]!;
    const log = logMap.get(key);
    if (log && log.entries.length > 0) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [streak, setStreak] = useState(0);
  const [aiLogs, setAILogs] = useState<AILog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [logsRaw, goalsRaw, aiLogsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.AI_LOGS),
      ]);
      const logs: DailyLog[] = logsRaw ? JSON.parse(logsRaw) : [];
      const g: Goals = goalsRaw ? JSON.parse(goalsRaw) : DEFAULT_GOALS;
      const al: AILog[] = aiLogsRaw ? JSON.parse(aiLogsRaw) : [];
      setDailyLogs(logs);
      setGoals(g);
      setStreak(calcStreak(logs));
      setAILogs(al);
    } catch {
      // ignore
    }
  }

  const saveLogs = useCallback(async (logs: DailyLog[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    setDailyLogs(logs);
    setStreak(calcStreak(logs));
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<MacroEntry, "id" | "timestamp">) => {
      const today = todayString();
      const newEntry: MacroEntry = {
        ...entry,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      const logs = [...dailyLogs];
      const idx = logs.findIndex((l) => l.date === today);
      if (idx >= 0) {
        logs[idx] = { ...logs[idx]!, entries: [...logs[idx]!.entries, newEntry] };
      } else {
        logs.push({ date: today, entries: [newEntry] });
      }
      await saveLogs(logs);
    },
    [dailyLogs, saveLogs]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const today = todayString();
      const logs = dailyLogs.map((log) =>
        log.date === today
          ? { ...log, entries: log.entries.filter((e) => e.id !== id) }
          : log
      );
      await saveLogs(logs);
    },
    [dailyLogs, saveLogs]
  );

  const updateGoals = useCallback(async (g: Goals) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(g));
    setGoals(g);
  }, []);

  const addAILog = useCallback(async (log: Omit<AILog, "id">) => {
    const newLog: AILog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    const updated = [newLog, ...aiLogs].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEYS.AI_LOGS, JSON.stringify(updated));
    setAILogs(updated);
  }, [aiLogs]);

  const clearAILogs = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AI_LOGS);
    setAILogs([]);
  }, []);

  const getTodayTotals = useCallback(() => {
    const today = todayString();
    const log = dailyLogs.find((l) => l.date === today);
    return (log?.entries ?? []).reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [dailyLogs]);

  const getWeeklyData = useCallback(() => {
    const result: { date: string; calories: number }[] = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const dateStr = day.toISOString().split("T")[0]!;
      const log = dailyLogs.find((l) => l.date === dateStr);
      result.push({
        date: dateStr,
        calories: (log?.entries ?? []).reduce((s, e) => s + e.calories, 0),
      });
    }
    return result;
  }, [dailyLogs]);

  const todayEntries = (() => {
    const today = todayString();
    return dailyLogs.find((l) => l.date === today)?.entries ?? [];
  })();

  return (
    <NutritionContext.Provider
      value={{
        todayEntries,
        dailyLogs,
        goals,
        streak,
        aiLogs,
        addEntry,
        removeEntry,
        updateGoals,
        addAILog,
        clearAILogs,
        getTodayTotals,
        getWeeklyData,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error("useNutrition must be used within NutritionProvider");
  return ctx;
}
