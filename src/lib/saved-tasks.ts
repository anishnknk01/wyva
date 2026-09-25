// Lightweight client-side "saved tasks" bookmarking. There's no saved_tasks
// table in the database yet, so this persists to localStorage per-browser.
// If this needs to sync across devices later, add a `saved_tasks` table
// (user_id, task_id) and swap this module's internals for Supabase calls
// without changing the public API below.

const STORAGE_KEY = "wysa:saved-task-ids";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("wysa:saved-tasks-changed"));
}

export function getSavedTaskIds(): string[] {
  return readIds();
}

export function isTaskSaved(taskId: string): boolean {
  return readIds().includes(taskId);
}

export function toggleSavedTask(taskId: string): boolean {
  const ids = readIds();
  const isSaved = ids.includes(taskId);
  const next = isSaved ? ids.filter((id) => id !== taskId) : [...ids, taskId];
  writeIds(next);
  return !isSaved;
}
