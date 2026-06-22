import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import ScannerScreen from "@/components/ScannerScreen";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import MenuResultsScreen from "@/components/MenuResultsScreen";
import MenuItemDetail from "@/components/MenuItemDetail";
import BottomNav from "@/components/BottomNav";
import AssistantScreen from "@/components/AssistantScreen";
import {
  ocrMenuItems,
  ocrMenuSelect,
  getAuthToken,
  getAuthUser,
  queryDishVllm,
  saveHistoryEntry,
  summarizeDish,
  uploadMenuImage,
  type OcrBox,
  type OcrDish,
  type UploadedMenuImage,
  type AuthUser,
} from "@/lib/dishyApi";

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
  box?: OcrBox;
  ocr?: OcrDish;
  summary?: string;
  sources?: string[];
  isLoading?: boolean;
}

const MOCK_MENU: MenuItem[] = [
  {
    id: "1",
    name: "Grilled Chicken Caesar Salad",
    description: "Romaine, grilled chicken breast, parmesan, croutons, Caesar dressing.",
    calories: 480,
    protein: 38,
    carbs: 18,
    fats: 28,
    allergens: ["Dairy", "Gluten", "Eggs"],
    ingredients: ["Grilled chicken", "Romaine", "Parmesan", "Croutons", "Caesar dressing", "Lemon"],
    price: "$12.99",
  },
  {
    id: "2",
    name: "Classic Club Sandwich",
    description: "Triple-decker with turkey, bacon, lettuce, tomato, and mayo on toast.",
    calories: 620,
    protein: 34,
    carbs: 52,
    fats: 30,
    allergens: ["Gluten", "Eggs"],
    ingredients: ["Turkey", "Bacon", "Lettuce", "Tomato", "Mayo", "Toasted bread"],
    price: "$10.99",
  },
  {
    id: "3",
    name: "Spinach and Feta Stuffed Chicken",
    description: "Chicken breast stuffed with sautéed spinach and creamy feta cheese.",
    calories: 520,
    protein: 46,
    carbs: 8,
    fats: 32,
    allergens: ["Dairy"],
    ingredients: ["Chicken breast", "Spinach", "Feta", "Garlic", "Olive oil"],
    price: "$14.99",
  },
  {
    id: "4",
    name: "Vegetable Quinoa Bowl",
    description: "Quinoa with roasted seasonal vegetables, chickpeas, and tahini drizzle.",
    calories: 410,
    protein: 16,
    carbs: 58,
    fats: 14,
    allergens: ["Sesame"],
    ingredients: ["Quinoa", "Bell peppers", "Zucchini", "Chickpeas", "Tahini", "Lemon"],
    price: "$11.99",
  },
  {
    id: "5",
    name: "BBQ Pulled Pork Sandwich",
    description: "Slow-cooked pulled pork in smoky BBQ sauce on a brioche bun with slaw.",
    calories: 680,
    protein: 32,
    carbs: 58,
    fats: 34,
    allergens: ["Gluten", "Eggs"],
    ingredients: ["Pulled pork", "BBQ sauce", "Brioche bun", "Coleslaw"],
    price: "$9.99",
  },
  {
    id: "6",
    name: "Caprese Panini",
    description: "Fresh mozzarella, tomato, basil, and balsamic glaze on grilled ciabatta.",
    calories: 520,
    protein: 22,
    carbs: 48,
    fats: 26,
    allergens: ["Dairy", "Gluten"],
    ingredients: ["Mozzarella", "Tomato", "Basil", "Balsamic glaze", "Ciabatta"],
    price: "$8.99",
  },
  {
    id: "7",
    name: "Fish Tacos",
    description: "Crispy white fish with cabbage slaw, lime crema, in soft corn tortillas.",
    calories: 560,
    protein: 30,
    carbs: 48,
    fats: 24,
    allergens: ["Fish", "Dairy"],
    ingredients: ["White fish", "Corn tortillas", "Cabbage", "Lime crema", "Cilantro"],
    price: "$13.99",
  },
  {
    id: "8",
    name: "Margherita Pizza",
    description: "Wood-fired pizza with San Marzano tomato, fresh mozzarella, and basil.",
    calories: 720,
    protein: 28,
    carbs: 88,
    fats: 26,
    allergens: ["Dairy", "Gluten"],
    ingredients: ["Pizza dough", "San Marzano tomato", "Mozzarella", "Basil", "Olive oil"],
    price: "$14.99",
  },
];

/* ------------------------------------------------------------------ */
/*  Direction-aware transition presets                                 */
/* ------------------------------------------------------------------ */

const spring = { type: "spring", stiffness: 280, damping: 28, mass: 0.8 } as const;

