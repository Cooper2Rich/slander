import { readFileSync } from "node:fs";

export function readSampleMedia(path) {
  return readFileSync(new URL(`../public${path}`, import.meta.url));
}
