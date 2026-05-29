/**
 * SaveService.js — Manages saving and loading game state asynchronously to IndexedDB via localforage
 */

import localforage from 'localforage';
import { SAVE_KEY, GAME_VERSION } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { validateSaveData } from '../utils/validators.js';
import logger from '../utils/logger.js';

// Configure localforage db
localforage.config({
  name: 'CronicasAethermoor',
  storeName: 'game_saves',
  description: 'Saved state for Crónicas de Aethermoor'
});

export class SaveService {
  constructor() {
    this._hasSaveCached = false;
  }

  /**
   * Asynchronously initialize the save cache state
   */
  async init() {
    try {
      const data = await localforage.getItem(SAVE_KEY);
      this._hasSaveCached = (data !== null);
      logger.info(`SaveService initialized. Cached hasSave: ${this._hasSaveCached}`);
    } catch (e) {
      logger.error('Failed to initialize localforage save state:', e);
      this._hasSaveCached = false;
    }
  }

  /**
   * Synchronously check if save data exists from cache
   * @returns {boolean}
   */
  hasSave() {
    return this._hasSaveCached;
  }

  /**
   * Save current GameState to Localforage
   */
  async save() {
    try {
      const data = {
        version: GAME_VERSION,
        timestamp: Date.now(),
        player: gameState.getPlayer(),
        gameState: gameState.exportState()
      };

      await localforage.setItem(SAVE_KEY, data);
      this._hasSaveCached = true;
      logger.info('Game state successfully saved to Localforage (IndexedDB)');
      return true;
    } catch (err) {
      logger.error('Failed to save game state to localforage:', err.message);
      return false;
    }
  }

  /**
   * Load GameState from Localforage
   * @returns {Promise<boolean>} successful load
   */
  async load() {
    try {
      const rawData = await localforage.getItem(SAVE_KEY);
      if (!rawData) {
        logger.warn('No save data found to load');
        return false;
      }

      const integrity = validateSaveData(rawData);
      if (!integrity.valid) {
        logger.error('Corrupted save data found:', integrity.errors.join(', '));
        return false;
      }

      // Restore central game state
      gameState.loadState(rawData.gameState);
      this._hasSaveCached = true;
      logger.info('Game state successfully rehydrated and loaded from localforage');
      return true;
    } catch (err) {
      logger.error('Failed to load game state:', err.message);
      return false;
    }
  }

  /**
   * Clear saved game state
   */
  async deleteSave() {
    try {
      await localforage.removeItem(SAVE_KEY);
      this._hasSaveCached = false;
      logger.info('Saved game state deleted successfully from localforage');
      return true;
    } catch (e) {
      logger.error('Failed to delete save:', e);
      return false;
    }
  }
}
