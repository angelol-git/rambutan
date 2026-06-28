import { createPortal } from "react-dom";
import type { UseMutationResult } from "@tanstack/react-query";
import GoogleLoginButton from "./GoogleLoginButton";
import type { User } from "../types/user";

type GoogleLoginSuccess = {
  credential: string;
};

type UserOptionsPortalProps = {
  user: User | null;
  logout: UseMutationResult<unknown, Error, void, unknown>;
  onClose: () => void;
  onLoginSuccess: (response: GoogleLoginSuccess) => Promise<void>;
};

function UserOptionsPortal({
  user,
  logout,
  onClose,
  onLoginSuccess,
}: UserOptionsPortalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/20 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div className="fixed inset-0 flex items-end justify-center lg:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profileMenuButton"
          className={`border-primary/18 bg-base text-primary flex w-full transform flex-col overflow-hidden rounded-t-[1rem] border shadow-lg transition-transform duration-300 ease-out lg:max-w-[24rem] lg:rounded-[1rem] ${
            user ? "gap-2" : "gap-4"
          } px-4 pt-5 pb-5`}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {user ? (
            <>
              <div className="flex flex-col gap-2 px-2 pt-1 pb-2">
                <p className="font-ibm-plex-mono text-secondary/85 text-[11px] tracking-[0.12em] uppercase">
                  Signed in as
                </p>
                <p
                  className="font-lora text-primary truncate text-lg leading-tight"
                  title={user.name || user.email}
                >
                  {user.name || user.email}
                </p>
              </div>
              <div className="border-primary/10 border-t p-2">
                <button
                  onClick={() => {
                    logout.mutate(undefined, {
                      onSuccess: () => {
                        onClose();
                      },
                    });
                  }}
                  className="text-primary focus-visible:ring-accent/25 interactive-mono flex w-full cursor-pointer items-center justify-end py-2 text-left text-sm tracking-[0.08em] uppercase transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div>Log out</div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="font-lora text-primary text-lg leading-tight font-medium">
                  Sign in to save your recipes
                </p>
              </div>
              <div className="w-full rounded-2xl">
                <GoogleLoginButton onSuccess={onLoginSuccess} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default UserOptionsPortal;
