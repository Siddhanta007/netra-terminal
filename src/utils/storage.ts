export const loadState = <T>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem('netra_' + key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const saveState = (key: string, val: unknown): void => {
  try {
    localStorage.setItem('netra_' + key, JSON.stringify(val));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[storage] Failed to persist key:', key, err);
    }
  }
};
