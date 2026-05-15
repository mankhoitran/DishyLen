import { ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/pages/Index";

interface Props {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  onBack: () => void;
}

const MenuResultsScreen = ({ items, onSelect, onBack }: Props) => {
  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} aria-label="Go back to home" className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground flex-1">Scanned Menu Items</h1>
        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center" aria-hidden="true">
          <Search size={16} className="text-muted-foreground" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{items.length} items detected</p>

      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(item)}
            className="w-full text-left bg-card rounded-2xl p-4 space-y-2 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-foreground">{item.name}</h2>
              {item.price && <span className="text-sm font-semibold text-primary">{item.price}</span>}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            <div className="flex gap-3 pt-1">
              <MacroPill label="Cal" value={item.calories} color="bg-primary" />
              <MacroPill label="P" value={item.protein} color="bg-primary" />
              <MacroPill label="C" value={item.carbs} color="bg-accent" />
              <MacroPill label="F" value={item.fats} color="bg-muted-foreground" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const MacroPill = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[11px] text-muted-foreground">
      {label} <span className="font-semibold text-foreground">{value}{label === "Cal" ? "" : "g"}</span>
    </span>
  </div>
);

export default MenuResultsScreen;
