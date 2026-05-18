import { ArrowLeft, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { MenuItem } from "@/pages/Index";
import menuImage from "@/assets/scanned-menu.png";

interface Props {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  onBack: () => void;
}

// Hotspot Y-position (in %) of each dish line over the scanned menu image.
// Left-column lines under "Menu and Prices:" — measured against the source image.
const HOTSPOTS: Record<string, number> = {
  "1": 44.3,  // Grilled Chicken Caesar Salad
  "2": 47.8,  // Classic Club Sandwich
  "3": 51.4,  // Spinach and Feta Stuffed Chicken
  "4": 54.9,  // Vegetable Quinoa Bowl
  "5": 58.5,  // BBQ Pulled Pork Sandwich
  "6": 62.0,  // Caprese Panini
  "7": 65.6,  // Fish Tacos
  "8": 87.0,  // Margherita Pizza
};
const HOTSPOT_LEFT = 6;     // %
const HOTSPOT_WIDTH = 44;   // %
const HOTSPOT_HEIGHT = 3.2; // %

const MenuResultsScreen = ({ items, onSelect, onBack }: Props) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24">
      <div className="flex items-center gap-3 mb-5 px-6">
        <button onClick={onBack} aria-label="Go back to home" className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground flex-1">Scanned Menu</h1>
        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center" aria-hidden="true">
          <Search size={16} className="text-muted-foreground" />
        </div>
      </div>

      {/* Scanned menu — tap any line to retrieve the dish */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="relative overflow-hidden shadow-2xl bg-card mx-1 rounded-2xl"
      >
        <img
          src={menuImage}
          alt="Scanned restaurant menu"
          className="block w-full h-auto select-none pointer-events-none"
          draggable={false}
        />

        {/* Clickable hotspot rows over each detected dish line */}
        {items.map((item) => {
          const top = HOTSPOTS[item.id];
          if (top === undefined) return null;
          const isHover = hovered === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`View nutrition for ${item.name}`}
              className="absolute group"
              style={{
                top: `${top - HOTSPOT_HEIGHT / 2}%`,
                left: `${HOTSPOT_LEFT}%`,
                width: `${HOTSPOT_WIDTH}%`,
                height: `${HOTSPOT_HEIGHT}%`,
              }}
            >
              <span
                className={`absolute inset-0 rounded-md transition-all duration-200 ${
                  isHover
                    ? "bg-primary/25 ring-2 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                    : "bg-primary/0 ring-1 ring-primary/30 group-hover:bg-primary/15"
                }`}
              />
            </button>
          );
        })}

        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur text-[10px] font-semibold text-foreground shadow">
          {items.length} dishes detected · tap a line
        </div>
      </motion.div>

      <AnimatePresence>
        {hovered && (
          <motion.p
            key={hovered}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-primary font-semibold mb-3"
          >
            → {items.find((i) => i.id === hovered)?.name}
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MenuResultsScreen;
