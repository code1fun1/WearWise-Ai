/**
 * Style Learning Engine
 *
 * Analyses selected and rejected outfits and produces a preference
 * update that gets merged into User.preferences in MongoDB.
 *
 * Strategy:
 *  - SELECTED outfit items → reinforce those attributes (colors, styles, patterns)
 *  - REJECTED outfit items → penalise attributes that appear in ALL rejections
 *    (only mark something "avoided" if it was consistently rejected, not just once)
 *
 * Preferences are stored as arrays with a max length of 10 to avoid
 * unbounded growth.  New signals are added to the front; old ones fall off.
 */

const MAX_PREFS = 10;

/**
 * @param {object} currentPrefs  - User.preferences from MongoDB
 * @param {Array}  selectedItems - ClothingItem docs from the selected outfit
 * @param {Array}  rejectedItems - Flat array of ClothingItem docs from ALL rejected outfits
 * @returns {object} MongoDB $set-compatible preferences object
 */
export function computePreferenceUpdate(currentPrefs, selectedItems, rejectedItems) {
  const prefs = {
    preferredColors:   [...(currentPrefs?.preferredColors  || [])],
    avoidedColors:     [...(currentPrefs?.avoidedColors    || [])],
    preferredStyles:   [...(currentPrefs?.preferredStyles  || [])],
    avoidedStyles:     [...(currentPrefs?.avoidedStyles    || [])],
    preferredPatterns: [...(currentPrefs?.preferredPatterns|| [])],
    commonOccasions:   [...(currentPrefs?.commonOccasions  || [])],
  };

  // ── Reinforce selected outfit ────────────────────────────────
  if (selectedItems?.length) {
    selectedItems.forEach((item) => {
      if (item.color)   prefs.preferredColors   = addSignal(prefs.preferredColors,   item.color);
      if (item.style)   prefs.preferredStyles   = addSignal(prefs.preferredStyles,   item.style);
      if (item.pattern) prefs.preferredPatterns = addSignal(prefs.preferredPatterns, item.pattern);
      if (item.occasion?.length) {
        item.occasion.forEach((occ) => {
          prefs.commonOccasions = addSignal(prefs.commonOccasions, occ);
        });
      }
    });
  }

  // ── Penalise consistently rejected attributes ────────────────
  if (rejectedItems?.length) {
    // Count how many rejected outfits contained each attribute
    const colorCount   = countAttributes(rejectedItems, "color");
    const styleCount   = countAttributes(rejectedItems, "style");

    // Only add to "avoided" if it appeared in 2+ rejected outfits
    // AND is not already in the "preferred" list
    Object.entries(colorCount).forEach(([color, count]) => {
      if (count >= 2 && !prefs.preferredColors.includes(color)) {
        prefs.avoidedColors = addSignal(prefs.avoidedColors, color);
        // Remove from preferred if present
        prefs.preferredColors = prefs.preferredColors.filter((c) => c !== color);
      }
    });

    Object.entries(styleCount).forEach(([style, count]) => {
      if (count >= 2 && !prefs.preferredStyles.includes(style)) {
        prefs.avoidedStyles = addSignal(prefs.avoidedStyles, style);
        prefs.preferredStyles = prefs.preferredStyles.filter((s) => s !== style);
      }
    });
  }

  return prefs;
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Add a signal to the front of an array, dedup, cap at MAX_PREFS.
 */
function addSignal(arr, value) {
  if (!value) return arr;
  const deduped = arr.filter((v) => v !== value);
  return [value, ...deduped].slice(0, MAX_PREFS);
}

/**
 * Count how many items have a particular attribute value.
 * Returns { value: count } map.
 */
function countAttributes(items, key) {
  const counts = {};
  items.forEach((item) => {
    const val = item[key];
    if (val) counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}
