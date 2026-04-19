/**
 * Wardrobe Pre-Filter
 *
 * Narrows down clothing items BEFORE sending to Gemini.
 * Smaller, relevant wardrobe = better outfit quality + fewer tokens used.
 *
 * Filtering priority:
 *  1. Season match (hard filter — unless item is "all season")
 *  2. Occasion match (soft filter — falls back to full wardrobe if too few)
 *  3. Weather filter (removes heavy/light items when inappropriate)
 */

/**
 * @param {Array}  items          - All ClothingItem documents for the user
 * @param {object} occasionMeta   - Result of mapOccasionToStyle()
 * @param {object} weather        - { temp, condition }
 * @returns {Array} filtered items (minimum 3 to ensure outfit is possible)
 */
export function filterWardrobeForOutfit(items, occasionMeta, weather) {
  let filtered = [...items];

  // ── Step 1: Season filter ────────────────────────────────────
  const currentSeason = getSeasonFromWeather(weather);
  filtered = filtered.filter(
    (item) => item.season === "all" || item.season === currentSeason
  );

  // Fallback: if too few items remain, restore all
  if (filtered.length < 3) filtered = [...items];

  // ── Step 2: Occasion + Style filter ─────────────────────────
  const occasionFiltered = filtered.filter((item) => {
    const styleMatch = occasionMeta.styles.some(
      (s) => item.style?.toLowerCase() === s
    );
    const occasionMatch = item.occasion?.some((o) =>
      occasionMeta.occasions.includes(o)
    );
    return styleMatch || occasionMatch;
  });

  // Fallback: if less than 3 items match, use the season-filtered set
  if (occasionFiltered.length >= 3) filtered = occasionFiltered;

  // ── Step 3: Weather filter ───────────────────────────────────
  filtered = applyWeatherFilter(filtered, weather);

  // Final fallback: always return at least what we started with
  return filtered.length >= 2 ? filtered : items;
}

// ── Helpers ──────────────────────────────────────────────────────

function getSeasonFromWeather({ temp, condition }) {
  if (
    condition === "Rain" ||
    condition === "Drizzle" ||
    condition === "Thunderstorm"
  )
    return "monsoon";
  if (temp >= 30) return "summer";
  if (temp <= 14) return "winter";
  return "spring";
}

function applyWeatherFilter(items, { temp, condition }) {
  const isRainy = ["Rain", "Drizzle", "Thunderstorm"].includes(condition);
  const isHot = temp >= 32;
  const isCold = temp <= 12;

  return items.filter((item) => {
    const type = item.type?.toLowerCase();

    // In hot weather remove heavy outer layers
    if (isHot && ["coat", "jacket", "sweater", "hoodie"].includes(type)) {
      return false;
    }

    // In cold weather, don't filter out anything (layers are good)
    // In rainy weather remove pure-white or very light delicate items
    if (isRainy && item.color?.toLowerCase().includes("white")) {
      return false;
    }

    return true;
  });
}
