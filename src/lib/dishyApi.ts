export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://dishylens.mealsretrieval.site";

export interface OcrBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrDish {
  id: string;
  index: number;
  name: string;
  text: string;
  price?: string;
  box?: OcrBox;
  raw?: unknown;
  allergyWarningText?: string;
}

export interface UploadedMenuImage {
  imageId?: string;
  imagePath?: string;
  imageUrl?: string;
  raw: unknown;
}

export interface DishInfo {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  allergens: string[];
  ingredients: string[];
  price?: string;
  summary?: string;
  sources?: string[];
  allergyWarning?: boolean;
  raw?: unknown;
}

export interface AuthUser {
  id?: string | number;
  email?: string;
  name?: string;
  picture?: string;
  picture_url?: string;
  allergies?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
  [key: string]: unknown;
}

export type HistoryEntryType = "query" | "ocr" | "summary";

export interface HistoryEntry {
  id: string;
  type: HistoryEntryType;
  title: string;
  payload: Record<string, unknown> | string;
  createdAt: string;
  userId?: string;
  userEmail?: string;
}

export type QueryDishPayload = Record<string, unknown> | string;

const AUTH_TOKEN_KEY = "dishy_access_token";
const AUTH_USER_KEY = "dishy_user";
const HISTORY_KEY = "dishy_history_entries";

const NUTRITION_PARSE_PROMPT = `
Extract nutrition information for this dish and return ONLY valid JSON.
No markdown. No explanation. No code fence.

Required JSON shape:
{
  "description": "one concise diner-friendly paragraph",
  "calories": number | null,
  "protein": number | null,
  "carbs": number | null,
  "fats": number | null,
  "ingredients": string[],
  "allergens": string[],
  "allergyWarning": boolean
}

Rules:
- calories must be kcal per serving.
- protein, carbs, and fats must be grams per serving.
- If a value is given as a range, use the midpoint rounded to one decimal.
- If exact values are not provided in the input, provide your best reasonable estimate based on a standard serving size for this type of dish. DO NOT use null or 0 unless the dish is literally water.
- Preserve likely ingredients and allergens. If not provided, infer the most common ingredients for this dish.
- Set allergyWarning to true ONLY if the dish contains any allergens that match the user's provided allergies.
`.trim();

const getStoredUser = (): AuthUser | undefined => {
  if (typeof localStorage === "undefined") return undefined;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return undefined;
  }
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthUser = (user: AuthUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getAuthUser = () => getStoredUser();

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

const getJson = async <T>(path: string): Promise<T> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

const normalizeAuthUser = (user: AuthUser): AuthUser => ({
  ...user,
  id: user.id !== undefined ? String(user.id) : undefined,
  picture: user.picture ?? user.picture_url,
});

export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
  const auth = await postJson<AuthResponse>("/auth/google", { id_token: idToken });
  setAuthToken(auth.access_token);
  const user = normalizeAuthUser(auth.user);
  setAuthUser(user);
  return { ...auth, user };
};

