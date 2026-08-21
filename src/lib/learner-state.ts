import { useCallback, useEffect, useState } from "react";
import { topics, lessons, type Depth } from "@/lib/curriculum";

export type AttemptLog = {
  lessonId: string;
  correct: boolean;
  at: number;
};

export type LearnerState = {
  mastery: Record<string, number>;
  xp: number;
  activeLessonId: string;
  depthOverride: Depth | null;
  attempts: AttemptLog[];
  completed: string[];
};

const STORAGE_KEY = "logiclore.learner.v1";

const defaultState: LearnerState = {
  mastery: { ds: 42, algo: 18, os: 8 },
  xp: 120,
  activeLessonId: lessons[0]!.id,
  depthOverride: null,
  attempts: [],
  completed: [],
};

function read(): LearnerState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<LearnerState>;
    return {
      ...defaultState,
      ...parsed,
      mastery: { ...defaultState.mastery, ...(parsed.mastery ?? {}) },
    };
  } catch {
    return defaultState;
  }
}

export function useLearnerState() {
  const [state, setState] = useState<LearnerState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: LearnerState) => LearnerState) => {
    setState((prev) => {
      const next = updater(prev);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const setActiveLesson = useCallback(
    (lessonId: string) => update((p) => ({ ...p, activeLessonId: lessonId, depthOverride: null })),
    [update],
  );

  const setDepthOverride = useCallback(
    (depth: Depth | null) => update((p) => ({ ...p, depthOverride: depth })),
    [update],
  );

  const recordAttempt = useCallback(
    (lessonId: string, topicId: string, correct: boolean) =>
      update((prev) => {
        const current = prev.mastery[topicId] ?? 0;
        const delta = correct ? Math.max(6, Math.round((100 - current) * 0.28)) : -Math.min(current, 7);
        const nextMastery = Math.max(0, Math.min(100, current + delta));
        return {
          ...prev,
          mastery: { ...prev.mastery, [topicId]: nextMastery },
          xp: prev.xp + (correct ? 50 : 10),
          attempts: [...prev.attempts, { lessonId, correct, at: Date.now() }].slice(-40),
          completed: correct && !prev.completed.includes(lessonId) ? [...prev.completed, lessonId] : prev.completed,
        };
      }),
    [update],
  );

  const reset = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  }, []);

  return { state, hydrated, setActiveLesson, setDepthOverride, recordAttempt, reset };
}

export function weakestTopic(mastery: Record<string, number>) {
  return [...topics].sort((a, b) => (mastery[a.id] ?? 0) - (mastery[b.id] ?? 0))[0]!;
}

export function recommendedLesson(state: LearnerState) {
  const weak = weakestTopic(state.mastery);
  return lessons.find((l) => l.topicId === weak.id && !state.completed.includes(l.id))
    ?? lessons.find((l) => !state.completed.includes(l.id))
    ?? lessons[0]!;
}

export function knowledgeSummary(state: LearnerState) {
  const parts = topics.map((t) => `${t.name}: ${Math.round(state.mastery[t.id] ?? 0)}% mastery`);
  const recent = state.attempts.slice(-5).map((a) => `${a.lessonId}:${a.correct ? "correct" : "incorrect"}`);
  return `Knowledge state — ${parts.join("; ")}. XP ${state.xp}. Recent attempts: ${
    recent.length ? recent.join(", ") : "none yet"
  }.`;
}
