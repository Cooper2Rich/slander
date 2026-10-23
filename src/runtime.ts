export const PUBLIC_DEMO = import.meta.env.MODE === "public";
export const APP_NAME = PUBLIC_DEMO ? "Ripple" : "Slander";
export const demoAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