export const updateUserProfile = async (updates: Partial<AuthUser>): Promise<AuthUser> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/auth/add_allergy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status} ${await response.text()}`);
  }

  const raw = await response.json();
  const updatedUser = normalizeAuthUser({ ...getStoredUser(), ...raw.user, ...updates });
  setAuthUser(updatedUser);
  return updatedUser;
};

export const saveHistoryEntry = (entry: Omit<HistoryEntry, "id" | "createdAt" | "userId" | "userEmail"> & Partial<HistoryEntry>) => {
  const user = getStoredUser();
  const nextEntry: HistoryEntry = {
    ...entry,
    id: entry.id || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    createdAt: entry.createdAt || new Date().toISOString(),
    userId: entry.userId || (user?.id !== undefined ? String(user.id) : undefined),
    userEmail: entry.userEmail || user?.email,
  };
  const entries = loadAllHistoryEntries();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([nextEntry, ...entries].slice(0, 100)));
  void postJson<unknown>("/history", {
    type: nextEntry.type,
    title: nextEntry.title,
    payload: typeof nextEntry.payload === "string" ? { text: nextEntry.payload } : nextEntry.payload,
  }).catch((error) => {
    console.debug("[DishyLen API] /history sync failed, kept local copy", error);
  });
  return nextEntry;
};

// Example: saveHistoryEntry({ type: "query", title: "Pad thai", payload: { query: "Pad thai nutrition" } });

const loadAllHistoryEntries = (): HistoryEntry[] => {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
};

export const loadHistoryEntries = (userIdOrEmail?: string): HistoryEntry[] => {
  const user = getStoredUser();
  const key = userIdOrEmail || (user?.id !== undefined ? String(user.id) : undefined) || user?.email;
  return loadAllHistoryEntries()
    .filter((entry) => !key || String(entry.userId) === key || entry.userEmail === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const normalizeHistoryEntry = (entry: any): HistoryEntry => ({
  id: String(entry.id),
  type: entry.type,
  title: String(entry.title ?? "History entry"),
  payload: entry.payload ?? {},
  createdAt: String(entry.createdAt ?? entry.created_at ?? new Date().toISOString()),
  userId: entry.userId !== undefined ? String(entry.userId) : entry.user_id !== undefined ? String(entry.user_id) : undefined,
  userEmail: entry.userEmail ?? entry.user_email,
});

export const fetchHistoryEntries = async (type?: HistoryEntryType): Promise<HistoryEntry[]> => {
  const params = new URLSearchParams({ limit: "100" });
  if (type) params.set("type", type);
  const raw: any = await getJson(`/history?${params.toString()}`);
  const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
  return items.map(normalizeHistoryEntry);
};

const firstArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.dishes)) return value.dishes;
  if (Array.isArray(value?.menu_items)) return value.menu_items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.ocr_items)) return value.ocr_items;
  return [];
};

const toNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const next = Number(value);
    if (Number.isFinite(next)) return next;
  }
  return undefined;
};

const toOptionalNumber = (value: unknown, fallback?: number) => {
  if (value === null || value === undefined || value === "") return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const fromRangeOrNumber = (text: string, pattern: RegExp) => {
  const match = text.match(pattern);
  if (!match) return undefined;
  const first = Number(match[1]);
  const second = match[2] ? Number(match[2]) : undefined;
  if (!Number.isFinite(first)) return undefined;
  if (Number.isFinite(second)) return Math.round(((first + second!) / 2) * 10) / 10;
  return first;
};

const extractJsonObject = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
};

const parseNutritionText = (text: string): Partial<DishInfo> => {
  const json = extractJsonObject(text);
  const source = json ?? {};
  const lowerText = text.toLowerCase();

  return {
    description: source.description ? String(source.description) : text,
    calories: toOptionalNumber(
      source.calories,
      fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*(?:calories|kcal|cal\b)/i) ??
        fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*(?:calories|kcal|cal\b)/i) ??
        undefined,
    ),
    protein: toOptionalNumber(
      source.protein,
      fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*g\s*protein/i) ??
        fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*g\s*protein/i) ??
        undefined,
    ),
    carbs: toOptionalNumber(
      source.carbs,
      fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*g\s*(?:carbs|carbohydrates)/i) ??
        fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*g\s*(?:carbs|carbohydrates)/i) ??
        undefined,
    ),
    fats: toOptionalNumber(
      source.fats ?? source.fat,
      fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*g\s*(?:fat|fats)/i) ??
        fromRangeOrNumber(lowerText, /(\d+(?:\.\d+)?)\s*g\s*(?:fat|fats)/i) ??
        undefined,
    ),
    ingredients: normalizeList(source.ingredients),
    allergens: normalizeList(source.allergens),
    allergyWarning: source.allergyWarning === true || source.allergy_warning === true,
  };
};

const normalizeBox = (item: any): OcrBox | undefined => {
  const box = item?.box ?? item?.bbox ?? item?.bounding_box ?? item?.bounds;
  if (!box) return undefined;

  if (Array.isArray(box)) {
    const xs = box.map((point: any) => Array.isArray(point) ? Number(point[0]) : Number(point?.x));
    const ys = box.map((point: any) => Array.isArray(point) ? Number(point[1]) : Number(point?.y));
    const validXs = xs.filter(Number.isFinite);
    const validYs = ys.filter(Number.isFinite);
    if (!validXs.length || !validYs.length) return undefined;
    const minX = Math.min(...validXs);
    const maxX = Math.max(...validXs);
    const minY = Math.min(...validYs);
    const maxY = Math.max(...validYs);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  return {
    x: toNumber(box.x ?? box.left),
    y: toNumber(box.y ?? box.top),
    width: toNumber(box.width ?? box.w ?? ((box.right ?? 0) - (box.left ?? 0))),
    height: toNumber(box.height ?? box.h ?? ((box.bottom ?? 0) - (box.top ?? 0))),
  };
};

const normalizeOcrDish = (item: any, index: number): OcrDish => {
  if (typeof item === "string") {
    let name = item.trim();
    let allergyWarningText: string | undefined;

    const match = name.match(/(.*?)\s*\[Allergy Warning:\s*(.*?)\]/i);
    if (match) {
      name = match[1].trim();
      allergyWarningText = match[2].trim();
    }

    return {
      id: String(index + 1),
      index,
      name: name,
      text: item.trim(),
      raw: item,
      allergyWarningText,
    };
  }

  let name = String(item?.name ?? item?.dish_name ?? item?.title ?? item?.text ?? item?.label ?? `Dish ${index + 1}`).trim();
  let allergyWarningText: string | undefined;

  const match = name.match(/(.*?)\s*\[Allergy Warning:\s*(.*?)\]/i);
  if (match) {
    name = match[1].trim();
    allergyWarningText = match[2].trim();
  }

  return {
    id: String(item?.id ?? item?.dish_id ?? index + 1),
    index,
    name: name,
    text: String(item?.text ?? name),
    price: item?.price ? String(item.price) : undefined,
    box: normalizeBox(item),
    raw: item,
    allergyWarningText,
  };
};

export const imageDataUrlToFile = async (dataUrl: string, filename = "menu.jpg") => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

export const uploadMenuImage = async (file: File): Promise<UploadedMenuImage> => {
  const formData = new FormData();
  formData.append("file", file);

  console.debug("[DishyLen API] POST /vllm/ocr/upload", { fileName: file.name, size: file.size });
  const response = await fetch(`${API_BASE_URL}/vllm/ocr/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`/vllm/ocr/upload failed with ${response.status}: ${await response.text()}`);
  }

  const raw: any = await response.json();
  console.debug("[DishyLen API] /vllm/ocr/upload response", raw);
  return {
    imageId: raw.image_id ?? raw.imageId ?? raw.id,
    imagePath: raw.image_path ?? raw.imagePath ?? raw.path,
    imageUrl: raw.image_url ?? raw.imageUrl ?? raw.url,
    raw,
  };
};

