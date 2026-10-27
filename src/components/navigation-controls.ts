import type { MouseEvent } from "react";

export type NavigationControls = {
  railOpen: boolean;
  sidebarOpen: boolean;
  selectTab: (to: string) => void;
  toggleRail: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export function selectNavigationTab(
  event: MouseEvent<HTMLAnchorElement>,
  to: string,
  navigation?: NavigationControls,
) {
  if (
    !navigation ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  navigation.selectTab(to);
}
