import { ArrowLeft, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/pages/Index";

interface Props {
  item: MenuItem;
  onBack: () => void;
}

const MenuItemDetail = ({ item, onBack }: Props) => {
  const macros = [
    { label: "Calories", value: `${item.calories}`, unit: "kcal", pct: 100 },
    { label: "Protein", value: `${item.protein}`, unit: "g", pct: (item.protein / 50) * 100 },
    { label: "Carbs", value: `${item.carbs}`, unit: "g", pct: (item.carbs / 100) * 100 },
    { label: "Fats", value: `${item.fats}`, unit: "g", pct: (item.fats / 65) * 100 },
  ];

  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h2 className="text-lg font-display font-bold text-foreground flex-1">Details</h2>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-foreground">{item.name}</h1>
            {item.price && <span className="text-lg font-bold text-primary">{item.price}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>

        {/* Macros */}
        <div className="bg-card rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wider">Nutritional Breakdown</h3>
          {macros.map((m, i) => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-semibold text-foreground">{m.value} {m.unit}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(m.pct, 100)}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className={`h-full rounded-full ${i === 0 ? "bg-primary" : i === 1 ? "bg-primary" : i === 2 ? "bg-accent" : "bg-muted-foreground"}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Allergens */}
        {item.allergens.length > 0 && (
          <div className="bg-destructive/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wider">Allergens</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.allergens.map((a) => (
                <span key={a} className="px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-medium">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-card rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wider">Ingredients</h3>
          <div className="flex flex-wrap gap-2">
            {item.ingredients.map((ing) => (
              <span key={ing} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{ing}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MenuItemDetail;
