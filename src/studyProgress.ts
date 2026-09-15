export interface StudyProgressEntry {
  id: string;
  planId: string;
  day: number;
  completedAt: number;
}

export interface StudyProgressState {
  version: 1;
  entries: StudyProgressEntry[];
}

export const STUDY_PROGRESS_STORAGE_KEY = 'study-progress-v1';

export const emptyStudyProgress = (): StudyProgressState => ({
  version: 1,
  entries: [],
});

export const readStudyProgress = (): StudyProgressState => {
  try {
    const raw = localStorage.getItem(STUDY_PROGRESS_STORAGE_KEY);
    if (!raw) return emptyStudyProgress();
    const parsed = JSON.parse(raw) as Partial<StudyProgressState>;
    if (!Array.isArray(parsed.entries)) return emptyStudyProgress();
    const entries = parsed.entries.filter(
      (entry): entry is StudyProgressEntry => Boolean(
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.planId === 'string' &&
        Number.isInteger(entry.day) &&
        entry.day > 0 &&
        typeof entry.completedAt === 'number'
      )
    );
    return { version: 1, entries };
  } catch {
    return emptyStudyProgress();
  }
};

export const writeStudyProgress = (state: StudyProgressState) => {
  localStorage.setItem(STUDY_PROGRESS_STORAGE_KEY, JSON.stringify(state));
};

export const isStudyDayCompleted = (state: StudyProgressState, planId: string, day: number) =>
  state.entries.some(entry => entry.planId === planId && entry.day === day);

export const toggleStudyDay = (state: StudyProgressState, planId: string, day: number): StudyProgressState => {
  const existing = state.entries.find(entry => entry.planId === planId && entry.day === day);
  if (existing) {
    return {
      version: 1,
      entries: state.entries.filter(entry => entry.id !== existing.id),
    };
  }

  return {
    version: 1,
    entries: [
      ...state.entries,
      {
        id: `${planId}:${day}`,
        planId,
        day,
        completedAt: Date.now(),
      },
    ],
  };
};

export const getStudyPlanProgress = (state: StudyProgressState, planId: string, totalDays: number) => {
  const safeTotal = Math.max(1, totalDays);
  const completedDays = state.entries.filter(entry => entry.planId === planId).length;
  return {
    completedDays: Math.min(completedDays, safeTotal),
    progress: Math.min(100, Math.round((completedDays / safeTotal) * 100)),
  };
};
