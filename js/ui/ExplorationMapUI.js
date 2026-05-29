/**
 * ExplorationMapUI.js — High-fidelity 2D visual adventure exploration map using Phaser & EasyStar.js.
 * Implements a Seeded Procedural Minecraft-style Open World with Resource Harvesting,
 * Action Swing Frames, Particle FX, and a premium Crafting Sidebar connected to the RPG inventory.
 */

import Phaser from 'phaser';
import EasyStar from 'easystarjs';
import Chance from 'chance';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { audioManager } from '../services/AudioManager.js';
import { MAP_DATA } from '../data/maps.js';
import { ITEM_DATA } from '../data/items.js';
import { REGIONS, SCREENS, EVENTS } from '../utils/constants.js';
import logger from '../utils/logger.js';

// Configuration constants for the massive seeded open-world grid
const TILE_SIZE = 48;
const GRID_COLS = 36; // Big scrollable world!
const GRID_ROWS = 28;

class ExplorationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ExplorationScene' });
  }

  init(data) {
    this.regionId = data.regionId || REGIONS.VILLAGE;
    this.regionData = MAP_DATA[this.regionId];
    this.parentUI = data.parentUI;

    this.grid = [];
    this.playerGridPos = { x: 2, y: 2 }; // Safe spawn coordinates
    this.exitGridPos = { x: GRID_COLS - 3, y: GRID_ROWS - 3 };
    this.chests = [];
    this.enemies = [];
    this.resources = [];
    this.isMoving = false;
    this.moveQueue = [];

    // Get current world seed
    this.seed = gameState.get('currentSeed') || 'Aethermoor_Default';
    this.chanceInstance = new Chance(this.seed);

    // Retrieve active player data and initialize materials if missing
    this.player = gameState.getPlayer();
    if (this.player) {
      if (!this.player.sandboxMaterials) {
        this.player.sandboxMaterials = { wood: 0, stone: 0, iron: 0, gems: 0 };
      }
      if (!this.player.sandboxTools) {
        this.player.sandboxTools = { axe: 1, pickaxe: 1 };
      }
    }

    // Configure biome theme variables
    this.theme = this._getRegionTheme(this.regionId);
  }

  create() {
    logger.info(`🗺️ Phaser ExplorationScene loading SEEDED region: ${this.regionId} | Seed: ${this.seed}`);

    // Set world physics bounds for massive map scrolling
    this.physics.world.setBounds(0, 0, TILE_SIZE * GRID_COLS, TILE_SIZE * GRID_ROWS);

    // Initialize EasyStar pathfinder
    this.easystar = new EasyStar.js();
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();

    // 1. Generate deterministic seeded grid, obstacles, and resources
    this._generateMapGrid();

    // 2. Draw ground tiles and outline grid borders
    this._renderMapGraphics();

    // 3. Spawn deterministic interactive objects
    this._spawnPortal();
    this._spawnChests();
    this._spawnEnemies();
    this._spawnSeededResources();

    // 4. Spawn Player Sprite
    this._spawnPlayer();

    // 5. Configure camera properties (Smooth Minecraft-style camera follow!)
    this.cameras.main.setBounds(0, 0, TILE_SIZE * GRID_COLS, TILE_SIZE * GRID_ROWS);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    // 6. Initialize pathfinder grid
    this.easystar.setGrid(this.grid);
    this.easystar.setAcceptableTiles([0]);

    // 7. Setup Inputs (WASD, Arrows, Space for Action Swing)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Map click handling (Walk or Mine/Harvest adjacent resources)
    this.input.on('pointerdown', (pointer) => {
      // Offset by camera scroll position to get accurate world coordinates
      const worldX = pointer.x + this.cameras.main.scrollX;
      const worldY = pointer.y + this.cameras.main.scrollY;

      const clickedCol = Math.floor(worldX / TILE_SIZE);
      const clickedRow = Math.floor(worldY / TILE_SIZE);

      if (this._isValidGridPos(clickedCol, clickedRow)) {
        // If adjacent to player and clicked a resource node, trigger harvest!
        const dx = Math.abs(this.playerGridPos.x - clickedCol);
        const dy = Math.abs(this.playerGridPos.y - clickedRow);
        const isAdjacent = (dx + dy === 1);

        const resource = this.resources.find(r => r.gridX === clickedCol && r.gridY === clickedRow);
        if (isAdjacent && resource) {
          this._harvestResource(resource);
        } else {
          this._calculateAndMoveTo(clickedCol, clickedRow);
        }
      }
    });

    // Instructions display overlay inside Phaser
    this.add.text(15, this.scale.height - 35, '⌨ WASD: Mover | 🌌 Espacio: Craftear/Talar Recursos | 🖱 Clic: Auto-Ruta/Minar', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#fbbf24',
      backgroundColor: '#070a0fe0',
      padding: { x: 10, y: 5 },
      borderRadius: 4
    }).setScrollFactor(0).setDepth(200);

    // Trigger initial HUD refresh
    this.parentUI.updateSidebarHUD();
  }

  update(time, delta) {
    if (this.isMoving) return;

    // Handle Spacebar to harvest any adjacent resources
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this._harvestAdjacentResource();
      return;
    }

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
        this.moveQueue = []; // Clear click path queue when moving manually
        this._movePlayerToTile(nextX, nextY);
      }
    } else if (this.moveQueue.length > 0) {
      const nextStep = this.moveQueue.shift();
      if (this._isWalkable(nextStep.x, nextStep.y)) {
        this._movePlayerToTile(nextStep.x, nextStep.y);
      } else {
        this.moveQueue = []; // Cancel route if blocked in real time
      }
    }

    this.easystar.calculate();
  }

  // --- Biome Configuration Systems ---

  _getRegionTheme(regionId) {
    switch (regionId) {
      case REGIONS.FOREST:
        return {
          bg: 0x022c22,
          gridBorder: 0x15803d,
          groundColor: 0x064e3b,
          obstacleEmoji: '🌲',
          monsterEmoji: '🐺',
          groundTiles: ['🌿', '🌱', '🍄', '🍀']
        };
      case REGIONS.CAVE:
        return {
          bg: 0x0f0b24,
          gridBorder: 0x4338ca,
          groundColor: 0x1e1b4b,
          obstacleEmoji: '🪨',
          monsterEmoji: '💀',
          groundTiles: ['🪨', '🍄', '✨', '']
        };
      case REGIONS.MOUNTAIN:
        return {
          bg: 0x141210,
          gridBorder: 0x57534e,
          groundColor: 0x292524,
          obstacleEmoji: '🏔️',
          monsterEmoji: '🧙‍♂️',
          groundTiles: ['❄️', '🪨', '🌿', '']
        };
      case REGIONS.CASTLE:
        return {
          bg: 0x2c0606,
          gridBorder: 0x991b1b,
          groundColor: 0x450a0a,
          obstacleEmoji: '🧱',
          monsterEmoji: '😈',
          groundTiles: ['🔥', '🧱', '💀', '']
        };
      case REGIONS.VILLAGE:
      default:
        return {
          bg: 0x042416,
          gridBorder: 0x047857,
          groundColor: 0x065f46,
          obstacleEmoji: '🌳',
          monsterEmoji: '👾',
          groundTiles: ['🌸', '🌼', '🌱', '']
        };
    }
  }

  // --- Seeded Procedural Map Generator (Minecraft style!) ---

  _generateMapGrid() {
    this.grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const row = [];
      for (let c = 0; c < GRID_COLS; c++) {
        // Outer boundaries are blocked wall tiles
        const isBorder = (r === 0 || c === 0 || r === GRID_ROWS - 1 || c === GRID_COLS - 1);
        if (isBorder) {
          row.push(1);
        } else {
          // Prevent spawning obstacles in the safe spawn zone around (2,2) and portal (exit)
          const isSpawnZone = (c >= 1 && c <= 4 && r >= 1 && r <= 4);
          const isExitZone = (Math.abs(c - this.exitGridPos.x) <= 1 && Math.abs(r - this.exitGridPos.y) <= 1);

          if (isSpawnZone || isExitZone) {
            row.push(0);
          } else {
            // 18% chance to spawn an immutable landscape obstacle block
            const rand = this.chanceInstance.floating({ min: 0, max: 1 });
            if (rand < 0.18) {
              row.push(1);
            } else {
              row.push(0);
            }
          }
        }
      }
      this.grid.push(row);
    }
  }

  _renderMapGraphics() {
    const graphics = this.add.graphics();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (this.grid[r][c] === 0) {
          graphics.fillStyle(this.theme.groundColor, 0.45);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          graphics.fillStyle(this.theme.bg, 0.9);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

        // Grid border lines
        graphics.lineStyle(1, this.theme.gridBorder, 0.2);
        graphics.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        const isBorder = (r === 0 || c === 0 || r === GRID_ROWS - 1 || c === GRID_COLS - 1);
        if (this.grid[r][c] === 1) {
          const emoji = isBorder ? '🪵' : this.theme.obstacleEmoji;
          this.add.text(x + TILE_SIZE / 2, y + TILE_SIZE / 2, emoji, {
            fontSize: '24px'
          }).setOrigin(0.5);
        } else {
          // Soft decorative seeded ground textures
          const cellChance = new Chance(this.seed + `_${c}_${r}`);
          if (cellChance.floating({ min: 0, max: 1 }) < 0.12) {
            const groundDecor = cellChance.pickone(this.theme.groundTiles);
            if (groundDecor) {
              this.add.text(x + TILE_SIZE / 2, y + TILE_SIZE / 2, groundDecor, {
                fontSize: '14px',
                alpha: 0.35
              }).setOrigin(0.5);
            }
          }
        }
      }
    }
  }

  // --- Seeded Entity / Chest Spawning System ---

  _spawnPlayer() {
    const x = this.playerGridPos.x * TILE_SIZE + TILE_SIZE / 2;
    const y = this.playerGridPos.y * TILE_SIZE + TILE_SIZE / 2;

    let classEmoji = '🛡️';
    if (this.player) {
      if (this.player.classType === 'archer') classEmoji = '🏹';
      else if (this.player.classType === 'mage') classEmoji = '🧙';
    }

    this.playerSprite = this.add.text(x, y, classEmoji, {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: this.playerSprite,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 850,
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

    this.tweens.add({
      targets: this.portalSprite,
      angle: 360,
      duration: 3200,
      repeat: -1
    });
  }

  _spawnChests() {
    // Deterministic seeded spawn for 3 treasure chests
    let chestChance = new Chance(this.seed + '_chests');
    let spawned = 0;
    let attempts = 0;

    while (spawned < 3 && attempts < 50) {
      attempts++;
      const col = chestChance.integer({ min: 3, max: GRID_COLS - 4 });
      const row = chestChance.integer({ min: 3, max: GRID_ROWS - 4 });

      if (this.grid[row][col] === 0 &&
          !(col === this.exitGridPos.x && row === this.exitGridPos.y) &&
          !this.chests.some(c => c.gridX === col && c.gridY === row)) {

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const sprite = this.add.text(x, y, '🎁', { fontSize: '26px' }).setOrigin(0.5).setDepth(6);

        this.tweens.add({
          targets: sprite,
          y: y - 5,
          duration: 650 + chestChance.random() * 400,
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
    // Seeded spawn for 3 roaming dungeon monsters
    let enemyChance = new Chance(this.seed + '_enemies');
    let spawned = 0;
    let attempts = 0;

    while (spawned < 3 && attempts < 50) {
      attempts++;
      const col = enemyChance.integer({ min: 4, max: GRID_COLS - 5 });
      const row = enemyChance.integer({ min: 4, max: GRID_ROWS - 5 });

      if (this.grid[row][col] === 0 &&
          !(col === this.exitGridPos.x && row === this.exitGridPos.y) &&
          !this.chests.some(c => c.gridX === col && c.gridY === row) &&
          !this.enemies.some(e => e.gridX === col && e.gridY === row)) {

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const sprite = this.add.text(x, y, this.theme.monsterEmoji, { fontSize: '26px' }).setOrigin(0.5).setDepth(8);

        const enemyObj = {
          gridX: col,
          gridY: row,
          sprite: sprite,
          roamTimer: null
        };

        enemyObj.roamTimer = this.time.addEvent({
          delay: 1800 + enemyChance.random() * 800,
          loop: true,
          callback: () => this._roamEnemy(enemyObj)
        });

        this.enemies.push(enemyObj);
        spawned++;
      }
    }
  }

  // --- Seeded Sandbox Resources (Minecraft-style blocks!) ---

  _spawnSeededResources() {
    let resChance = new Chance(this.seed + '_resources');
    
    // Resource types mapping based on biome/region
    const configByRegion = {
      [REGIONS.VILLAGE]: [
        { type: 'wood', emoji: '🪵', hp: 3, label: 'Roble' },
        { type: 'stone', emoji: '🪨', hp: 4, label: 'Roca' },
        { type: 'mushrooms', emoji: '🍄', hp: 2, label: 'Setas' }
      ],
      [REGIONS.FOREST]: [
        { type: 'wood', emoji: '🪵', hp: 3, label: 'Pino' },
        { type: 'iron', emoji: '🪨', hp: 5, label: 'Hierro' },
        { type: 'mushrooms', emoji: '🍄', hp: 2, label: 'Hongo Rojo' }
      ],
      [REGIONS.CAVE]: [
        { type: 'stone', emoji: '🪨', hp: 4, label: 'Carbón' },
        { type: 'iron', emoji: '🪨', hp: 5, label: 'Hierro' },
        { type: 'gems', emoji: '💎', hp: 6, label: 'Rubí' }
      ],
      [REGIONS.MOUNTAIN]: [
        { type: 'stone', emoji: '🪨', hp: 4, label: 'Cobre' },
        { type: 'iron', emoji: '🪨', hp: 5, label: 'Hierro' },
        { type: 'gems', emoji: '💎', hp: 6, label: 'Zafiro' }
      ],
      [REGIONS.CASTLE]: [
        { type: 'stone', emoji: '🪨', hp: 5, label: 'Obsidiana' },
        { type: 'gems', emoji: '💎', hp: 7, label: 'Materia Fuego' }
      ]
    };

    const availTypes = configByRegion[this.regionId] || configByRegion[REGIONS.VILLAGE];

    // Distribute resources procedurally
    for (let r = 2; r < GRID_ROWS - 2; r++) {
      for (let c = 2; c < GRID_COLS - 2; c++) {
        // Safe check so spawn zone and exit are safe
        const isSpawnZone = (c >= 1 && c <= 4 && r >= 1 && r <= 4);
        const isExitZone = (Math.abs(c - this.exitGridPos.x) <= 1 && Math.abs(r - this.exitGridPos.y) <= 1);
        if (isSpawnZone || isExitZone) continue;

        // If the cell is empty, roll to spawn a harvestable resource block
        if (this.grid[r][c] === 0) {
          const blockChance = new Chance(this.seed + `_res_${c}_${r}`);
          if (blockChance.floating({ min: 0, max: 1 }) < 0.1) {
            const template = blockChance.pickone(availTypes);
            
            // Mark grid cell as blocked so pathfinding calculates collision!
            this.grid[r][c] = 1;

            const x = c * TILE_SIZE + TILE_SIZE / 2;
            const y = r * TILE_SIZE + TILE_SIZE / 2;

            const sprite = this.add.text(x, y, template.emoji, { fontSize: '26px' }).setOrigin(0.5).setDepth(7);

            this.resources.push({
              gridX: c,
              gridY: r,
              type: template.type,
              emoji: template.emoji,
              label: template.label,
              hp: template.hp,
              maxHp: template.hp,
              sprite: sprite
            });
          }
        }
      }
    }
  }

  // --- Real-time Movement & Action Engine ---

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
          this.moveQueue = path.slice(1);
        } else {
          audioManager.playSfx('hover', 0.08);
        }
      }
    );
    this.easystar.calculate();
  }

  _movePlayerToTile(targetCol, targetRow) {
    this.isMoving = true;
    
    const targetX = targetCol * TILE_SIZE + TILE_SIZE / 2;
    const targetY = targetRow * TILE_SIZE + TILE_SIZE / 2;

    audioManager.playSfx('hover', 0.06);

    // Bounce squash-stretch walking animation (GSAP action frame style!)
    this.tweens.add({
      targets: this.playerSprite,
      x: targetX,
      y: targetY,
      duration: 160,
      ease: 'Power1.easeOut',
      onComplete: () => {
        this.playerGridPos.x = targetCol;
        this.playerGridPos.y = targetRow;
        this.isMoving = false;

        this._checkTriggers();
      }
    });
  }

  _roamEnemy(enemy) {
    if (this.sys.isPaused() || !this.parentUI.gameInstance) return;

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

    const pickChance = new Chance();
    const dir = pickChance.pickone(validDirs);
    const nextX = enemy.gridX + dir.x;
    const nextY = enemy.gridY + dir.y;

    enemy.gridX = nextX;
    enemy.gridY = nextY;

    this.tweens.add({
      targets: enemy.sprite,
      x: nextX * TILE_SIZE + TILE_SIZE / 2,
      y: nextY * TILE_SIZE + TILE_SIZE / 2,
      duration: 350,
      ease: 'Power1.easeInOut',
      onComplete: () => {
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

    const floatText = this.add.text(chest.sprite.x, chest.sprite.y - 12, '💎 ¡Cofre abierto! 💎', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Glowing explosion particles
    this._emitParticles(chest.sprite.x, chest.sprite.y, 0xfbbf24, '✨');

    this.tweens.add({
      targets: chest.sprite,
      scaleX: 0,
      scaleY: 0,
      angle: 180,
      alpha: 0,
      duration: 350,
      onComplete: () => chest.sprite.destroy()
    });

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => floatText.destroy()
    });

    // Determine rewards from exploration list
    if (this.regionData.exploreEvents && this.regionData.exploreEvents.length > 0) {
      const rollEvent = this.chanceInstance.pickone(this.regionData.exploreEvents);
      
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `🎁 Cofre Secreto: ${rollEvent.name} — ${rollEvent.description}`,
        type: 'quest'
      });

      const effect = rollEvent.effect;
      if (this.player) {
        if (effect.gold) this.player.gold += effect.gold;
        if (effect.healPercent) {
          const hpGain = Math.floor(this.player.stats.maxHp * effect.healPercent);
          this.player.hp = Math.min(this.player.hp + hpGain, this.player.stats.maxHp);
        }
        if (effect.giveItems && effect.giveItems.length > 0) {
          effect.giveItems.forEach(loot => {
            window.gameEngine.services.inventory.addItem(loot.itemId);
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

  // --- Minecraft Action Harvesting Engine ---

  _harvestAdjacentResource() {
    const px = this.playerGridPos.x;
    const py = this.playerGridPos.y;

    const adjacentDirs = [
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    for (const dir of adjacentDirs) {
      const targetCol = px + dir.x;
      const targetRow = py + dir.y;
      
      const resource = this.resources.find(r => r.gridX === targetCol && r.gridY === targetRow);
      if (resource) {
        this._harvestResource(resource);
        return;
      }
    }

    // If no adjacent resource, emit minor alert sound
    audioManager.playSfx('hover', 0.05);
  }

  _harvestResource(resource) {
    if (!this.player) return;

    // Action Tool level checks
    const toolLevel = resource.type === 'wood' ? this.player.sandboxTools.axe : this.player.sandboxTools.pickaxe;
    const chopPower = toolLevel; // doing damage based on tool tier!

    resource.hp -= chopPower;

    // Action Swing Tween (GSAP rotation bounce!)
    this.tweens.add({
      targets: this.playerSprite,
      angle: 35,
      scaleX: 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    });

    // Shake the targeted resource node
    this.tweens.add({
      targets: resource.sprite,
      x: resource.sprite.x + Phaser.Math.Between(-4, 4),
      y: resource.sprite.y + Phaser.Math.Between(-2, 2),
      duration: 50,
      yoyo: true,
      repeat: 2
    });

    // Emit impact particles
    const particleColor = resource.type === 'wood' ? 0x92400e : (resource.type === 'gems' ? 0xec4899 : 0x6b7280);
    const particleSymbol = resource.type === 'wood' ? '🍂' : (resource.type === 'gems' ? '✨' : '🪨');
    this._emitParticles(resource.sprite.x, resource.sprite.y, particleColor, particleSymbol);

    // Floating text showing hit feedback
    const floatValText = this.add.text(resource.sprite.x, resource.sprite.y - 15, `-${chopPower} HP`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatValText,
      y: floatValText.y - 20,
      alpha: 0,
      duration: 600,
      onComplete: () => floatValText.destroy()
    });

    // Play mining SFX
    audioManager.playSfx('hover', 0.15);

    if (resource.hp <= 0) {
      // Resource Node completely broken!
      this._breakResource(resource);
    }
  }

  _breakResource(resource) {
    // Remove from array and restore grid cell to walkable ground!
    const idx = this.resources.indexOf(resource);
    if (idx !== -1) {
      this.resources.splice(idx, 1);
    }

    // RESTORE WALKABLE PATH! (Block cleared!)
    this.grid[resource.gridY][resource.gridX] = 0;
    this.easystar.setGrid(this.grid); // recalculate grid bounds

    // Award materials depending on resource type
    let yieldAmount = this.chanceInstance.integer({ min: 2, max: 4 });
    
    if (resource.type === 'wood') {
      this.player.sandboxMaterials.wood += yieldAmount;
    } else if (resource.type === 'stone') {
      this.player.sandboxMaterials.stone += yieldAmount;
    } else if (resource.type === 'iron') {
      this.player.sandboxMaterials.iron += yieldAmount;
    } else if (resource.type === 'gems') {
      this.player.sandboxMaterials.gems += yieldAmount;
    }

    // Play breaking audio feedback
    audioManager.playSfx('heal');

    const breakText = this.add.text(resource.sprite.x, resource.sprite.y - 12, `¡${resource.label} Destruido! +${yieldAmount}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#10b981',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: resource.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 250,
      onComplete: () => resource.sprite.destroy()
    });

    this.tweens.add({
      targets: breakText,
      y: breakText.y - 45,
      alpha: 0,
      duration: 1500,
      onComplete: () => breakText.destroy()
    });

    // Logging console message
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `⛏️ Has recolectado ${yieldAmount} de ${resource.type.toUpperCase()} al talar el nodo de recurso.`,
      type: 'reward'
    });

    // Refresh sandbox inventory and sidebar DOM
    this.parentUI.updateSidebarHUD();
  }

  _emitParticles(x, y, color, char = '▪') {
    for (let i = 0; i < 6; i++) {
      const part = this.add.text(x, y, char, {
        fontSize: '12px',
        color: '#' + color.toString(16)
      }).setOrigin(0.5);

      const angle = Phaser.Math.Between(0, 360);
      const rad = Phaser.Math.DegToRad(angle);
      const dist = Phaser.Math.Between(15, 45);

      const targetX = x + Math.cos(rad) * dist;
      const targetY = y + Math.sin(rad) * dist;

      this.tweens.add({
        targets: part,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        angle: Phaser.Math.Between(-180, 180),
        duration: 500 + Math.random() * 200,
        onComplete: () => part.destroy()
      });
    }
  }

  // --- Core Combat and Victory Triggers ---

  _triggerCombat() {
    this.scene.pause();
    
    const enemyPool = this.regionData.enemies || ['dummy'];
    const chosenEnemy = this.chanceInstance.pickone(enemyPool);

    audioManager.playSfx('defeat');

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: '💥 ¡Emboscada! Un enemigo te ataca en el mapa visual.',
      type: 'combat'
    });

    this.parentUI.close();
    eventBus.emit(EVENTS.COMBAT_START, { enemyId: chosenEnemy });
  }

  _triggerVictoryExit() {
    this.scene.pause();
    audioManager.playSfx('heal');

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: '🌀 Cruzaste el portal de salida con éxito. +20 EXP de exploración.',
      type: 'reward'
    });

    if (this.player) {
      this.player.exp += 20;
      window.gameEngine.services.inventory.checkLevelUp(this.player);
    }

    eventBus.emit(EVENTS.TOAST_SHOW, {
      message: '🌀 ¡Exploración Completada!',
      type: 'gold'
    });

    this.parentUI.close();
  }
}

export class ExplorationMapUI {
  constructor() {
    this.gameInstance = null;
    this.recipes = [
      {
        id: 'recipe_potion_hp',
        name: 'Poción Menor de Vida 🧪',
        description: 'Restaura 30 HP de inmediato',
        itemId: 'potion_hp_minor',
        cost: { wood: 2, stone: 0, iron: 0, gems: 0 }
      },
      {
        id: 'recipe_potion_mp',
        name: 'Poción Menor de Maná 🧪',
        description: 'Restaura 15 PM de inmediato',
        itemId: 'potion_mp_minor',
        cost: { wood: 0, stone: 2, iron: 0, gems: 0 }
      },
      {
        id: 'recipe_shield_wood',
        name: 'Escudo de Madera 🛡️',
        description: 'Escudo de inicio (+3 Defensa)',
        itemId: 'shield_wooden',
        cost: { wood: 5, stone: 0, iron: 0, gems: 0 }
      },
      {
        id: 'recipe_sword_iron',
        name: 'Espada de Hierro ⚔️',
        description: 'Arma sólida (+10 Ataque)',
        itemId: 'weapon_iron_sword',
        cost: { wood: 8, stone: 5, iron: 3, gems: 0 }
      },
      {
        id: 'recipe_ring_copper',
        name: 'Anillo de Cobre 💍',
        description: 'Accesorio sencillo (+5 HP)',
        itemId: 'accessory_copper_ring',
        cost: { wood: 0, stone: 6, iron: 2, gems: 1 }
      },
      {
        id: 'recipe_ring_life',
        name: 'Anillo de Vitalidad 💍',
        description: 'Grabado épico (+40 HP, +2 Def)',
        itemId: 'accessory_ring_of_life',
        cost: { wood: 0, stone: 15, iron: 5, gems: 6 }
      }
    ];
  }

  /**
   * Instantiate and open the visual Phaser 2D modal with sidebar crafting
   */
  open() {
    const regionId = gameState.get('currentRegion');
    const region = MAP_DATA[regionId];

    // Ensure seed is set
    let currentSeed = gameState.get('currentSeed');
    if (!currentSeed) {
      currentSeed = Math.floor(100000 + Math.random() * 900000).toString();
      gameState.set('currentSeed', currentSeed);
    }

    audioManager.playSfx('hover');

    // 1. Create Modal Container DOM element supporting Sandbox Grid Layout
    const overlay = document.createElement('div');
    overlay.id = 'exploration-overlay';
    overlay.className = 'exploration-overlay';
    overlay.innerHTML = `
      <div class="exploration-modal-card" style="max-width: 1100px;">
        <header class="exploration-modal-header">
          <div class="modal-title font-display">🗺️ Explorando Aventura: ${region.name}</div>
          <button id="btn-exploration-exit" class="btn btn-danger btn-sm">Retirarse 🚪</button>
        </header>
        
        <div class="exploration-sandbox-container">
          <!-- Left side: Phaser viewport -->
          <div id="phaser-canvas-container" class="phaser-canvas-container"></div>
          
          <!-- Right side: premium Sandbox Crafting Sidebar -->
          <aside class="sandbox-sidebar">
            <div class="sandbox-section">
              <h4 class="section-title">🌱 Generación de Mundo</h4>
              <div class="seed-control-group">
                <input type="text" id="sandbox-seed-input" class="font-mono" value="${currentSeed}" />
                <button id="btn-sandbox-regenerate" class="btn btn-gold btn-xxs">Regenerar 🌀</button>
              </div>
              <div class="text-xxs text-muted" style="margin-top: 5px; opacity: 0.6;">Modificar semilla cambiará por completo la distribución del terreno.</div>
            </div>

            <div class="sandbox-section">
              <h4 class="section-title">🎒 Materiales de Aventura</h4>
              <div class="sandbox-materials-grid">
                <div class="material-chip">
                  <span class="material-icon">🪵</span>
                  <span class="material-label">Madera</span>
                  <span id="mat-wood-count" class="material-count font-mono">0</span>
                </div>
                <div class="material-chip">
                  <span class="material-icon">🪨</span>
                  <span class="material-label">Piedra</span>
                  <span id="mat-stone-count" class="material-count font-mono">0</span>
                </div>
                <div class="material-chip">
                  <span class="material-icon">⛏️</span>
                  <span class="material-label">Hierro</span>
                  <span id="mat-iron-count" class="material-count font-mono">0</span>
                </div>
                <div class="material-chip">
                  <span class="material-icon">💎</span>
                  <span class="material-label">Gemas</span>
                  <span id="mat-gems-count" class="material-count font-mono">0</span>
                </div>
              </div>
            </div>

            <div class="sandbox-section">
              <h4 class="section-title">🪓 Herramientas</h4>
              <div class="sandbox-tools-list">
                <div class="tool-item">
                  <div>🪓 Hacha: <span id="tool-axe-level" class="text-gold" style="font-weight:bold;">Nvl. 1</span></div>
                  <button id="btn-upgrade-axe" class="btn btn-secondary btn-xxs">Mejorar (8🪵 4🪨)</button>
                </div>
                <div class="tool-item" style="margin-top: 5px">
                  <div>⛏️ Pico: <span id="tool-pickaxe-level" class="text-gold" style="font-weight:bold;">Nvl. 1</span></div>
                  <button id="btn-upgrade-pickaxe" class="btn btn-secondary btn-xxs">Mejorar (8🪵 8🪨)</button>
                </div>
              </div>
            </div>

            <div class="sandbox-section" style="flex: 1; display: flex; flex-direction: column;">
              <h4 class="section-title">🛠️ Mesa de Forja & Alquimia</h4>
              <div id="crafting-recipes-list" class="crafting-recipes-list">
                <!-- Crafting recipes dynamically built -->
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 2. Load Phaser Game Instance (Using 720x528 screen, displaying scrollable views of 36x28 world)
    const config = {
      type: Phaser.AUTO,
      width: 720,
      height: 528,
      parent: 'phaser-canvas-container',
      backgroundColor: '#05080c',
      scene: ExplorationScene,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
      }
    };

    this.gameInstance = new Phaser.Game(config);
    this.gameInstance.scene.start('ExplorationScene', {
      regionId: regionId,
      parentUI: this
    });

    // 3. Bind Event Listeners
    const btnExit = document.getElementById('btn-exploration-exit');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        logger.info('🚪 Player retired manually from sandbox adventure');
        eventBus.emit(EVENTS.LOG_MESSAGE, {
          text: 'Te retiras de la exploración y regresas a la zona segura.',
          type: 'system'
        });
        this.close();
      });
    }

    const btnRegen = document.getElementById('btn-sandbox-regenerate');
    if (btnRegen) {
      btnRegen.addEventListener('click', () => {
        const inputSeed = document.getElementById('sandbox-seed-input');
        if (inputSeed && inputSeed.value) {
          const newSeed = inputSeed.value.trim();
          gameState.set('currentSeed', newSeed);
          logger.info(`Regenerating world with custom seed: ${newSeed}`);
          
          eventBus.emit(EVENTS.TOAST_SHOW, {
            message: '🌀 Generando nuevo mundo procedimental...',
            type: 'gold'
          });

          // Safely restart current phaser scene with new seed
          if (this.gameInstance) {
            const activeScene = this.gameInstance.scene.getScene('ExplorationScene');
            if (activeScene) {
              activeScene.scene.restart({
                regionId: regionId,
                parentUI: this
              });
            }
          }
        }
      });
    }

    const btnUpgradeAxe = document.getElementById('btn-upgrade-axe');
    if (btnUpgradeAxe) {
      btnUpgradeAxe.addEventListener('click', () => this.upgradeTool('axe'));
    }

    const btnUpgradePickaxe = document.getElementById('btn-upgrade-pickaxe');
    if (btnUpgradePickaxe) {
      btnUpgradePickaxe.addEventListener('click', () => this.upgradeTool('pickaxe'));
    }
  }

  /**
   * Upgrade exploration gathering tool tiers
   */
  upgradeTool(toolType) {
    const player = gameState.getPlayer();
    if (!player) return;

    const materials = player.sandboxMaterials;
    const tools = player.sandboxTools;

    const woodCost = 8 * tools[toolType];
    const stoneCost = 4 * tools[toolType] * (toolType === 'pickaxe' ? 2 : 1);

    if (materials.wood >= woodCost && materials.stone >= stoneCost) {
      materials.wood -= woodCost;
      materials.stone -= stoneCost;
      tools[toolType] += 1;

      audioManager.playSfx('heal');
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: `🪓 ¡${toolType === 'axe' ? 'Hacha' : 'Pico'} mejorado a Nivel ${tools[toolType]}!`,
        type: 'success'
      });

      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `🛠️ Has mejorado tu ${toolType === 'axe' ? 'Hacha' : 'Pico'} de Aventura al Nivel ${tools[toolType]}. Ahora causa más daño al recolectar!`,
        type: 'reward'
      });

      this.updateSidebarHUD();
    } else {
      audioManager.playSfx('hover', 0.1);
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '❌ ¡Recursos insuficientes!',
        type: 'error'
      });
    }
  }

  /**
   * Craft items using materials and sync with central player inventory
   */
  craftItem(recipeId) {
    const player = gameState.getPlayer();
    if (!player) return;

    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const materials = player.sandboxMaterials;
    const cost = recipe.cost;

    if (
      materials.wood >= cost.wood &&
      materials.stone >= cost.stone &&
      materials.iron >= cost.iron &&
      materials.gems >= cost.gems
    ) {
      // Deduct materials
      materials.wood -= cost.wood;
      materials.stone -= cost.stone;
      materials.iron -= cost.iron;
      materials.gems -= cost.gems;

      // Inject actual items into active global inventory!
      const itemInfo = ITEM_DATA[recipe.itemId];
      if (itemInfo) {
        player.inventory.push({
          ...itemInfo,
          id: Math.random().toString(36).substring(2, 9),
          quantity: 1
        });

        audioManager.playSfx('heal');
        eventBus.emit(EVENTS.TOAST_SHOW, {
          message: `🛠️ ¡Crafteado: ${itemInfo.name}!`,
          type: 'success'
        });

        eventBus.emit(EVENTS.LOG_MESSAGE, {
          text: `🔨 Has forjado ${itemInfo.name} exitosamente usando tus materiales recolectados. Añadido a tu bolsa.`,
          type: 'reward'
        });
      }

      this.updateSidebarHUD();
    } else {
      audioManager.playSfx('hover', 0.1);
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '❌ ¡Materiales insuficientes!',
        type: 'error'
      });
    }
  }

  /**
   * Sync active DOM counts, upgraded tools, and recipes
   */
  updateSidebarHUD() {
    const player = gameState.getPlayer();
    if (!player) return;

    const materials = player.sandboxMaterials || { wood: 0, stone: 0, iron: 0, gems: 0 };
    const tools = player.sandboxTools || { axe: 1, pickaxe: 1 };

    // Update material counts
    const txtWood = document.getElementById('mat-wood-count');
    const txtStone = document.getElementById('mat-stone-count');
    const txtIron = document.getElementById('mat-iron-count');
    const txtGems = document.getElementById('mat-gems-count');

    if (txtWood) txtWood.innerText = materials.wood;
    if (txtStone) txtStone.innerText = materials.stone;
    if (txtIron) txtIron.innerText = materials.iron;
    if (txtGems) txtGems.innerText = materials.gems;

    // Update tool descriptions
    const lblAxe = document.getElementById('tool-axe-level');
    const lblPick = document.getElementById('tool-pickaxe-level');
    const btnAxe = document.getElementById('btn-upgrade-axe');
    const btnPick = document.getElementById('btn-upgrade-pickaxe');

    if (lblAxe) lblAxe.innerText = `Nvl. ${tools.axe} (Daño: ${tools.axe})`;
    if (lblPick) lblPick.innerText = `Nvl. ${tools.pickaxe} (Daño: ${tools.pickaxe})`;

    const axeWoodCost = 8 * tools.axe;
    const axeStoneCost = 4 * tools.axe;
    if (btnAxe) btnAxe.innerText = `Mejorar (${axeWoodCost}🪵 ${axeStoneCost}🪨)`;

    const pickWoodCost = 8 * tools.pickaxe;
    const pickStoneCost = 8 * tools.pickaxe;
    if (btnPick) btnPick.innerText = `Mejorar (${pickWoodCost}🪵 ${pickStoneCost}🪨)`;

    // Update and render recipe cards
    const recipeContainer = document.getElementById('crafting-recipes-list');
    if (recipeContainer) {
      let html = '';
      this.recipes.forEach(recipe => {
        const canCraft = (
          materials.wood >= recipe.cost.wood &&
          materials.stone >= recipe.cost.stone &&
          materials.iron >= recipe.cost.iron &&
          materials.gems >= recipe.cost.gems
        );

        let costParts = [];
        if (recipe.cost.wood > 0) costParts.push(`${recipe.cost.wood}🪵`);
        if (recipe.cost.stone > 0) costParts.push(`${recipe.cost.stone}🪨`);
        if (recipe.cost.iron > 0) costParts.push(`${recipe.cost.iron}⛏️`);
        if (recipe.cost.gems > 0) costParts.push(`${recipe.cost.gems}💎`);
        const costStr = costParts.join(' ') || 'Gratis';

        html += `
          <div class="recipe-card ${canCraft ? 'craftable' : ''}">
            <div class="recipe-header">
              <span class="recipe-name">${recipe.name}</span>
              <button class="btn btn-gold btn-xxs btn-craft" data-recipe="${recipe.id}" ${canCraft ? '' : 'disabled'}>
                Forjar 🛠️
              </button>
            </div>
            <div class="recipe-desc">${recipe.description}</div>
            <div class="recipe-costs">Costo: ${costStr}</div>
          </div>
        `;
      });
      recipeContainer.innerHTML = html;

      // Bind crafting actions
      const craftBtns = recipeContainer.querySelectorAll('.btn-craft');
      craftBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const recipeId = btn.getAttribute('data-recipe');
          this.craftItem(recipeId);
        });
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
