/**
 * constants.js — Game-wide constants and configuration
 * Single source of truth for all magic numbers and static values
 */

export const GAME_VERSION = '1.0.0';
export const GAME_TITLE = 'Crónicas de Aethermoor';
export const SAVE_KEY = 'rpg_adventure_save';
export const AUTO_SAVE_INTERVAL = 60000; // 1 minute

// ---- Screens ----
export const SCREENS = Object.freeze({
  MENU: 'menu',
  CREATION: 'creation',
  GAME: 'game',
  COMBAT: 'combat',
  SHOP: 'shop',
  INVENTORY: 'inventory',
  QUEST_LOG: 'quest-log',
  GAME_OVER: 'game-over',
  VICTORY: 'victory',
  DEATH: 'death',
});

// ---- Player Classes ----
export const CLASSES = Object.freeze({
  WARRIOR: 'warrior',
  ARCHER: 'archer',
  MAGE: 'mage',
});

// ---- Item Rarity ----
export const RARITY = Object.freeze({
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
});

export const RARITY_MULTIPLIER = Object.freeze({
  [RARITY.COMMON]: 1,
  [RARITY.RARE]: 2.5,
  [RARITY.EPIC]: 5,
  [RARITY.LEGENDARY]: 12,
});

// ---- Item Types ----
export const ITEM_TYPE = Object.freeze({
  WEAPON: 'weapon',
  ARMOR: 'armor',
  HELMET: 'helmet',
  SHIELD: 'shield',
  ACCESSORY: 'accessory',
  POTION: 'potion',
  MATERIAL: 'material',
});

// ---- Equipment Slots ----
export const EQUIP_SLOTS = Object.freeze({
  WEAPON: 'weapon',
  ARMOR: 'armor',
  HELMET: 'helmet',
  SHIELD: 'shield',
  ACCESSORY: 'accessory',
});

// ---- Quest Types ----
export const QUEST_TYPE = Object.freeze({
  MAIN: 'main',
  SECONDARY: 'secondary',
  DAILY: 'daily',
});

// ---- Quest Status ----
export const QUEST_STATUS = Object.freeze({
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TURNED_IN: 'turned_in',
});

// ---- Combat Actions ----
export const COMBAT_ACTIONS = Object.freeze({
  ATTACK: 'attack',
  DEFEND: 'defend',
  SKILL: 'skill',
  ITEM: 'item',
  FLEE: 'flee',
});

// ---- Status Effects ----
export const STATUS_EFFECT = Object.freeze({
  POISON: 'poison',
  BURN: 'burn',
  FREEZE: 'freeze',
  STUN: 'stun',
});

// ---- Map Regions ----
export const REGIONS = Object.freeze({
  VILLAGE: 'aldea-luminara',
  FOREST: 'bosque-sombrio',
  CAVE: 'cueva-cristalina',
  MOUNTAIN: 'montana-tormenta',
  CASTLE: 'castillo-oscuro',
});

// ---- Level/EXP Curve ----
export const MAX_LEVEL = 20;

/**
 * Calculate EXP required for a given level
 * @param {number} level
 * @returns {number}
 */
export function expForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// ---- Combat Formulas ----
export const COMBAT = Object.freeze({
  CRIT_MULTIPLIER: 1.8,
  DEFEND_MULTIPLIER: 0.5, // damage taken when defending
  FLEE_BASE_CHANCE: 0.4,
  MIN_DAMAGE: 1,
  DAMAGE_VARIANCE: 0.1, // ±10%
  STATUS_DURATION: 3, // turns
  POISON_TICK: 0.05, // 5% max HP per turn
  BURN_TICK: 0.08,
  FREEZE_SKIP_CHANCE: 0.5,
});

// ---- NPC Roles ----
export const NPC_ROLE = Object.freeze({
  MERCHANT: 'merchant',
  BLACKSMITH: 'blacksmith',
  HEALER: 'healer',
  QUEST_GIVER: 'quest_giver',
  STORY: 'story',
});

// ---- Events ----
export const EVENTS = Object.freeze({
  // Game lifecycle
  GAME_INIT: 'game:init',
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  GAME_OVER: 'game:over',

  // Screen
  SCREEN_CHANGE: 'screen:change',

  // Player
  PLAYER_CREATED: 'player:created',
  PLAYER_LEVEL_UP: 'player:levelUp',
  PLAYER_DIED: 'player:died',
  PLAYER_HEAL: 'player:heal',

  // Combat
  COMBAT_START: 'combat:start',
  COMBAT_ACTION: 'combat:action',
  COMBAT_TURN_END: 'combat:turnEnd',
  COMBAT_WIN: 'combat:win',
  COMBAT_LOSE: 'combat:lose',
  COMBAT_FLEE: 'combat:flee',

  // Inventory
  ITEM_ACQUIRED: 'item:acquired',
  ITEM_USED: 'item:used',
  ITEM_EQUIPPED: 'item:equipped',
  ITEM_SOLD: 'item:sold',
  ITEM_BOUGHT: 'item:bought',

  // Quest
  QUEST_ACCEPTED: 'quest:accepted',
  QUEST_PROGRESS: 'quest:progress',
  QUEST_COMPLETED: 'quest:completed',

  // Map
  REGION_ENTER: 'region:enter',
  REGION_UNLOCK: 'region:unlock',

  // NPC
  NPC_INTERACT: 'npc:interact',
  DIALOG_START: 'dialog:start',
  DIALOG_END: 'dialog:end',

  // Random events
  EVENT_TRIGGER: 'event:trigger',

  // UI
  TOAST_SHOW: 'toast:show',
  LOG_MESSAGE: 'log:message',
});
