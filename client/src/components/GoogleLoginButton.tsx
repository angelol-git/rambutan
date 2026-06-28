import { useState, useEffect, useRef } from "react";

const GOOGLE_BUTTON_WIDTH = 260;
const GOOGLE_BUTTON_HEIGHT = 48;

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleLoginButtonProps = {
  onSuccess: (response: GoogleCredentialResponse) => void | Promise<void>;
};
function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientID,
          callback: onSuccess,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin",
          shape: "rectangular",
          width: GOOGLE_BUTTON_WIDTH,
        });

        setIsLoading(false);
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-client-script";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess, clientID]);

  return (
    <div className="flex w-full min-w-0 justify-center">
      <div
        className="relative max-w-full overflow-hidden rounded-sm"
        style={{
          width: `${GOOGLE_BUTTON_WIDTH}px`,
          height: `${GOOGLE_BUTTON_HEIGHT}px`,
        }}
      >
        <div
          className={`absolute inset-0 flex items-center rounded-sm border border-[#dadce0] bg-white px-3 text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,0.15)] ${
            isLoading ? "opacity-65" : "opacity-100"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 18 18"
            className="h-[18px] w-[18px] shrink-0"
          >
            <path
              fill="#4285F4"
              d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7973 2.7155v2.2582h2.9082c1.7018-1.5664 2.6855-3.8741 2.6855-6.6146Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.4673-.8064 5.9564-2.1809l-2.9082-2.2582c-.8063.54-1.8364.8591-3.0482.8591-2.3441 0-4.3282-1.5832-5.0364-3.7091H.9573v2.3327C2.4382 15.9836 5.4818 18 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.9636 10.7109A5.4108 5.4108 0 0 1 3.6818 9c0-.5932.1023-1.1682.2818-1.7109V4.9564H.9573A8.9974 8.9974 0 0 0 0 9c0 1.4523.3482 2.8273.9573 4.0436l3.0063-2.3327Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3455l2.5818-2.5818C13.4636.8918 11.4268 0 9 0 5.4818 0 2.4382 2.0164.9573 4.9564l3.0063 2.3327C4.6718 5.1627 6.6559 3.5795 9 3.5795Z"
            />
          </svg>
          <span className="ml-3 text-sm leading-none font-medium">
            Continue with Google
          </span>
        </div>
        {/*
         * TODO: Currently overlaying a custom html button over the official google button
         * Would need to rewrite backend to remove this
         */}
        <div
          ref={buttonRef}
          className={`absolute inset-0 ${
            isLoading ? "opacity-0" : "opacity-[0.01]"
          }`}
        />
      </div>
    </div>
  );
}

export default GoogleLoginButton;
