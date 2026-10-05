import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import ScannerScreen from "@/components/ScannerScreen";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import MenuResultsScreen from "@/components/MenuResultsScreen";
import MenuItemDetail from "@/components/MenuItemDetail";
import BottomNav from "@/components/BottomNav";
import ProfileScreen from "@/components/ProfileScreen";
import {
  ocrMenuItems,
  ocrMenuSelect,
  getAuthToken,
  getAuthUser,
  queryDishVllm,
  saveHistoryEntry,
  summarizeDish,
  uploadMenuImage,
  clearAuth,
  translateText,
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
  allergyWarning?: boolean;
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
  profile: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 0.98 },
  },
};

const getScreenVariant = (s: AppScreen | "profile") => variants[s];

/* ------------------------------------------------------------------ */

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = location.state?.activeTab || "home";
  
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (sessionStorage.getItem("splash_shown")) return initialTab === "scan" ? "scan" : "home";
    return "splash";
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuImageUrl, setMenuImageUrl] = useState<string | undefined>();
  const [uploadedMenu, setUploadedMenu] = useState<UploadedMenuImage | undefined>();
  const [analysisStatus, setAnalysisStatus] = useState("Waiting for menu image...");
  const [analysisError, setAnalysisError] = useState<string | undefined>();
  const [isAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [authUser] = useState<AuthUser | undefined>(() => getAuthUser() ?? undefined);
  const [targetLanguage, setTargetLanguage] = useState(() => localStorage.getItem("dishy_language") || "en");

  const handleLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    localStorage.setItem("dishy_language", lang);
  };

  /* Track previous screen for back-animations */
  const prevScreen = useRef<AppScreen>("splash");
  const setScreenWithHistory = useCallback((next: AppScreen) => {
    prevScreen.current = screen;
    setScreen(next);
  }, [screen]);

  const handleSplashDone = () => {
    sessionStorage.setItem("splash_shown", "true");
    setScreenWithHistory("home");
  };
  
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
        description: dish.allergyWarningText ? `WARNING: Contains ${dish.allergyWarningText}. ${dish.text || ""}` : (dish.text || "Tap to retrieve nutrition details."),
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        allergens: dish.allergyWarningText ? dish.allergyWarningText.split(',').map(s => s.trim()) : [],
        allergyWarning: !!dish.allergyWarningText,
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
      let summarized = item.ocr && retrieved ? await summarizeDish(item.ocr, retrieved, getAuthUser()?.allergies) : retrieved;
      if (!summarized) return;
      
      if (targetLanguage && targetLanguage !== "en") {
        const langMap: Record<string, string> = {
          vi: "vietnamese",
          es: "spanish",
          zh: "chinese"
        };
        const targetLangName = langMap[targetLanguage] || targetLanguage;

        const [translatedSummary, translatedIngredients] = await Promise.all([
          translateText(summarized.description, targetLangName),
          summarized.ingredients && summarized.ingredients.length > 0
            ? translateText(summarized.ingredients.join(" | "), targetLangName).then(res => res.split("|").map(s => s.trim()))
            : Promise.resolve(summarized.ingredients)
        ]);
        summarized = { 
          ...summarized, 
          description: translatedSummary, 
          summary: translatedSummary,
          ingredients: translatedIngredients 
        };
      }

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
        allergyWarning: Boolean(item.allergyWarning || summarized.allergyWarning || summarized.raw?.allergyWarning || summarized.raw?.allergy_warning),
        allergens: Array.from(new Set([...(item.allergens || []), ...(summarized.allergens || [])])),
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
    else if (tab === "profile") setScreenWithHistory("home");
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
            <HomeScreen onScan={handleScan} user={authUser} language={targetLanguage} onLanguageChange={handleLanguageChange} />
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
            <ScannerScreen onCapture={handleCapture} onClose={() => { setScreenWithHistory("home"); setActiveTab("home"); }} />
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
        {showNav && activeTab === "profile" && (
          <motion.div
            key="profile"
            className="absolute inset-0 z-40 bg-background"
            variants={getScreenVariant("profile")}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring}
          >
            <ProfileScreen language={targetLanguage} onLanguageChange={handleLanguageChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {showNav && (
        <BottomNav activeTab={activeTab} onTabChange={handleNavTab} showHistory={isAuthenticated} />
      )}
    </div>
  );
};

const HomeScreen = ({ onScan, user, language, onLanguageChange }: { onScan: () => void; user?: AuthUser; language: string; onLanguageChange: (lang: string) => void }) => {
  return (
  <div className="flex flex-col min-h-screen px-6 pt-14 pb-24">
    <div className="flex items-center justify-between mb-10">
      <p className="text-2xl font-bold font-display text-foreground">DishyLen</p>
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
