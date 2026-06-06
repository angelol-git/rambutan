import { useState, useEffect } from "react";
import { User } from "../types/user";

function getStoredSidebarState(userId: User["id"]) {
  const id = userId || "guest";
  try {
    const stored = localStorage.getItem(`recipe-is-sidebar-open-${id}`);
    return stored !== null ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
}

export function useKitchenSidebar(
  user: User | null,
  isMobile: boolean,
  isUserLoading: boolean,
) {
  const userId = user?.id || "guest";
  const [isSidebarHydrated, setIsSidebarHydrated] = useState(false);

  const [isSideBarOpen, setIsSideBarOpen] = useState(() => {
    if (isMobile) return false;
    return getStoredSidebarState(userId);
  });

  useEffect(() => {
    if (isMobile) {
      setIsSideBarOpen(false);
      setIsSidebarHydrated(true);
      return;
    }

    if (isUserLoading) {
      setIsSidebarHydrated(false);
      return;
    }

    setIsSideBarOpen(getStoredSidebarState(userId));
    setIsSidebarHydrated(true);
  }, [userId, isMobile, isUserLoading]);

  useEffect(() => {
    if (isMobile || !isSidebarHydrated) {
      return;
    }

    localStorage.setItem(
      `recipe-is-sidebar-open-${userId}`,
      JSON.stringify(isSideBarOpen),
    );
  }, [isSideBarOpen, userId, isMobile, isSidebarHydrated]);

  return { isSideBarOpen, setIsSideBarOpen, isSidebarHydrated };
}