export const ocrMenuItems = async (upload: UploadedMenuImage, file: File): Promise<OcrDish[]> => {
  try {
    console.debug("[DishyLen API] POST /vllm/ocr/items", {
      imagePath: upload.imagePath,
      imageUrl: upload.imageUrl,
    });
    const raw = await postJson<unknown>("/vllm/ocr/items", {
      image_path: upload.imagePath,
      image_url: upload.imageUrl,
      max_items: 40,
      ocr_backend: "auto",
    });
    console.debug("[DishyLen API] /vllm/ocr/items response", raw);
    return firstArray(raw).map(normalizeOcrDish);
  } catch (jsonError) {
    console.debug("[DishyLen API] /vllm/ocr/items JSON failed, trying multipart fallback", jsonError);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("image", file);
    if (upload.imagePath) formData.append("image_path", upload.imagePath);
    if (upload.imageUrl) formData.append("image_url", upload.imageUrl);

    const response = await fetch(`${API_BASE_URL}/vllm/ocr/items`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw jsonError;
    const raw = await response.json();
    console.debug("[DishyLen API] /vllm/ocr/items multipart response", raw);
    return firstArray(raw).map(normalizeOcrDish);
  }
};

const normalizeList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((part) => part.trim()).filter(Boolean);
  return [];
};

const mergeLists = (...values: unknown[]): string[] => {
  const seen = new Set<string>();
  const items: string[] = [];

  values.flatMap(normalizeList).forEach((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push(item.trim());
  });

  return items;
};

export const ocrMenuSelect = async (dish: OcrDish, upload?: UploadedMenuImage): Promise<DishInfo | undefined> => {
  try {
    const raw = await postJson<unknown>("/vllm/ocr/select", {
      image_path: upload?.imagePath,
      item_name: dish.name,
      item_index: dish.index,
      max_items: 40,
      ocr_backend: "auto",
      include_ingredients: true,
    });
    return normalizeDishInfo(raw, dish.name, dish.price);
  } catch {
    return undefined;
  }
};

