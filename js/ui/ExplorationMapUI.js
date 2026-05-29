/**
 * ExplorationMapUI.js — High-fidelity 2D visual adventure exploration map using Phaser & EasyStar.js.
 * Displays procedural maps with obstacles, roaming enemies, treasure chests, and pathfinding.
 */

import Phaser from 'phaser';
import EasyStar from 'easystarjs';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { audioManager } from '../services/AudioManager.js';
import { MAP_DATA } from '../data/maps.js';
import { REGIONS, SCREENS, EVENTS } from '../utils/constants.js';
import logger from '../utils/logger.js';

// Configuration constants for the grid
const TILE_SIZE = 48;
const GRID_COLS = 16;
const GRID_ROWS = 12;

class ExplorationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ExplorationScene' });
  }

  init(data) {
    this.regionId = data.regionId || REGIONS.VILLAGE;
    this.regionData = MAP_DATA[this.regionId];
    this.parentUI = data.parentUI;

    this.grid = [];
    this.playerGridPos = { x: 1, y: 1 };
    this.exitGridPos = { x: 14, y: 10 };
    this.chests = [];
    this.enemies = [];
    this.isMoving = false;
    this.moveQueue = [];

    // Configure theme variables
    this.theme = this._getRegionTheme(this.regionId);
  }

  create() {
    logger.info(`🗺️ Phaser ExplorationScene loading region: ${this.regionId}`);

    // Initialize EasyStar pathfinder
    this.easystar = new EasyStar.js();
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();

    // 1. Generate grid and obstacles
    this._generateMapGrid();

    // 2. Draw ground tiles and obstacles
    this._renderMapGraphics();

    // 3. Spawn Interactive Items
    this._spawnPortal();
    this._spawnChests();
    this._spawnEnemies();

    // 4. Spawn Player
    this._spawnPlayer();

    // 5. Initialize pathfinder grid
    this.easystar.setGrid(this.grid);
    this.easystar.setAcceptableTiles([0]);

    // 6. Setup Inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Map click handling for pathfinding
    this.input.on('pointerdown', (pointer) => {
      const clickedCol = Math.floor(pointer.x / TILE_SIZE);
      const clickedRow = Math.floor(pointer.y / TILE_SIZE);

      if (this._isValidGridPos(clickedCol, clickedRow)) {
        this._calculateAndMoveTo(clickedCol, clickedRow);
      }
    });

    // Instructions display overlay
    this.add.text(15, this.scale.height - 35, '⌨ WASD/Flechas: Mover | 🖱 Clic: Auto-Ruta | 🌀 Portal: Salir', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#e2e8f0',
      backgroundColor: '#0f172aa0',
      padding: { x: 8, y: 4 },
      borderRadius: 4
    }).setDepth(100);
  }

  update(time, delta) {
    if (this.isMoving) return;

    // Check keyboard inputs for single-tile movement step
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) dx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) dx = 1;
    else if (this.cursors.up.isDown || this.wasd.up.isDown) dy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) dy = 1;

    if (dx !== 0 || dy !== 0) {
      const nextX = this.playerGridPos.x + dx;
      const nextY = this.playerGridPos.y + dy;

      if (this._isWalkable(nextX, nextY)) {
        // Clear click path queue when using manual keyboard movement
        this.moveQueue = [];
        this._movePlayerToTile(nextX, nextY);
      }
    } else if (this.moveQueue.length > 0) {
      // Execute next step in path queue
      const nextStep = this.moveQueue.shift();
      this._movePlayerToTile(nextStep.x, nextStep.y);
    }

    // Process EasyStar calculations
    this.easystar.calculate();
  }

  // --- Map Generation Helpers ---

  _getRegionTheme(regionId) {
    switch (regionId) {
      case REGIONS.FOREST:
        return {
          bg: 0x052e16,
          gridBorder: 0x15803d,
          obstacleEmoji: '🌲',
          groundColor: 0x064e3b,
          monsterEmoji: '🐺'
        };
      case REGIONS.CAVE:
        return {
          bg: 0x1e1b4b,
          gridBorder: 0x4338ca,
          obstacleEmoji: '💎',
          groundColor: 0x312e81,
          monsterEmoji: '💀'
        };
      case REGIONS.MOUNTAIN:
        return {
          bg: 0x1c1917,
          gridBorder: 0x57534e,
          obstacleEmoji: '🪨',
          groundColor: 0x292524,
          monsterEmoji: '🧙‍♂️'
        };
      case REGIONS.CASTLE:
        return {
          bg: 0x450a0a,
          gridBorder: 0x991b1b,
          obstacleEmoji: '🧱',
          groundColor: 0x7f1d1d,
          monsterEmoji: '😈'
        };
      case REGIONS.VILLAGE:
      default:
        return {
          bg: 0x022c22,
          gridBorder: 0x047857,
          obstacleEmoji: '🌳',
          groundColor: 0x065f46,
          monsterEmoji: '👾'
        };
    }
  }

  _generateMapGrid() {
    // Generate base empty grid (outer borders blocked)
    for (let r = 0; r < GRID_ROWS; r++) {
      const row = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const isBorder = (r === 0 || c === 0 || r === GRID_ROWS - 1 || c === GRID_COLS - 1);
        if (isBorder) {
          row.push(1); // Wall
        } else {
          // 15% chance to place an obstacle, avoiding spawn, exit, and nearby spots
          const isSpawn = (c === 1 && r === 1);
          const isExit = (c === this.exitGridPos.x && r === this.exitGridPos.y);
          if (!isSpawn && !isExit && Math.random() < 0.15) {
            row.push(1); // Obstacle
          } else {
            row.push(0); // Walkable ground
          }
        }
      }
      this.grid.push(row);
    }
  }

  _renderMapGraphics() {
    const graphics = this.add.graphics();

    // Render tile by tile
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        // Draw ground card
        if (this.grid[r][c] === 0) {
          graphics.fillStyle(this.theme.groundColor, 0.4);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          graphics.fillStyle(this.theme.bg, 0.85);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

        // Draw thin grid border
        graphics.lineStyle(1, this.theme.gridBorder, 0.25);
        graphics.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        // Place obstacle emoji texture if blocked (and not border)
        const isBorder = (r === 0 || c === 0 || r === GRID_ROWS - 1 || c === GRID_COLS - 1);
        if (this.grid[r][c] === 1) {
          const emoji = isBorder ? '🪵' : this.theme.obstacleEmoji;
          this.add.text(x + TILE_SIZE / 2, y + TILE_SIZE / 2, emoji, {
            fontSize: '24px'
          }).setOrigin(0.5);
        }
      }
    }
  }

  // --- Entity Spawns ---

  _spawnPlayer() {
    const x = this.playerGridPos.x * TILE_SIZE + TILE_SIZE / 2;
    const y = this.playerGridPos.y * TILE_SIZE + TILE_SIZE / 2;

    const hero = gameState.getPlayer();
    let classEmoji = '🛡️';
    if (hero) {
      if (hero.classType === 'archer') classEmoji = '🏹';
      else if (hero.classType === 'mage') classEmoji = '🧙';
    }

    this.playerSprite = this.add.text(x, y, classEmoji, {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(10);

    // Subtle breathing animation
    this.tweens.add({
      targets: this.playerSprite,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  _spawnPortal() {
    const x = this.exitGridPos.x * TILE_SIZE + TILE_SIZE / 2;
    const y = this.exitGridPos.y * TILE_SIZE + TILE_SIZE / 2;

    this.portalSprite = this.add.text(x, y, '🌀', {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(5);

    // Spin animation
    this.tweens.add({
      targets: this.portalSprite,
      angle: 360,
      duration: 3000,
      repeat: -1
    });
  }

  _spawnChests() {
    // Spawn 2 chests randomly in walkable ground
    let spawned = 0;
    while (spawned < 2) {
      const col = Phaser.Math.Between(2, GRID_COLS - 2);
      const row = Phaser.Math.Between(2, GRID_ROWS - 2);

      if (this.grid[row][col] === 0 &&
          !(col === this.exitGridPos.x && row === this.exitGridPos.y) &&
          !this.chests.some(c => c.gridX === col && c.gridY === row)) {

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const sprite = this.add.text(x, y, '🎁', { fontSize: '26px' }).setOrigin(0.5).setDepth(5);
        
        // Gentle hover float tween
        this.tweens.add({
          targets: sprite,
          y: y - 4,
          duration: 600 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.chests.push({
          gridX: col,
          gridY: row,
          sprite: sprite
        });
        spawned++;
      }
    }
  }

  _spawnEnemies() {
    // Spawn 2 roaming enemies randomly
    let spawned = 0;
    while (spawned < 2) {
      const col = Phaser.Math.Between(3, GRID_COLS - 3);
      const row = Phaser.Math.Between(3, GRID_ROWS - 3);

      if (this.grid[row][col] === 0 &&
          !(col === this.exitGridPos.x && row === this.exitGridPos.y) &&
          !this.chests.some(c => c.gridX === col && c.gridY === row) &&
          !this.enemies.some(e => e.gridX === col && e.gridY === row)) {

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const sprite = this.add.text(x, y, this.theme.monsterEmoji, { fontSize: '26px' }).setOrigin(0.5).setDepth(6);

        const enemyObj = {
          gridX: col,
          gridY: row,
          sprite: sprite,
          roamTimer: null
        };

        // Standard roaming tick handler (moves every 2 seconds)
        enemyObj.roamTimer = this.time.addEvent({
          delay: 2000 + Math.random() * 1000,
          loop: true,
          callback: () => this._roamEnemy(enemyObj)
        });

        this.enemies.push(enemyObj);
        spawned++;
      }
    }
  }

  // --- Movement & Interactivity core ---

  _isValidGridPos(col, row) {
    return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
  }

  _isWalkable(col, row) {
    if (!this._isValidGridPos(col, row)) return false;
    return this.grid[row][col] === 0;
  }

  _calculateAndMoveTo(targetCol, targetRow) {
    if (this.isMoving) return;

    this.easystar.findPath(
      this.playerGridPos.x, this.playerGridPos.y,
      targetCol, targetRow,
      (path) => {
        if (path && path.length > 1) {
          // Remove start node and queue path steps
          this.moveQueue = path.slice(1);
        } else {
          audioManager.playSfx('hover', 0.1);
        }
      }
    );
    this.easystar.calculate();
  }

  _movePlayerToTile(targetCol, targetRow) {
    this.isMoving = true;
    
    // Animate sprite hopping movement
    const targetX = targetCol * TILE_SIZE + TILE_SIZE / 2;
    const targetY = targetRow * TILE_SIZE + TILE_SIZE / 2;

    audioManager.playSfx('hover', 0.08);

    // Slide and squash stretch
    this.tweens.add({
      targets: this.playerSprite,
      x: targetX,
      y: targetY,
      duration: 180,
      ease: 'Power1.easeOut',
      onComplete: () => {
        this.playerGridPos.x = targetCol;
        this.playerGridPos.y = targetRow;
        this.isMoving = false;

        // Check Triggers on arrival
        this._checkTriggers();
      }
    });
  }

  _roamEnemy(enemy) {
    if (this.sys.isPaused()) return;

    // Pick a random adjacent walkable tile
    const dirs = [
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    const validDirs = dirs.filter(d => {
      const nx = enemy.gridX + d.x;
      const ny = enemy.gridY + d.y;
      return this._isWalkable(nx, ny) && 
             !(nx === this.exitGridPos.x && ny === this.exitGridPos.y) &&
             !this.enemies.some(e => e !== enemy && e.gridX === nx && e.gridY === ny);
    });

    if (validDirs.length === 0) return;

    const dir = Phaser.Utils.Array.GetRandom(validDirs);
    const nextX = enemy.gridX + dir.x;
    const nextY = enemy.gridY + dir.y;

    enemy.gridX = nextX;
    enemy.gridY = nextY;

    this.tweens.add({
      targets: enemy.sprite,
      x: nextX * TILE_SIZE + TILE_SIZE / 2,
      y: nextY * TILE_SIZE + TILE_SIZE / 2,
      duration: 300,
      ease: 'Power1.easeInOut',
      onComplete: () => {
        // Check if enemy stepped into the player
        if (enemy.gridX === this.playerGridPos.x && enemy.gridY === this.playerGridPos.y) {
          this._triggerCombat();
        }
      }
    });
  }

  _checkTriggers() {
    const px = this.playerGridPos.x;
    const py = this.playerGridPos.y;

    // 1. Check Exit Portal
    if (px === this.exitGridPos.x && py === this.exitGridPos.y) {
      this._triggerVictoryExit();
      return;
    }

    // 2. Check Chest collection
    const chestIdx = this.chests.findIndex(c => c.gridX === px && c.gridY === py);
    if (chestIdx !== -1) {
      const chest = this.chests[chestIdx];
      this.chests.splice(chestIdx, 1);
      this._openChest(chest);
    }

    // 3. Check Enemy collision
    const collidedEnemy = this.enemies.find(e => e.gridX === px && e.gridY === py);
    if (collidedEnemy) {
      this._triggerCombat();
    }
  }

  _openChest(chest) {
    audioManager.playSfx('heal');

    // Visual pop-up inside Phaser
    const floatText = this.add.text(chest.sprite.x, chest.sprite.y - 10, '¡Cofre abierto!', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Fade out chest and float text
    this.tweens.add({
      targets: chest.sprite,
      scaleX: 0,
      scaleY: 0,
      angle: 90,
      alpha: 0,
      duration: 300,
      onComplete: () => chest.sprite.destroy()
    });

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => floatText.destroy()
    });

    // Pick a random event from MAP_DATA exploreEvents list to give actual rewards!
    if (this.regionData.exploreEvents && this.regionData.exploreEvents.length > 0) {
      const rollEvent = Phaser.Utils.Array.GetRandom(this.regionData.exploreEvents);
      
      // Emit log messages for the user
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `🎁 Cofre Encontrado: ${rollEvent.name} — ${rollEvent.description}`,
        type: 'quest'
      });

      // Apply effect rewards directly
      const effect = rollEvent.effect;
      const player = gameState.getPlayer();
      if (player) {
        if (effect.gold) player.gold += effect.gold;
        if (effect.healPercent) {
          const hpGain = Math.floor(player.stats.maxHp * effect.healPercent);
          player.hp = Math.min(player.hp + hpGain, player.stats.maxHp);
        }
        if (effect.giveItems && effect.giveItems.length > 0) {
          // Add reward items directly into inventory via global gameEngine service
          effect.giveItems.forEach(loot => {
            window.gameEngine.services.inventory.addItem(loot);
          });
        }
      }

      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: `🎁 ¡Obtuviste botín de cofre!`,
        type: 'gold'
      });
      
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: effect.message,
        type: 'reward'
      });
    }
  }

  _triggerCombat() {
    this.scene.pause();
    
    // Close modal and initiate combat immediately
    const enemyPool = this.regionData.enemies || ['dummy'];
    const chosenEnemy = Phaser.Utils.Array.GetRandom(enemyPool);

    audioManager.playSfx('defeat');

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: '💥 ¡Emboscada! Un enemigo te ataca en el mapa visual.',
      type: 'combat'
    });

    // Close the exploration container frame
    this.parentUI.close();

    // Trigger full combat scene transition on GameEngine
    eventBus.emit(EVENTS.COMBAT_START, { enemyId: chosenEnemy });
  }

  _triggerVictoryExit() {
    this.scene.pause();
    audioManager.playSfx('heal');

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: '🌀 Cruzaste el portal de salida con éxito. +20 EXP de exploración.',
      type: 'reward'
    });

    const player = gameState.getPlayer();
    if (player) {
      player.exp += 20;
      window.gameEngine.services.inventory.checkLevelUp(player);
    }

    eventBus.emit(EVENTS.TOAST_SHOW, {
      message: '🌀 ¡Exploración Completada!',
      type: 'gold'
    });

    // Fade out and close
    this.parentUI.close();
  }
}