const variants = {
  splash: {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 0.98 },
  },
  home: {
    initial: { opacity: 0, y: 30, scale: 0.97 },
    animate: { opacity: 1, y: 0,  scale: 1 },
    exit:    { opacity: 0, y: -20, scale: 0.97 },
  },
  scan: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 1.05 },
  },
  analyzing: {
    initial: { opacity: 0, y: 60, scale: 0.95 },
    animate: { opacity: 1, y: 0,  scale: 1 },
    exit:    { opacity: 0, y: -30, scale: 0.98 },
  },
  results: {
    initial: { opacity: 0, x: -40, scale: 0.97 },
    animate: { opacity: 1, x: 0,  scale: 1 },
    exit:    { opacity: 0, x:  40, scale: 0.97 },
  },
  detail: {
    initial: { opacity: 0, x:  60, scale: 0.97 },
    animate: { opacity: 1, x: 0,  scale: 1 },
    exit:    { opacity: 0, x: -60, scale: 0.97 },
  },
  assistant: {
    initial: { opacity: 0, y: 40, scale: 0.96 },
    animate: { opacity: 1, y: 0,  scale: 1 },
    exit:    { opacity: 0, y: 40, scale: 0.96 },
  },
};

const getScreenVariant = (s: AppScreen | "assistant") => variants[s];

/* ------------------------------------------------------------------ */

const Index = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState("scan");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuImageUrl, setMenuImageUrl] = useState<string | undefined>();
  const [uploadedMenu, setUploadedMenu] = useState<UploadedMenuImage | undefined>();
  const [analysisStatus, setAnalysisStatus] = useState("Waiting for menu image...");
  const [analysisError, setAnalysisError] = useState<string | undefined>();
  const [isAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [authUser] = useState<AuthUser | undefined>(() => getAuthUser() ?? undefined);

  /* Track previous screen for back-animations */
  const prevScreen = useRef<AppScreen>("splash");
  const setScreenWithHistory = useCallback((next: AppScreen) => {
    prevScreen.current = screen;
    setScreen(next);
  }, [screen]);

  const handleSplashDone = () => setScreenWithHistory("home");
  const handleScan = () => {
    setScreenWithHistory("scan");
    setActiveTab("scan");
  };
  const handleCapture = async ({ file, previewUrl }: { file: File; previewUrl: string }) => {
    setMenuImageUrl(previewUrl);
    setAnalysisError(undefined);
    setAnalysisStatus("Uploading menu image...");
    setScreenWithHistory("analyzing");

    try {
      const upload = await uploadMenuImage(file);
      setUploadedMenu(upload);
      setAnalysisStatus("Running OCR on menu image...");
      const ocrDishes = await ocrMenuItems(upload, file);

      setMenuItems(ocrDishes.map((dish, index) => ({
        id: dish.id || String(index + 1),
        name: dish.name,
        description: dish.text || "Tap to retrieve nutrition details.",
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        allergens: [],
        ingredients: [],
        price: dish.price,
        box: dish.box,
        ocr: dish,
      })));
      setAnalysisStatus(`Detected ${ocrDishes.length} dishes.`);
      setScreenWithHistory("results");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Menu OCR failed.");
    }
  };
  const handleSelectItem = async (item: MenuItem) => {
    const loadingItem = { ...item, isLoading: true };
    setSelectedItem(loadingItem);
    setScreenWithHistory("detail");

    try {
      const selected = item.ocr ? await ocrMenuSelect(item.ocr, uploadedMenu) : null;
      const retrieved = selected || (item.ocr ? await queryDishVllm(item.ocr) : null);
      const summarized = item.ocr && retrieved ? await summarizeDish(item.ocr, retrieved) : retrieved;
      if (!summarized) return;
      saveHistoryEntry({
        type: "query",
        title: summarized.name,
        payload: {
          source: "dish-search",
          dish: summarized.name,
          searchedDish: item.ocr?.name || item.name,
          description: summarized.description,
          calories: summarized.calories,
          protein: summarized.protein,
          carbs: summarized.carbs,
          fats: summarized.fats,
          price: summarized.price,
          allergens: summarized.allergens,
          ingredients: summarized.ingredients,
          summary: summarized.summary,
        },
      });

      setSelectedItem({
        ...item,
        ...summarized,
        id: item.id,
        box: item.box,
        ocr: item.ocr,
        isLoading: false,
      });
    } catch (error) {
      setSelectedItem({
        ...item,
        isLoading: false,
        description: error instanceof Error ? error.message : "Dish retrieval failed.",
      });
    }
  };
  const handleBack = () => {
    if (screen === "detail") setScreenWithHistory("results");
    else if (screen === "results") setScreenWithHistory("home");
    else setScreenWithHistory("home");
  };
  const handleNavTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === "scan") handleScan();
    else if (tab === "assistant") setScreenWithHistory("home");
    else if (tab === "home") setScreenWithHistory("home");
    else if (tab === "history") navigate("/history");
  };

  const showNav = screen !== "splash" && screen !== "scan" && screen !== "analyzing";
  const v = getScreenVariant(screen);

  return (
    <div className="app-shell bg-background overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {screen === "splash" && (
          <motion.div
            key="splash"
            className="absolute inset-0 z-50"
            variants={getScreenVariant("splash")}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <SplashScreen onDone={handleSplashDone} />
          </motion.div>
        )}

        {screen === "home" && (
          <motion.div
            key="home"
            className="absolute inset-0"
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <HomeScreen onScan={handleScan} user={authUser} />
          </motion.div>
        )}

        {screen === "scan" && (
          <motion.div
            key="scan"
            className="absolute inset-0 z-40"
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <ScannerScreen onCapture={handleCapture} onClose={() => setScreenWithHistory("home")} />
          </motion.div>
        )}

        {screen === "analyzing" && (
          <motion.div
            key="analyzing"
            className="absolute inset-0 z-40"
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <AnalyzingScreen status={analysisStatus} error={analysisError} />
          </motion.div>
        )}

        {screen === "results" && (
          <motion.div
            key="results"
            className="absolute inset-0"
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <MenuResultsScreen items={menuItems.length ? menuItems : MOCK_MENU} imageUrl={menuImageUrl} onSelect={handleSelectItem} onBack={handleBack} />
          </motion.div>
        )}

        {screen === "detail" && selectedItem && (
          <motion.div
            key="detail"
            className="absolute inset-0 z-30"
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <MenuItemDetail item={selectedItem} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNav && activeTab === "assistant" && (
          <motion.div
            key="assistant"
            className="absolute inset-0 z-40"
            variants={getScreenVariant("assistant")}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <AssistantScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {showNav && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <BottomNav activeTab={activeTab} onTabChange={handleNavTab} showHistory={isAuthenticated} />
        </motion.div>
      )}
    </div>
  );
};

