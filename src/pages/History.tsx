import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Search, Utensils } from "lucide-react";
import { fetchHistoryEntries, loadHistoryEntries, type HistoryEntry } from "@/lib/dishyApi";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getPayload = (entry: HistoryEntry) => (
  typeof entry.payload === "string" ? { dish: entry.payload } : entry.payload
);

const hasNumber = (value: unknown) => Number.isFinite(Number(value));

const isDishHistoryEntry = (entry: HistoryEntry) => {
  const payload = getPayload(entry);
  if (payload.source === "assistant") return false;
  if ("count" in payload || "imagePath" in payload || "imageUrl" in payload) return false;
  if (payload.source === "dish-search") return true;
  return Boolean(payload.dish && (
    hasNumber(payload.calories) ||
    hasNumber(payload.protein) ||
    hasNumber(payload.carbs) ||
    hasNumber(payload.fats)
  ));
};

const toList = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
};

const getDishName = (entry: HistoryEntry) => {
  const payload = getPayload(entry);
  return String(payload.dish || payload.searchedDish || entry.title);
};

const getDescription = (entry: HistoryEntry) => {
  const payload = getPayload(entry);
  return String(payload.summary || payload.description || "").trim();
};

const getMacro = (entry: HistoryEntry, key: "calories" | "protein" | "carbs" | "fats") => {
  const payload = getPayload(entry);
  const value = Number(payload[key]);
  return Number.isFinite(value) ? value : 0;
};

const History = () => {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistoryEntries());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchHistoryEntries()
      .then((remoteEntries) => {
        if (isMounted) setEntries(remoteEntries);
      })
      .catch((error) => {
        console.debug("[DishyLen API] remote history failed, using local history", error);
        if (isMounted) setEntries(loadHistoryEntries());
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    if (!isDishHistoryEntry(entry)) return false;
    const payload = getPayload(entry);
    const query = search.trim().toLowerCase();
    const searchableText = [
      entry.title,
      payload.dish,
      payload.searchedDish,
      payload.description,
      payload.summary,
      ...toList(payload.ingredients),
      ...toList(payload.allergens),
    ].filter(Boolean).join(" ");
    return !query || searchableText.toLowerCase().includes(query);
  }), [entries, search]);

  return (
    <div className="app-shell bg-background">
      <div className="flex min-h-screen flex-col px-5 pb-8 pt-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/" aria-label="Back to app" className="flex h-10 w-10 items-center justify-center rounded-full bg-card">
            <ArrowLeft size={18} className="text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">History</h1>
            <p className="text-xs text-muted-foreground">Searched dishes saved on this device</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a dish"
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Clock size={24} className="text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Loading history</h2>
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-muted-foreground">
              Syncing your saved dishes from the backend.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Clock size={24} className="text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">No history yet</h2>
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-muted-foreground">
              Open a dish result after scanning a menu to save its nutrition details here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => {
              const payload = getPayload(entry);
              const description = getDescription(entry);
              const allergens = toList(payload.allergens);
              const ingredients = toList(payload.ingredients);
              return (
                <article key={entry.id} className="rounded-2xl bg-card p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Utensils size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="break-words text-sm font-bold text-foreground">{getDishName(entry)}</h2>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                      </div>
                      {description && (
                        <p className="mt-1 line-clamp-3 break-words text-xs leading-5 text-muted-foreground">
                          {description}
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {[
                          ["Cal", getMacro(entry, "calories"), "kcal"],
                          ["Protein", getMacro(entry, "protein"), "g"],
                          ["Carbs", getMacro(entry, "carbs"), "g"],
                          ["Fat", getMacro(entry, "fats"), "g"],
                        ].map(([label, value, unit]) => (
                          <div key={label} className="rounded-lg bg-secondary px-2 py-2 text-center">
                            <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                            <p className="mt-0.5 text-xs font-bold text-foreground">{value}{unit}</p>
                          </div>
                        ))}
                      </div>
                      {allergens.length > 0 && (
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                          <span className="font-semibold text-foreground">Allergens:</span> {allergens.join(", ")}
                        </p>
                      )}
                      {ingredients.length > 0 && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          <span className="font-semibold text-foreground">Ingredients:</span> {ingredients.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
