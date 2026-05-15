import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Menu, CheckCircle2, Loader2 } from "lucide-react";

const AnalyzingScreen = ({ onDone }: { onDone: () => void }) => {
  const [step1, setStep1] = useState(0);
  const [step2, setStep2] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setStep1((p) => Math.min(p + 3, 100)), 40);
    const t2 = setTimeout(() => {
      const t2i = setInterval(() => setStep2((p) => {
        if (p >= 100) { clearInterval(t2i); setTimeout(onDone, 600); return 100; }
        return p + 2;
      }), 40);
    }, 1200);
    return () => { clearInterval(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <div className="flex items-center justify-between mb-8">
        <Menu size={22} className="text-foreground" aria-hidden="true" />
        <p className="text-lg font-display font-bold text-foreground">DishyLen</p>
        <div className="w-8 h-8 rounded-full bg-primary/10" aria-hidden="true" />
      </div>

      {/* Animated icon */}
      <div className="flex justify-center mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-4 border-muted flex items-center justify-center relative"
        >
          <span className="text-5xl">🍴</span>
          <div className="absolute -right-1 bottom-4 w-4 h-4 rounded-full bg-primary" />
        </motion.div>
      </div>

      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Analyzing Menu Nutrition</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Our clinical engine is extracting ingredients and cross-referencing nutritional databases.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            {step1 >= 100 ? <CheckCircle2 size={16} className="text-primary" /> : <Loader2 size={16} className="text-primary animate-spin" />}
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Step 01</span>
          </div>
          <p className="font-display font-bold text-foreground text-sm">OCR Text Scanning</p>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${step1}%` }} />
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            {step2 >= 100 ? <CheckCircle2 size={16} className="text-accent" /> : <Loader2 size={16} className="text-accent animate-spin" />}
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Step 02</span>
          </div>
          <p className="font-display font-bold text-foreground text-sm">Bio-Match Engine</p>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${step2}%` }} />
          </div>
        </div>
      </div>

      {/* Macro chips */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { label: "PROTEIN", color: "bg-primary" },
          { label: "CARBS", color: "bg-accent" },
          { label: "FATS", color: "bg-muted-foreground" },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-xl p-3 space-y-2">
            <div className={`h-1 rounded-full ${m.color} w-3/4`} />
            <p className="text-xs text-muted-foreground tracking-wider">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-center gap-2 text-muted-foreground">
        <FlaskConical size={14} />
        <span className="text-xs tracking-[0.1em] uppercase">Culinary Laboratory V2.4</span>
      </div>
    </div>
  );
};

export default AnalyzingScreen;
