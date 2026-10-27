export type PublicArea = "home" | "discover" | "leaders" | "profile";

export function publicArea(pathname: string): PublicArea {
  if (pathname === "/") return "home";
  if (pathname === "/leaderboard") return "leaders";
  if (pathname === "/viewer") return "profile";
  return "discover";
}

export const publicAreaNames: Record<PublicArea, string> = {
  home: "Home",
  discover: "Discover",
  leaders: "Leaders",
  profile: "Profile",
};
