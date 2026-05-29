/**
 * validators.js — Input validation and data integrity checks
 * Defensive functions to prevent invalid game state
 */

/**
 * Validate player name (2-20 chars, alphanumeric + spaces)
 * @param {string} name
 * @returns {{valid: boolean, error: string}}
 */
export function validatePlayerName(name) {
  if (typeof name !== 'string') {
    return { valid: false, error: 'El nombre debe ser texto.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'El nombre no puede tener más de 20 caracteres.' };
  }
  if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(trimmed)) {
    return { valid: false, error: 'El nombre solo puede contener letras y espacios.' };
  }
  return { valid: true, error: '' };
}

/**
 * Validate that a class selection is valid
 * @param {string} className
 * @param {Object} validClasses — CLASSES constant
 * @returns {boolean}
 */
export function validateClass(className, validClasses) {
  return Object.values(validClasses).includes(className);
}

/**
 * Validate save data structure integrity
 * @param {Object} saveData
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateSaveData(saveData) {
  const errors = [];

  if (!saveData || typeof saveData !== 'object') {
    return { valid: false, errors: ['Save data is not an object.'] };
  }

  const requiredFields = ['player', 'gameState', 'version', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in saveData)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (saveData.player) {
    if (typeof saveData.player.name !== 'string') errors.push('Invalid player name.');
    if (typeof saveData.player.level !== 'number' || saveData.player.level < 1) errors.push('Invalid player level.');
    if (typeof saveData.player.hp !== 'number' || saveData.player.hp < 0) errors.push('Invalid player HP.');
    if (typeof saveData.player.gold !== 'number' || saveData.player.gold < 0) errors.push('Invalid player gold.');
    if (!Array.isArray(saveData.player.inventory)) errors.push('Invalid inventory.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a number is positive and finite
 * @param {number} value
 * @param {string} fieldName
 * @returns {{valid: boolean, error: string}}
 */
export function validatePositiveNumber(value, fieldName) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { valid: false, error: `${fieldName} must be a positive finite number.` };
  }
  return { valid: true, error: '' };
}

/**
 * Sanitize a number to ensure it's safe
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
export function sanitizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Validate inventory item structure
 * @param {Object} item
 * @returns {boolean}
 */
export function validateItem(item) {
  if (!item || typeof item !== 'object') return false;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.type === 'string'
  );
}