const normalizeDishInfo = (raw: any, fallbackName: string, fallbackPrice?: string): DishInfo => {
  const dish = raw?.dish_info ?? raw?.dish ?? raw?.result ?? raw?.data ?? raw;
  const macros = dish?.macros ?? {};
  const nutrition = dish?.nutrition ?? {};
  return {
    name: String(dish?.name ?? dish?.dish_name ?? dish?.dish ?? fallbackName),
    description: String(dish?.description ?? dish?.summary ?? dish?.answer ?? "Nutrition details retrieved from the backend."),
    calories: firstNumber(
      dish?.calories,
      nutrition.calories,
      nutrition.calories_kcal,
      macros.calories,
      macros.kcal,
      macros.calories_kcal,
    ) ?? 0,
    protein: firstNumber(
      dish?.protein,
      nutrition.protein,
      nutrition.protein_g,
      macros.protein,
      macros.protein_g,
    ) ?? 0,
    carbs: firstNumber(
      dish?.carbs,
      dish?.carbohydrates,
      nutrition.carbs,
      nutrition.carbohydrates,
      nutrition.carbs_g,
      macros.carbs,
      macros.carbohydrates,
      macros.carbs_g,
    ) ?? 0,
    fats: firstNumber(
      dish?.fats,
      dish?.fat,
      nutrition.fats,
      nutrition.fat,
      nutrition.fat_g,
      macros.fat,
      macros.fats,
      macros.fat_g,
    ) ?? 0,
    allergens: mergeLists(dish?.allergens, raw?.allergens),
    ingredients: mergeLists(dish?.ingredients, raw?.ingredients),
    price: dish?.price ? String(dish.price) : fallbackPrice,
    summary: dish?.summary ? String(dish.summary) : undefined,
    sources: mergeLists(dish?.sources, raw?.sources),
    allergyWarning: dish?.allergyWarning === true || dish?.allergy_warning === true || raw?.allergyWarning === true || raw?.allergy_warning === true,
    raw,
  };
};

export const queryDish = async (payload: QueryDishPayload) => {
  return postJson<unknown>("/query", typeof payload === "string" ? { query: payload } : payload);
};

export const queryDishVllm = async (dish: OcrDish): Promise<DishInfo> => {
  const raw = await postJson<unknown>("/vllm/query", {
    query: dish.name,
  });
  return normalizeDishInfo(raw, dish.name, dish.price);
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const raw = await postJson<any>("/vllm/translate", {
      text,
      target_language: targetLanguage,
    });
    return raw?.translated_text ?? raw?.text ?? raw?.result ?? text;
  } catch (error) {
    console.error("Translation failed", error);
    return text;
  }
};

export const summarizeDish = async (dish: OcrDish, info: DishInfo, userAllergies?: string): Promise<DishInfo> => {
  const allergyContext = userAllergies ? `\n\nUser Allergies: ${userAllergies}\nDetermine if the dish contains any of these allergies and set "allergyWarning" to true if so.` : "";

  const raw = await postJson<any>("/vllm/summary", {
    query: `${dish.name} nutrition facts per serving`,
    text: `${NUTRITION_PARSE_PROMPT}${allergyContext}\n\nDish: ${info.name}\n\nInput:\n${JSON.stringify(info.raw ?? info)}`,
    max_words: 80,
    include_sources: true,
  });
  const normalized = normalizeDishInfo(raw, info.name, info.price);
  const summary = raw?.summary ?? raw?.text ?? raw?.answer ?? raw?.result;
  const parseSource = [raw?.description, raw?.summary, raw?.text, raw?.answer, raw?.result]
    .filter(Boolean)
    .map(String)
    .join("\n");
  const parsed = parseSource ? parseNutritionText(parseSource) : {};
  return {
    ...info,
    ...normalized,
    summary: summary ? String(summary) : info.summary,
    description: normalized.description || parsed.description || (summary ? String(summary) : info.description),
    calories: firstNumber(raw?.calories, parsed.calories, normalized.calories, info.calories) ?? 0,
    protein: firstNumber(raw?.protein, parsed.protein, normalized.protein, info.protein) ?? 0,
    carbs: firstNumber(raw?.carbs, parsed.carbs, normalized.carbs, info.carbs) ?? 0,
    fats: firstNumber(raw?.fats, raw?.fat, parsed.fats, normalized.fats, info.fats) ?? 0,
    ingredients: mergeLists(raw?.ingredients, parsed.ingredients, normalized.ingredients, info.ingredients),
    allergens: mergeLists(raw?.allergens, parsed.allergens, normalized.allergens, info.allergens),
    sources: mergeLists(raw?.sources, normalized.sources, info.sources),
    allergyWarning: raw?.allergyWarning === true || raw?.allergy_warning === true || parsed.allergyWarning === true || normalized.allergyWarning === true || info.allergyWarning === true,
  };
};
