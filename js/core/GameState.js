/**
 * GameState.js — Centralized reactive game state
 * Single source of truth for all mutable game data.
 * All state mutations go through this module.
 */

import { eventBus } from './EventBus.js';
import { REGIONS, SCREENS, EVENTS } from '../utils/constants.js';
import { deepClone } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class GameState {
  constructor() {
    this._state = this._getDefaultState();
  }

  /**
   * Default state shape — used for new games
   * @private
   * @returns {Object}
   */
  _getDefaultState() {
    return {
      currentScreen: SCREENS.MENU,
      player: null,
      currentRegion: REGIONS.VILLAGE,
      unlockedRegions: [REGIONS.VILLAGE],
      activeQuests: [],
      completedQuests: [],
      combat: null, // active combat data
      gameTime: 0, // total play time in seconds
      flags: {}, // story progression flags
      randomEventCooldown: 0,
    };
  }

  /**
   * Get a deep clone of the full state (safe read)
   * @returns {Object}
   */
  getState() {
    return deepClone(this._state);
  }

  /**
   * Get a specific state value by path (e.g. "player.level")
   * @param {string} path — dot-notation path
   * @returns {*}
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this._state);
  }

  /**
   * Set a state value by path
   * @param {string} path
   * @param {*} value
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this._state;

    for (const key of keys) {
      if (target[key] === undefined || target[key] === null) {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
    logger.debug(`State set: ${path}`, typeof value === 'object' ? '' : `= ${value}`);
  }

  /**
   * Set the player data
   * @param {Object} playerData
   */
  setPlayer(playerData) {
    this._state.player = playerData;
    eventBus.emit(EVENTS.PLAYER_CREATED, playerData);
  }

  /**
   * Get player data reference (for frequent reads during combat)
   * @returns {Object|null}
   */
  getPlayer() {
    return this._state.player;
  }

  /**
   * Update current screen
   * @param {string} screen
   */
  setScreen(screen) {
    const previous = this._state.currentScreen;
    this._state.currentScreen = screen;
    eventBus.emit(EVENTS.SCREEN_CHANGE, { from: previous, to: screen });
  }

  /**
   * Change current region
   * @param {string} regionId
   */
  setRegion(regionId) {
    this._state.currentRegion = regionId;
    eventBus.emit(EVENTS.REGION_ENTER, { regionId });
  }

  /**
   * Unlock a new region
   * @param {string} regionId
   */
  unlockRegion(regionId) {
    if (!this._state.unlockedRegions.includes(regionId)) {
      this._state.unlockedRegions.push(regionId);
      eventBus.emit(EVENTS.REGION_UNLOCK, { regionId });
    }
  }

  /**
   * Check if a region is unlocked
   * @param {string} regionId
   * @returns {boolean}
   */
  isRegionUnlocked(regionId) {
    return this._state.unlockedRegions.includes(regionId);
  }

  /**
   * Set combat state
   * @param {Object|null} combatData
   */
  setCombat(combatData) {
    this._state.combat = combatData;
  }

  /**
   * Get combat state
   * @returns {Object|null}
   */
  getCombat() {
    return this._state.combat;
  }

  /**
   * Add quest to active list
   * @param {string} questId
   */
  addActiveQuest(questId) {
    if (!this._state.activeQuests.includes(questId)) {
      this._state.activeQuests.push(questId);
    }
  }

  /**
   * Complete a quest
   * @param {string} questId
   */
  completeQuest(questId) {
    this._state.activeQuests = this._state.activeQuests.filter(id => id !== questId);
    if (!this._state.completedQuests.includes(questId)) {
      this._state.completedQuests.push(questId);
    }
  }

  /**
   * Set a story flag
   * @param {string} flag
   * @param {*} value
   */
  setFlag(flag, value = true) {
    this._state.flags[flag] = value;
  }

  /**
   * Check a story flag
   * @param {string} flag
   * @returns {*}
   */
  getFlag(flag) {
    return this._state.flags[flag];
  }

  /**
   * Load full state from save data
   * @param {Object} saveState
   */
  loadState(saveState) {
    this._state = { ...this._getDefaultState(), ...saveState };
    logger.info('GameState loaded from save');
  }

  /**
   * Export state for saving
   * @returns {Object}
   */
  exportState() {
    return deepClone(this._state);
  }

  /**
   * Reset to default (new game)
   */
  reset() {
    this._state = this._getDefaultState();
    logger.info('GameState reset');
  }
}

// Singleton
export const gameState = new GameState();
