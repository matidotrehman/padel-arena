// Light/dark theme, persisted per device. Default: light (courtside daylight).
const KEY = 'padel_theme';

export function initialTheme() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
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
