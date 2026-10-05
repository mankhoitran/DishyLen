import { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { motion } from "framer-motion";
import { getAuthToken, loginAsGuest, loginWithEmail } from "@/lib/dishyApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  let from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
  if (from === "/login") from = "/";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);
    try {
      await loginWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      await loginAsGuest();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest login failed.");
    } finally {
      setIsLoading(false);
    }
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

          <form onSubmit={handleEmailLogin} className="mt-10 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <User size={18} />}
              Continue as Guest
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
