import { useState, useEffect } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import UserOptionsPortal from "./UserOptionsPortal";
import API_BASE_URL from "../config/api.js";
import { useToast } from "../hooks/useToast";
import type { User } from "../types/user";

type GoogleLoginSuccess = {
  credential: string;
};

type UserOptionsProps = {
  user: User | null;
  logout: UseMutationResult<unknown, Error, void, unknown>;
};

function UserOptions({ user, logout }: UserOptionsProps) {
  const [isUserOptionsOpen, setIsUserOptionsOpen] = useState(false);
  const { showToast } = useToast();

  async function handleSuccess(response: GoogleLoginSuccess) {
    try {
      const result = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
        credentials: "include",
      });

      if (result.ok) {
        window.location.reload();
      } else {
        showToast("Login failed. Please try again.", "error");
      }
    } catch {
      showToast("Login failed. Please try again.", "error");
    }
  }

  //TO DO: move this and apply to other portals/modals
  useEffect(() => {
    if (!isUserOptionsOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserOptionsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserOptionsOpen]);

  return (
    <>
      <button
        id="profileMenuButton"
        aria-haspopup="dialog"
        aria-expanded={isUserOptionsOpen}
        aria-label={user ? "Open user menu" : "Open sign in menu"}
        className={`interactive-mono text-secondary hover:text-primary focus-visible:ring-accent/25 inline-flex cursor-pointer items-center justify-center rounded-full py-2 text-sm tracking-[0.08em] uppercase transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none ${
          isUserOptionsOpen ? "text-primary" : ""
        }`}
        onClick={() => {
          setIsUserOptionsOpen((prev) => !prev);
        }}
      >
        {user ? "Log out" : "Sign in"}
      </button>

      {isUserOptionsOpen && (
        <UserOptionsPortal
          user={user}
          logout={logout}
          onClose={() => {
            setIsUserOptionsOpen(false);
          }}
          onLoginSuccess={handleSuccess}
        />
      )}
    </>
  );
}
export default UserOptions;
