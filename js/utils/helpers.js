/**
 * helpers.js — Pure utility functions used across the project
 * No side effects, no state, no dependencies on game modules
 */

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Roll a probability check (0 to 1)
 * @param {number} chance — probability 0..1
 * @returns {boolean}
 */
export function rollChance(chance) {
  return Math.random() < chance;
}

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Deep clone an object (JSON-safe only)
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Pick a random element from an array
 * @param {Array} array
 * @returns {*}
 */
export function randomPick(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[randomInt(0, array.length - 1)];
}

/**
 * Pick from weighted array [{item, weight}]
 * @param {Array<{item: *, weight: number}>} weightedArray
 * @returns {*}
 */
export function weightedPick(weightedArray) {
  const totalWeight = weightedArray.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of weightedArray) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }

  return weightedArray[weightedArray.length - 1].item;
}

/**
 * Format a number with commas (1234 -> "1,234")
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString('es-ES');
}

/**
 * Calculate percentage
 * @param {number} current
 * @param {number} max
 * @returns {number}
 */
export function percentage(current, max) {
  if (max <= 0) return 0;
  return clamp((current / max) * 100, 0, 100);
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Wait for ms (for async sequences)
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON, returning fallback on failure
 * @param {string} json
 * @param {*} fallback
 * @returns {*}
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
