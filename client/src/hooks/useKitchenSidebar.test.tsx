import { renderHook, act, waitFor } from "@testing-library/react";
import { useKitchenSidebar } from "./useKitchenSidebar";

describe("useKitchenSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("restores the saved sidebar state after user loading finishes", async () => {
    localStorage.setItem("recipe-is-sidebar-open-user-1", JSON.stringify(true));

    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    const { result, rerender } = renderHook(
      ({ isUserLoading }) => useKitchenSidebar(user, false, isUserLoading),
      {
        initialProps: { isUserLoading: true },
      },
    );

    expect(result.current.isSidebarHydrated).toBe(false);
    expect(result.current.isSideBarOpen).toBe(true);

    rerender({ isUserLoading: false });

    await waitFor(() => {
      expect(result.current.isSidebarHydrated).toBe(true);
      expect(result.current.isSideBarOpen).toBe(true);
    });
  });

  it("mobile always forces the sidebar closed", async () => {
    localStorage.setItem("recipe-is-sidebar-open-user-1", JSON.stringify(true));

    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    const { result } = renderHook(() => useKitchenSidebar(user, false, false));

    await waitFor(() => {
      expect(result.current.isSidebarHydrated).toBe(true);
      expect(result.current.isSideBarOpen).toBe(true);
    });
  });

  it("persists the sidebar to logged in users storage key", async () => {
    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    const { result } = renderHook(() => useKitchenSidebar(user, false, false));

    await waitFor(() => {
      expect(result.current.isSidebarHydrated).toBe(true);
    });

    act(() => {
      result.current.setIsSideBarOpen(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem("recipe-is-sidebar-open-user-1")).toBe(
        "true",
      );
    });

    act(() => {
      result.current.setIsSideBarOpen(false);
    });

    await waitFor(() => {
      expect(localStorage.getItem("recipe-is-sidebar-open-user-1")).toBe(
        "false",
      );
    });
  });

  it("persists the sidebar to guest users storage key", async () => {
    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    const { result } = renderHook(() => useKitchenSidebar(null, false, false));

    await waitFor(() => {
      expect(result.current.isSidebarHydrated).toBe(true);
    });

    act(() => {
      result.current.setIsSideBarOpen(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem("recipe-is-sidebar-open-guest")).toBe("true");
    });

    act(() => {
      result.current.setIsSideBarOpen(false);
    });

    await waitFor(() => {
      expect(localStorage.getItem("recipe-is-sidebar-open-guest")).toBe(
        "false",
      );
    });
  });

  it("falls back to a closed sidebar when stored JSON is invalid", async () => {
    localStorage.setItem("recipe-is-sidebar-open-user-1", "{invalid-json}");
    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    const { result } = renderHook(() => useKitchenSidebar(user, false, false));

    await waitFor(() => {
      expect(result.current.isSideBarOpen).toBe(false);
      expect(result.current.isSidebarHydrated).toBe(true);
    });
  });
});
