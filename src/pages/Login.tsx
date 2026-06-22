import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { getAuthToken, loginWithGoogle } from "@/lib/dishyApi";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const completeLogin = useCallback(async (idToken: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      await loginWithGoogle(idToken);
      navigate(from, { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Google login failed.");
    } finally {
      setIsLoading(false);
    }
  }, [from, navigate]);

  useEffect(() => {
    if (!googleClientId) {
      setError("Missing VITE_GOOGLE_CLIENT_ID. Add it to .env to enable Google sign in.");
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        setError("Google Identity Services did not load. Check network access or ad blocker settings.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response.credential) void completeLogin(response.credential);
          else setError("Google did not return an ID token.");
        },
      });

      setIsGoogleReady(true);
      setError(undefined);

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          width: googleButtonRef.current.clientWidth || 320,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript ?? document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => setError("Google Identity Services failed to load.");
    if (!existingScript) document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [completeLogin, googleClientId]);

  useEffect(() => {
    if (!isGoogleReady || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) return;
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) void completeLogin(response.credential);
        else setError("Google did not return an ID token.");
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      width: googleButtonRef.current.clientWidth || 320,
    });
  }, [completeLogin, googleClientId, isGoogleReady]);

  const handleGoogleLogin = () => {
    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.prompt();
      return;
    }

    setError("Google sign in is not ready yet. Try again in a moment.");
  };

  if (getAuthToken()) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="app-shell bg-background">
      <div className="flex min-h-screen flex-col px-6 pb-10 pt-14">
        <div className="mb-12 flex items-center justify-between">
          <p className="font-display text-2xl font-bold text-foreground">DishyLen</p>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck size={20} className="text-primary" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="flex flex-1 flex-col justify-center"
        >
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground">Sign in to save your dish history</h1>
            <p className="max-w-[310px] text-sm leading-6 text-muted-foreground">
              Keep scanned menus, dish lookups, and summaries available across sessions on this device.
            </p>
          </div>

          <div className="mt-10">
            <div ref={googleButtonRef} className="flex min-h-14 w-full items-center justify-center" />
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || !googleClientId}
              className="mt-3 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Chrome size={18} />}
              Continue with Google
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
