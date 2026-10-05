import { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { getAuthToken, registerWithEmail } from "@/lib/dishyApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  let from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
  if (from === "/register" || from === "/login") from = "/";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setIsLoading(true);
    setError(undefined);
    try {
      await registerWithEmail(email, password, name);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground">Create an account</h1>
            <p className="max-w-[310px] text-sm leading-6 text-muted-foreground">
              Sign up to start tracking your food and menus seamlessly.
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-10 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (Optional)</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Sign up
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
