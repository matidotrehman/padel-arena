// Light/dark theme, persisted per device. Default: dark (premium night-court look).
const KEY = 'padel_theme';

export function initialTheme() {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  const el = document.documentElement;
  el.classList.remove('light', 'dark');
  el.classList.add(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}
