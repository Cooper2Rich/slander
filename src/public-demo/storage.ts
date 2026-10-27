// Paths on GitHub Pages share an origin, so the working preview must not read
// or migrate the main/John browser workspace, role, giving or uploaded media.
export function previewStorageKey(
  key: string,
  base = import.meta.env?.BASE_URL || "/",
) {
  return `${base === "/slander/working/" ? "working:" : ""}${key}`;
}

export const browserStorage = {
  getItem(key: string) {
    return localStorage.getItem(previewStorageKey(key));
  },
  setItem(key: string, value: string) {
    localStorage.setItem(previewStorageKey(key), value);
  },
};