const HomeScreen = ({ onScan, user }: { onScan: () => void; user?: AuthUser }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
  <div className="flex flex-col min-h-screen px-6 pt-14 pb-24">
    <div className="flex items-center justify-between mb-10">
      <p className="text-2xl font-bold font-display text-foreground">DishyLen</p>

      {/* Profile button + dropdown anchored to the right */}
      <div className="relative">
        <button
          id="profile-btn"
          aria-label="View profile"
          onClick={() => setShowProfile((v) => !v)}
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-90 transition-all"
        >
          {user?.picture ? (
            <img src={user.picture} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          )}
        </button>

        {/* Dropdown box */}
        <AnimatePresence>
          {showProfile && (
            <>
              {/* invisible click-outside layer */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />

              <motion.div
                key="profile-dropdown"
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="absolute top-12 right-0 z-50 w-60 rounded-2xl shadow-xl overflow-hidden"
                style={{ background: "var(--card, #fff)", border: "1px solid var(--border, #e5e7eb)" }}
              >
                {/* Caret */}
                <div
                  className="absolute -top-2 right-3 w-4 h-4 rotate-45 rounded-sm"
                  style={{ background: "var(--card, #fff)", border: "1px solid var(--border, #e5e7eb)", clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                />

                <div className="px-4 py-4 space-y-3">
                  {/* Name */}
                  {user?.name && (
                    <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                  )}

                  {/* ID */}
                  <div className="rounded-xl px-3 py-2.5 space-y-0.5" style={{ background: "var(--muted, #f3f4f6)" }}>
                    <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "var(--muted-foreground, #6b7280)" }}>User ID</p>
                    {user?.id !== undefined
                      ? <p className="text-xs font-mono font-semibold break-all text-foreground">{String(user.id)}</p>
                      : <p className="text-xs text-muted-foreground italic">Not signed in</p>
                    }
                  </div>

                  {/* Email */}
                  {user?.email && (
                    <div className="rounded-xl px-3 py-2.5 space-y-0.5" style={{ background: "var(--muted, #f3f4f6)" }}>
                      <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "var(--muted-foreground, #6b7280)" }}>Email</p>
                      <p className="text-xs break-all text-foreground">{user.email}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, ...spring }}
        className="w-24 h-24 rounded-2xl bg-card shadow-lg flex items-center justify-center relative"
      >
        <span className="text-4xl">🍴</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse-dot" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...spring }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-display font-bold text-foreground">DishyLen — Scan a Menu for Nutrition Insights</h1>
        <p className="text-muted-foreground text-sm max-w-[260px]">
          Point your camera at any restaurant menu to get instant nutritional insights
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, ...spring }}
        whileTap={{ scale: 0.92 }}
        onClick={onScan}
        className="mt-4 bg-primary text-primary-foreground px-10 py-4 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-shadow"
      >
        Start Scanning
      </motion.button>
    </div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-center text-xs text-muted-foreground mt-auto"
    >
      CULINARY LABORATORY V2.4
    </motion.p>
  </div>
  );
};

export default Index;
