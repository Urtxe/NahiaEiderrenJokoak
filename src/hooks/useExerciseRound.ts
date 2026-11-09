import { useEffect, useState } from 'react';

const historyLimit = 60;
const memory = new Map<string, string[]>();

function readHistory(key: string): string[] {
  const fallback = memory.get(key);
  if (fallback) return fallback;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (Array.isArray(stored)) return stored.filter((id): id is string => typeof id === 'string').slice(-historyLimit);
  } catch {
    // Rotation still works during this visit if storage is unavailable.
  }
  return [];
}

export function useExerciseRound<T>(
  scope: string,
  createRound: (recent: readonly string[]) => T,
  identify: (round: T) => string[],
): T {
  const [{ round, key, ids }] = useState(() => {
    const key = `nahia-eider-jokoak-exercises:${scope}`;
    const round = createRound(readHistory(key));
    return { round, key, ids: identify(round) };
  });

  useEffect(() => {
    const history = [...new Set([...readHistory(key).filter(id => !ids.includes(id)), ...ids])].slice(-historyLimit);
    try {
      localStorage.setItem(key, JSON.stringify(history));
      memory.delete(key);
    } catch {
      memory.set(key, history);
    }
  }, [key, ids]);

  return round;
}
