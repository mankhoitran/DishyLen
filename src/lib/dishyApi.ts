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
  raw?: unknown;
}

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
  "allergens": string[]
}

Rules:
- calories must be kcal per serving.
- protein, carbs, and fats must be grams per serving.
- If a value is given as a range, use the midpoint rounded to one decimal.
- If a value is unknown, use null.
- Preserve likely ingredients and allergens only when supported by the text.
`.trim();

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${await response.text()}`);
  }

  return response.json();
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
    return {
      id: String(index + 1),
      index,
      name: item.trim(),
      text: item.trim(),
      raw: item,
    };
  }

  const text = String(item?.name ?? item?.dish_name ?? item?.title ?? item?.text ?? item?.label ?? `Dish ${index + 1}`).trim();
  return {
    id: String(item?.id ?? item?.dish_id ?? index + 1),
    index,
    name: text,
    text,
    price: item?.price ? String(item.price) : undefined,
    box: normalizeBox(item),
    raw: item,
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
  return {
    name: String(dish?.name ?? dish?.dish_name ?? dish?.dish ?? fallbackName),
    description: String(dish?.description ?? dish?.summary ?? dish?.answer ?? "Nutrition details retrieved from the backend."),
    calories: toNumber(dish?.calories ?? dish?.nutrition?.calories ?? macros.calories ?? macros.kcal),
    protein: toNumber(dish?.protein ?? dish?.nutrition?.protein ?? macros.protein),
    carbs: toNumber(dish?.carbs ?? dish?.carbohydrates ?? dish?.nutrition?.carbs ?? macros.carbs),
    fats: toNumber(dish?.fats ?? dish?.fat ?? dish?.nutrition?.fats ?? macros.fat ?? macros.fats),
    allergens: normalizeList(dish?.allergens ?? raw?.allergens),
    ingredients: normalizeList(dish?.ingredients ?? raw?.ingredients),
    price: dish?.price ? String(dish.price) : fallbackPrice,
    summary: dish?.summary ? String(dish.summary) : undefined,
    sources: normalizeList(dish?.sources ?? raw?.sources),
    raw,
  };
};

export const queryDish = async (dish: OcrDish): Promise<DishInfo> => {
  try {
    const raw = await postJson<unknown>("/vllm/query", {
      query: dish.name,
    });
    return normalizeDishInfo(raw, dish.name, dish.price);
  } catch {
    const params = new URLSearchParams({ dish_name: dish.name, query: dish.name });
    const response = await fetch(`${API_BASE_URL}/vllm/query?${params.toString()}`);
    if (!response.ok) throw new Error(`/vllm/query failed with ${response.status}: ${await response.text()}`);
    return normalizeDishInfo(await response.json(), dish.name, dish.price);
  }
};

export const summarizeDish = async (dish: OcrDish, info: DishInfo): Promise<DishInfo> => {
  const raw = await postJson<any>("/vllm/summary", {
    query: `${dish.name} nutrition facts per serving`,
    text: `${NUTRITION_PARSE_PROMPT}\n\nDish: ${info.name}\n\nInput:\n${JSON.stringify(info.raw ?? info)}`,
    max_words: 80,
    include_sources: true,
  });
  const summary = raw?.summary ?? raw?.text ?? raw?.answer ?? raw?.result;
  const parsed = summary ? parseNutritionText(String(summary)) : {};
  return {
    ...info,
    ...parsed,
    summary: summary ? String(summary) : info.summary,
    description: parsed.description || (summary ? String(summary) : info.description),
    calories: parsed.calories ?? info.calories,
    protein: parsed.protein ?? info.protein,
    carbs: parsed.carbs ?? info.carbs,
    fats: parsed.fats ?? info.fats,
    ingredients: parsed.ingredients?.length ? parsed.ingredients : info.ingredients,
    allergens: parsed.allergens?.length ? parsed.allergens : info.allergens,
    sources: normalizeList(raw?.sources ?? info.sources),
  };
};
