import { useEffect, useState } from "react";

const storageKey = "blue-ripple-theme-v1";
type Theme = "ripple" | "acu";

function readTheme(): Theme {
  try {
    return localStorage.getItem(storageKey) === "acu" ? "acu" : "ripple";
  } catch {
    return "ripple";
  }
}

export function initializeTheme() {
  document.body.dataset.theme = readTheme();
}

export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const next = readTheme();
      document.body.dataset.theme = next;
      setTheme(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <label className="theme-picker">
      <span>Theme</span>
      <select
        aria-label="Website theme"
        value={theme}
        onChange={(event) => {
          const next = event.target.value === "acu" ? "acu" : "ripple";
          document.body.dataset.theme = next;
          setTheme(next);
          try {
            localStorage.setItem(storageKey, next);
          } catch {
            // The theme still works for this session when storage is unavailable.
          }
        }}
      >
        <option value="ripple">Blue Ripple</option>
        <option value="acu">Austin Christian</option>
      </select>
    </label>
  );
}
