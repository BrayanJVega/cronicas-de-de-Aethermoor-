/**
 * GameEngine.js — Main game orchestrator
 * Initializes all systems, manages game loop, coordinates modules
 */

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { EVENTS, SCREENS, SAVE_KEY, AUTO_SAVE_INTERVAL, GAME_VERSION } from '../utils/constants.js';
import { SaveService } from '../services/SaveService.js';
import { CombatService } from '../services/CombatService.js';
import { InventoryService } from '../services/InventoryService.js';
import { QuestService } from '../services/QuestService.js';
import { ShopService } from '../services/ShopService.js';
import { MapService } from '../services/MapService.js';
import { ScreenManager } from '../ui/ScreenManager.js';
import logger from '../utils/logger.js';

class GameEngine {
  constructor() {
    this.services = {};
    this.screenManager = null;
    this.autoSaveTimer = null;
    this.isRunning = false;
  }

  /**
   * Initialize the game engine and all subsystems
   */
  async init() {
    logger.info('🎮 GameEngine initializing...');

    // 1. Initialize services
    this.services.save = new SaveService();
    this.services.combat = new CombatService();
    this.services.inventory = new InventoryService();
    this.services.quest = new QuestService();
    this.services.shop = new ShopService();
    this.services.map = new MapService();

    // 2. Initialize UI
    this.screenManager = this.screenManager || new ScreenManager();

    // 3. Register global event listeners
    this._registerEvents();

    // 4. Initialize save system asynchronously and then launch the UI
    this.services.save.init().then(() => {
      const hasSave = this.services.save.hasSave();
      logger.info(`Save data found: ${hasSave}`);

      // 5. Show menu
      gameState.setScreen(SCREENS.MENU);

      this.isRunning = true;
      eventBus.emit(EVENTS.GAME_INIT, { hasSave });

      logger.info('🎮 GameEngine ready!');
    });
  }

  /**
   * Start a new game with given player data
   * @param {Object} playerData
   */
  newGame(playerData) {
    logger.info('Starting new game for:', playerData.name);

    // Reset state
    gameState.reset();
    gameState.setPlayer(playerData);

    // Initialize quest system
    this.services.quest.initializeQuests();

    // Start auto-save
    this._startAutoSave();

    // Navigate to game screen
    gameState.setScreen(SCREENS.GAME);

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `¡Bienvenido a Aethermoor, ${playerData.name}! Tu aventura comienza...`,
      type: 'system',
    });
  }

  async loadGame() {
    const success = await this.services.save.load();
    if (success) {
      // Synchronize region unlocks with quest progress and flags in case old save loaded
      const tracking = gameState.get('questsTracking');
      if (tracking) {
        if (tracking['quest_main_1'] && tracking['quest_main_1'].status !== 'available') {
          gameState.unlockRegion('bosque-sombrio');
        }
      }
      if (gameState.getFlag('unlocked_cueva')) {
        gameState.unlockRegion('cueva-cristalina');
      }
      if (gameState.getFlag('unlocked_montana')) {
        gameState.unlockRegion('montana-tormenta');
      }
      if (gameState.getFlag('unlocked_castillo')) {
        gameState.unlockRegion('castillo-oscuro');
      }

      this._startAutoSave();
      gameState.setScreen(SCREENS.GAME);
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: 'Partida cargada exitosamente.',
        type: 'system',
      });
    } else {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: 'Error al cargar la partida.',
        type: 'error',
      });
    }
  }

  /**
   * Save current game
   */
  async saveGame() {
    const success = await this.services.save.save();
    if (success) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '💾 Partida guardada',
        type: 'success',
      });
    }
  }

  /**
   * Register global event handlers
   * @private
   */
  _registerEvents() {
    eventBus.on(EVENTS.GAME_SAVE, () => this.saveGame());
    eventBus.on(EVENTS.GAME_LOAD, () => this.loadGame());

    eventBus.on(EVENTS.PLAYER_DIED, () => {
      this._stopAutoSave();
      gameState.setScreen(SCREENS.GAME_OVER);
    });

    eventBus.on(EVENTS.COMBAT_WIN, (data) => {
      this._handleCombatRewards(data);
    });

    eventBus.on(EVENTS.PLAYER_LEVEL_UP, (data) => {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: `🎉 ¡Nivel ${data.newLevel} alcanzado!`,
        type: 'gold',
      });
    });

    // Toast display
    eventBus.on(EVENTS.TOAST_SHOW, (data) => {
      this.screenManager.showToast(data.message, data.type);
    });
  }

  /**
   * Handle rewards after winning combat
   * @private
   * @param {Object} data — { enemy, expGained, goldGained, loot }
   */
  _handleCombatRewards(data) {
    const player = gameState.getPlayer();

    // Grant EXP
    player.exp += data.expGained;

    // Grant gold
    player.gold += data.goldGained;

    // Add loot to inventory
    if (data.loot && data.loot.length > 0) {
      for (const item of data.loot) {
        this.services.inventory.addItem(item);
      }
    }

    // Check level up
    this.services.inventory.checkLevelUp(player);

    // Check quest progress
    this.services.quest.checkCombatProgress(data.enemy);

    // Return to game screen
    gameState.setScreen(SCREENS.GAME);
  }

  /**
   * Start auto-save timer
   * @private
   */
  _startAutoSave() {
    this._stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.services.save.save();
      logger.debug('Auto-saved');
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   * @private
   */
  _stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

// Singleton
export const gameEngine = new GameEngine();
