import { RecommendationResult, VendorRawQuotes, StructuredVendorData } from "../types";

// In-memory cache with access timestamps for true LRU eviction
interface CacheEntry {
  val: string;
  ts: number;
}
const clientTranslationCache = new Map<string, CacheEntry>();
const MAX_CACHE_ITEMS = 1000;

// Try loading persisted translations from localStorage
try {
  const persisted = localStorage.getItem("lantern_translations_cache");
  if (persisted) {
    const parsed = JSON.parse(persisted);
    Object.entries(parsed).forEach(([k, v]) => {
      if (typeof v === "string") {
        clientTranslationCache.set(k, { val: v, ts: Date.now() });
      } else if (v && typeof (v as any).val === "string") {
        clientTranslationCache.set(k, { val: (v as any).val, ts: (v as any).ts || Date.now() });
      }
    });
  }
} catch (e) {
  // Local storage unavailable or disabled
}

function getCached(key: string): string | null {
  const entry = clientTranslationCache.get(key);
  if (!entry) return null;
  // Update timestamp for LRU
  entry.ts = Date.now();
  return entry.val;
}

function setCached(key: string, val: string) {
  clientTranslationCache.set(key, { val, ts: Date.now() });
  // If capacity exceeded, evict oldest 20%
  if (clientTranslationCache.size > MAX_CACHE_ITEMS) {
    const entries = Array.from(clientTranslationCache.entries()).sort((a, b) => a[1].ts - b[1].ts);
    const toRemove = Math.floor(MAX_CACHE_ITEMS * 0.2);
    for (let i = 0; i < toRemove; i++) {
      clientTranslationCache.delete(entries[i][0]);
    }
  }
}

function saveCache() {
  try {
    const obj: Record<string, { val: string; ts: number }> = {};
    // Save most recent 600 items
    const entries = Array.from(clientTranslationCache.entries())
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 600);
    
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    localStorage.setItem("lantern_translations_cache", JSON.stringify(obj));
  } catch (e) {}
}

/**
 * Translate a single text using Google AI Neural Realtime Translation
 */
export async function translateText(
  text: string,
  targetLang: "ar" | "en" = "ar",
  sourceLang: "ar" | "en" = "en"
): Promise<string> {
  if (!text || text.trim() === "") return text;
  if (targetLang === sourceLang) return text;

  const cacheKey = `${sourceLang}->${targetLang}:${text.trim()}`;
  const cachedVal = getCached(cacheKey);
  if (cachedVal) {
    return cachedVal;
  }

  try {
    const res = await fetch("/api/translate-realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
        context: "procurement",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        setCached(cacheKey, data.text);
        saveCache();
        return data.text;
      }
    }
  } catch (err) {
    console.warn("Real-time translation API error:", err);
  }

  return text;
}

/**
 * Translate a batch of key-value text pairs
 */
export async function translateBatch(
  items: Record<string, string>,
  targetLang: "ar" | "en" = "ar",
  sourceLang: "ar" | "en" = "en"
): Promise<Record<string, string>> {
  if (!items || Object.keys(items).length === 0) return {};
  if (targetLang === sourceLang) return { ...items };

  const result: Record<string, string> = {};
  const missingItems: Record<string, string> = {};

  for (const [k, v] of Object.entries(items)) {
    if (!v || typeof v !== "string" || v.trim() === "") {
      result[k] = v;
      continue;
    }
    const cacheKey = `${sourceLang}->${targetLang}:${v.trim()}`;
    const cachedVal = getCached(cacheKey);
    if (cachedVal) {
      result[k] = cachedVal;
    } else {
      missingItems[k] = v;
    }
  }

  if (Object.keys(missingItems).length === 0) {
    return result;
  }

  try {
    const res = await fetch("/api/translate-realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: missingItems,
        targetLang,
        sourceLang,
        context: "procurement",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.translations) {
        Object.entries(data.translations).forEach(([k, translatedVal]) => {
          if (typeof translatedVal === "string") {
            result[k] = translatedVal;
            const originalVal = missingItems[k];
            if (originalVal) {
              const cacheKey = `${sourceLang}->${targetLang}:${originalVal.trim()}`;
              setCached(cacheKey, translatedVal);
            }
          }
        });
        saveCache();
      }
    }
  } catch (err) {
    console.warn("Real-time batch translation API error:", err);
  }

  // Fill any remaining with original values
  for (const [k, v] of Object.entries(missingItems)) {
    if (!result[k]) {
      result[k] = v;
    }
  }

  return result;
}

/**
 * High-Proficiency Realtime Translation of RecommendationResult
 */
export async function translateRecommendationObject(
  rec: RecommendationResult,
  targetLang: "ar" | "en" = "ar"
): Promise<RecommendationResult> {
  if (!rec || targetLang === "en") return rec;

  const itemsToTranslate: Record<string, string> = {
    title: rec.recommendationTitle || "",
    narrative: rec.narrative || "",
  };

  (rec.drivingCriteria || []).forEach((c, idx) => {
    itemsToTranslate[`crit_${idx}`] = c;
  });

  (rec.keyRisks || []).forEach((r, idx) => {
    itemsToTranslate[`risk_${idx}`] = r;
  });

  (rec.negotiationTips || []).forEach((n, idx) => {
    itemsToTranslate[`tip_${idx}`] = n;
  });

  (rec.excludedVendors || []).forEach((ev, idx) => {
    itemsToTranslate[`excl_${idx}`] = ev.reason || "";
  });

  const translated = await translateBatch(itemsToTranslate, "ar", "en");

  return {
    ...rec,
    recommendationTitle: translated.title || rec.recommendationTitle,
    narrative: translated.narrative || rec.narrative,
    drivingCriteria: (rec.drivingCriteria || []).map((_, idx) => translated[`crit_${idx}`] || _),
    keyRisks: (rec.keyRisks || []).map((_, idx) => translated[`risk_${idx}`] || _),
    negotiationTips: (rec.negotiationTips || []).map((_, idx) => translated[`tip_${idx}`] || _),
    excludedVendors: (rec.excludedVendors || []).map((ev, idx) => ({
      ...ev,
      reason: translated[`excl_${idx}`] || ev.reason,
    })),
  };
}
