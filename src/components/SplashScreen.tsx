import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 400);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-2xl bg-card shadow-lg flex items-center justify-center relative"
        >
          <span className="text-4xl">🍴</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse-dot" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">DishyLen</h1>
          <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2 uppercase">The Culinary Laboratory</p>
        </motion.div>
      </div>

      <div className="w-full max-w-[200px] mb-16 space-y-3">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <FlaskConical size={14} />
          <span className="text-xs tracking-[0.15em] uppercase">Analyzing Ingredients</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