export class ExplorationMapUI {
  constructor() {
    this.gameInstance = null;
  }

  /**
   * Instantiate and open the visual Phaser 2D modal
   */
  open() {
    const regionId = gameState.get('currentRegion');
    const region = MAP_DATA[regionId];

    // Play BGM for region
    audioManager.playSfx('hover');

    // 1. Create Modal Container DOM element
    const overlay = document.createElement('div');
    overlay.id = 'exploration-overlay';
    overlay.className = 'exploration-overlay';
    overlay.innerHTML = `
      <div class="exploration-modal-card">
        <header class="exploration-modal-header">
          <div class="modal-title font-display">🗺️ Explorando: ${region.name}</div>
          <button id="btn-exploration-exit" class="btn btn-danger btn-sm">Retirarse 🚪</button>
        </header>
        <div id="phaser-canvas-container" class="phaser-canvas-container"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 2. Load Phaser Game Instance
    const config = {
      type: Phaser.AUTO,
      width: TILE_SIZE * GRID_COLS,
      height: TILE_SIZE * GRID_ROWS,
      parent: 'phaser-canvas-container',
      backgroundColor: '#0d1117',
      scene: ExplorationScene,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
      }
    };

    // Instantiate game and pass contextual data
    this.gameInstance = new Phaser.Game(config);
    this.gameInstance.scene.start('ExplorationScene', {
      regionId: regionId,
      parentUI: this
    });

    // Bind Retirarse Exit Click
    const btnExit = document.getElementById('btn-exploration-exit');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        logger.info('🚪 Player retired manually from exploration');
        eventBus.emit(EVENTS.LOG_MESSAGE, {
          text: 'Te retiras de la exploración y regresas a la zona segura.',
          type: 'system'
        });
        this.close();
      });
    }
  }

  /**
   * Safe teardown of game instance and DOM
   */
  close() {
    if (this.gameInstance) {
      this.gameInstance.destroy(true);
      this.gameInstance = null;
    }

    const overlay = document.getElementById('exploration-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Refresh underlying HUD display and rebind travel/NPC actions
    const app = document.getElementById('app');
    if (window.gameEngine && window.gameEngine.screenManager) {
      const activeGameScreen = window.gameEngine.screenManager.screens[SCREENS.GAME];
      if (activeGameScreen) {
        activeGameScreen.render(app);
        activeGameScreen.bindEvents();
      }
    }
  }
}
