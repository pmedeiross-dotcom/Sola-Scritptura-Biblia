export interface ActivityEvent {
  id: string;
  type: string;
  label: string;
  timestamp: number;
}

export const ACTIVITY_STORAGE_KEY = 'activity-events-v1';
export const MAX_ACTIVITY_EVENTS = 200;

const emptyEvents = (): ActivityEvent[] => [];

export const readActivityEvents = (): ActivityEvent[] => {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return emptyEvents();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptyEvents();
    return parsed.filter((event): event is ActivityEvent => Boolean(
      event &&
      typeof event.id === 'string' &&
      typeof event.type === 'string' &&
      typeof event.label === 'string' &&
      typeof event.timestamp === 'number' &&
      Number.isFinite(event.timestamp)
    )).slice(0, MAX_ACTIVITY_EVENTS);
  } catch {
    return emptyEvents();
  }
};

export const isUselessActivityEvent = (event: Pick<ActivityEvent, 'type' | 'label'>) =>
  event.type === 'screen_view' && event.label.trim().toLowerCase() === 'tela: library';

export const appendActivityEvent = (
  events: ActivityEvent[],
  type: string,
  label: string,
): ActivityEvent[] => {
  const normalizedType = type.trim();
  const normalizedLabel = label.trim();
  if (!normalizedType || !normalizedLabel || isUselessActivityEvent({ type: normalizedType, label: normalizedLabel })) {
    return events;
  }

  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: normalizedType,
      label: normalizedLabel,
      timestamp: Date.now(),
    },
    ...events,
  ].slice(0, MAX_ACTIVITY_EVENTS);

  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(next));
  return next;
};
