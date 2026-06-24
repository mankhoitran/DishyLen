import { ArrowLeft, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { MenuItem } from "@/pages/Index";
import menuImage from "@/assets/scanned-menu.png";

interface Props {
  items: MenuItem[];
  imageUrl?: string;
  onSelect: (item: MenuItem) => void;
  onBack: () => void;
}

const HOTSPOTS: Record<string, number> = {
  "1": 44.3,
  "2": 47.8,
  "3": 51.4,
  "4": 54.9,
  "5": 58.5,
  "6": 62.0,
  "7": 65.6,
  "8": 87.0,
};
const HOTSPOT_LEFT = 6;
const HOTSPOT_WIDTH = 44;
const HOTSPOT_HEIGHT = 3.2;

const MenuResultsScreen = ({ items, imageUrl, onSelect, onBack }: Props) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canUseDemoHotspots = !imageUrl;
  const hasImageBoxes = items.some((item) => item.box);

  const toPercentBox = (item: MenuItem) => {
    if (!item.box) return undefined;
    const { x, y, width, height } = item.box;
    if (x <= 1 && y <= 1 && width <= 1 && height <= 1) {
      return { left: x * 100, top: y * 100, width: width * 100, height: height * 100 };
    }
    if (x <= 100 && y <= 100 && width <= 100 && height <= 100) {
      return { left: x, top: y, width, height };
    }
    if (!imageSize.width || !imageSize.height) return undefined;
    return {
      left: (x / imageSize.width) * 100,
      top: (y / imageSize.height) * 100,
      width: (width / imageSize.width) * 100,
      height: (height / imageSize.height) * 100,
    };
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pt-6 pb-24">
      <div className="flex items-center gap-3 mb-5 px-6">
        <button onClick={onBack} aria-label="Go back to home" className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground flex-1">Scanned Menu</h1>
        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center" aria-hidden="true">
          <Search size={16} className="text-muted-foreground" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="relative overflow-hidden shadow-2xl bg-card mx-1 rounded-2xl"
      >
        <img
          src={imageUrl || menuImage}
          alt="Scanned restaurant menu"
          className="block w-full h-auto select-none pointer-events-none"
          draggable={false}
          onLoad={(event) => setImageSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })}
        />

        {items.map((item) => {
          const dynamicBox = toPercentBox(item);
          const top = HOTSPOTS[item.id];
          if (!dynamicBox && (!canUseDemoHotspots || top === undefined)) return null;
          const isHover = hovered === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`View nutrition for ${item.name}`}
              className="absolute group"
              style={dynamicBox
                ? {
                    top: `${Math.max(dynamicBox.top, 0)}%`,
                    left: `${Math.max(dynamicBox.left, 0)}%`,
                    width: `${Math.max(dynamicBox.width, 2)}%`,
                    height: `${Math.max(dynamicBox.height, 2.5)}%`,
                  }
                : {
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
          {items.length} dishes detected - {hasImageBoxes || canUseDemoHotspots ? "tap a line" : "tap below"}
        </div>
      </motion.div>

      {items.length > 0 && items.some((item) => !item.box) && (
        <div className="px-6 mt-4 space-y-2">
          {items.filter((item) => !item.box).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full rounded-xl bg-card px-4 py-3 text-left shadow-sm"
            >
              <span className="block text-sm font-semibold text-foreground">{item.name}</span>
              {item.price && <span className="text-xs text-primary">{item.price}</span>}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {hovered && (
          <motion.p
            key={hovered}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-primary font-semibold mb-3"
          >
            {items.find((i) => i.id === hovered)?.name}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuResultsScreen;
