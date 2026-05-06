export const loadState = (key, fallback) => {
  try {
    const v = localStorage.getItem('netra_' + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export const saveState = (key, val) => {
  try {
    localStorage.setItem('netra_' + key, JSON.stringify(val));
  } catch { }
};
