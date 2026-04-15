import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=300&fit=crop",
];

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [currentImg, setCurrentImg] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((i) => (i + 1) % FOOD_IMAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 splash-bg">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-28 h-28 rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {FOOD_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="Food"
              className="absolute inset-0 w-full h-full object-cover splash-img-swap"
              style={{ opacity: currentImg === i ? 1 : 0 }}
            />
          ))}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent animate-pulse-dot z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-4xl font-display font-bold text-primary-foreground tracking-tight drop-shadow-lg">
            DishyLen
          </h1>
          <p className="text-xs tracking-[0.3em] text-primary-foreground/70 mt-2 uppercase">
            The Culinary Laboratory
          </p>
        </motion.div>
      </div>

      <div className="w-full max-w-[200px] mb-16 space-y-3">
        <div className="h-1.5 rounded-full bg-primary-foreground/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary-foreground"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-primary-foreground/70">
          <FlaskConical size={14} />
          <span className="text-xs tracking-[0.15em] uppercase">Analyzing Ingredients</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
