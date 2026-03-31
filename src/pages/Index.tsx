import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import ScannerScreen from "@/components/ScannerScreen";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import MenuResultsScreen from "@/components/MenuResultsScreen";
import MenuItemDetail from "@/components/MenuItemDetail";
import BottomNav from "@/components/BottomNav";

export type AppScreen = "splash" | "home" | "scan" | "analyzing" | "results" | "detail";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  allergens: string[];
  ingredients: string[];
  price?: string;
}

const MOCK_MENU: MenuItem[] = [
  {
    id: "1",
    name: "Grilled Salmon Bowl",
    description: "Atlantic salmon with quinoa, avocado, edamame, and miso dressing.",
    calories: 620,
    protein: 42,
    carbs: 48,
    fats: 28,
    allergens: ["Fish", "Soy"],
    ingredients: ["Salmon", "Quinoa", "Avocado", "Edamame", "Miso", "Sesame oil", "Rice vinegar"],
    price: "$18.50",
  },
  {
    id: "2",
    name: "Truffle Mushroom Risotto",
    description: "Arborio rice slow-cooked with wild mushrooms and truffle oil.",
    calories: 540,
    protein: 14,
    carbs: 72,
    fats: 22,
    allergens: ["Dairy", "Gluten"],
    ingredients: ["Arborio rice", "Porcini", "Shiitake", "Truffle oil", "Parmesan", "Butter", "Shallots"],
    price: "$22.00",
  },
  {
    id: "3",
    name: "Thai Green Curry",
    description: "Coconut-based curry with chicken, bamboo shoots, and Thai basil.",
    calories: 480,
    protein: 32,
    carbs: 34,
    fats: 24,
    allergens: ["Coconut", "Fish sauce"],
    ingredients: ["Chicken breast", "Coconut milk", "Green curry paste", "Bamboo shoots", "Thai basil", "Jasmine rice"],
    price: "$16.00",
  },
  {
    id: "4",
    name: "Caesar Salad",
    description: "Romaine lettuce with house-made dressing, croutons, and shaved parmesan.",
    calories: 320,
    protein: 12,
    carbs: 18,
    fats: 24,
    allergens: ["Dairy", "Gluten", "Eggs"],
    ingredients: ["Romaine", "Parmesan", "Croutons", "Anchovies", "Egg yolk", "Lemon", "Garlic"],
    price: "$12.00",
  },
];

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState("scan");

  const handleSplashDone = () => setScreen("home");
  const handleScan = () => {
    setScreen("scan");
    setActiveTab("scan");
  };
  const handleCapture = () => setScreen("analyzing");
  const handleAnalysisDone = () => setScreen("results");
  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    setScreen("detail");
  };
  const handleBack = () => {
    if (screen === "detail") setScreen("results");
    else if (screen === "results") setScreen("home");
    else setScreen("home");
  };
  const handleNavTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === "scan") handleScan();
    else if (tab === "home") setScreen("home");
  };

  const showNav = screen !== "splash" && screen !== "scan" && screen !== "analyzing";

  return (
    <div className="app-shell bg-background">
      <AnimatePresence mode="wait">
        {screen === "splash" && (
          <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SplashScreen onDone={handleSplashDone} />
          </motion.div>
        )}
        {screen === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <HomeScreen onScan={handleScan} />
          </motion.div>
        )}
        {screen === "scan" && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScannerScreen onCapture={handleCapture} onClose={() => setScreen("home")} />
          </motion.div>
        )}
        {screen === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalyzingScreen onDone={handleAnalysisDone} />
          </motion.div>
        )}
        {screen === "results" && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <MenuResultsScreen items={MOCK_MENU} onSelect={handleSelectItem} onBack={handleBack} />
          </motion.div>
        )}
        {screen === "detail" && selectedItem && (
          <motion.div key="detail" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <MenuItemDetail item={selectedItem} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      {showNav && <BottomNav activeTab={activeTab} onTabChange={handleNavTab} />}
    </div>
  );
};

const HomeScreen = ({ onScan }: { onScan: () => void }) => (
  <div className="flex flex-col min-h-screen px-6 pt-14 pb-24">
    <div className="flex items-center justify-between mb-10">
      <h1 className="text-2xl font-bold font-display text-foreground">DishyLen</h1>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-primary text-lg">👤</span>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <div className="w-24 h-24 rounded-2xl bg-card shadow-lg flex items-center justify-center relative">
        <span className="text-4xl">🍴</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse-dot" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-foreground">Scan a Menu</h2>
        <p className="text-muted-foreground text-sm max-w-[260px]">
          Point your camera at any restaurant menu to get instant nutritional insights
        </p>
      </div>

      <button
        onClick={onScan}
        className="mt-4 bg-primary text-primary-foreground px-10 py-4 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        Start Scanning
      </button>
    </div>

    <p className="text-center text-xs text-muted-foreground mt-auto">
      CULINARY LABORATORY V2.4
    </p>
  </div>
);

export default Index;
