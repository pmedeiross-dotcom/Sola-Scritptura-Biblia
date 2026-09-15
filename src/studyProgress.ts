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

const normalizeEntries = (entries: unknown[]): StudyProgressEntry[] => {
  const seen = new Set<string>();
  const normalized: StudyProgressEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<StudyProgressEntry>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.planId !== 'string' ||
      !candidate.planId.trim() ||
      !Number.isInteger(candidate.day) ||
      candidate.day < 1 ||
      typeof candidate.completedAt !== 'number' ||
      !Number.isFinite(candidate.completedAt)
    ) {
      continue;
    }

    const key = `${candidate.planId}:${candidate.day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      id: key,
      planId: candidate.planId,
      day: candidate.day,
      completedAt: candidate.completedAt,
    });
  }

  return normalized;
};

export const readStudyProgress = (): StudyProgressState => {
  try {
    const raw = localStorage.getItem(STUDY_PROGRESS_STORAGE_KEY);
    if (!raw) return emptyStudyProgress();
    const parsed = JSON.parse(raw) as Partial<StudyProgressState>;
    if (!Array.isArray(parsed.entries)) return emptyStudyProgress();
    return { version: 1, entries: normalizeEntries(parsed.entries) };
  } catch {
    return emptyStudyProgress();
  }
};

export const writeStudyProgress = (state: StudyProgressState) => {
  const entries = normalizeEntries(state.entries);
  localStorage.setItem(STUDY_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, entries }));
};

export const isStudyDayCompleted = (state: StudyProgressState, planId: string, day: number) =>
  state.entries.some(entry => entry.planId === planId && entry.day === day);

export const toggleStudyDay = (state: StudyProgressState, planId: string, day: number): StudyProgressState => {
  const existing = state.entries.find(entry => entry.planId === planId && entry.day === day);
  if (existing) {
    return {
      version: 1,
      entries: state.entries.filter(entry => entry.planId !== planId || entry.day !== day),
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
  const completedDays = new Set(
    state.entries
      .filter(entry => entry.planId === planId)
      .map(entry => entry.day)
  ).size;
  return {
    completedDays: Math.min(completedDays, safeTotal),
    progress: Math.min(100, Math.round((completedDays / safeTotal) * 100)),
  };
};
