/**
 * main.js — Global entry point. Registers UI modules and initializes the RPG engine.
 */

import { gameEngine } from './core/GameEngine.js';
import { ScreenManager } from './ui/ScreenManager.js';
import { MenuUI } from './ui/MenuUI.js';
import { CharacterCreationUI } from './ui/CharacterCreationUI.js';
import { GameUI } from './ui/GameUI.js';
import { CombatUI } from './ui/CombatUI.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { ShopUI } from './ui/ShopUI.js';
import { QuestUI } from './ui/QuestUI.js';
import { DialogUI } from './ui/DialogUI.js';

import { SCREENS, EVENTS } from './utils/constants.js';
import { eventBus } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import logger from './utils/logger.js';

// Setup ScreenManager and assign to global window for cross-module service access
const screenManager = new ScreenManager();
window.gameEngine = gameEngine;
gameEngine.screenManager = screenManager;

// Register UI screens
screenManager.registerScreen(SCREENS.MENU, new MenuUI());
screenManager.registerScreen(SCREENS.CREATION, new CharacterCreationUI());
screenManager.registerScreen(SCREENS.GAME, new GameUI());
screenManager.registerScreen(SCREENS.COMBAT, new CombatUI());
screenManager.registerScreen(SCREENS.INVENTORY, new InventoryUI());
screenManager.registerScreen(SCREENS.SHOP, new ShopUI());
screenManager.registerScreen(SCREENS.QUEST_LOG, new QuestUI());
screenManager.registerScreen(SCREENS.DIALOG, new DialogUI());

// Register custom screens (Victory & Defeat) directly
screenManager.registerScreen(SCREENS.DEATH, {
  render(container) {
    container.innerHTML = `
      <div class="screen-menu" style="background: radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.25) 0%, transparent 80%), var(--color-bg-primary)">
        <div style="text-align:center; max-width:500px">
          <h1 class="text-gold font-display" style="font-size:3.5rem; letter-spacing:5px; text-shadow:0 0 15px rgba(220,38,38,0.6)">HAS CAÍDO</h1>
          <p class="text-secondary" style="margin:20px 0; font-style:italic">"Tus hazañas terminan aquí, pero tu leyenda perdura en los susurros del bosque..."</p>
          <button id="btn-defeat-restart" class="btn btn-primary btn-block">Reiniciar Aventura</button>
        </div>
      </div>
    `;
  },
  bindEvents() {
    document.getElementById('btn-defeat-restart').addEventListener('click', () => {
      gameEngine.services.save.deleteSave();
      gameState.setScreen(SCREENS.MENU);
    });
  }
});

screenManager.registerScreen(SCREENS.VICTORY, {
  render(container) {
    container.innerHTML = `
      <div class="screen-menu" style="background: radial-gradient(ellipse at 50% 50%, rgba(234, 179, 8, 0.25) 0%, transparent 80%), var(--color-bg-primary)">
        <div style="text-align:center; max-width:600px">
          <span style="font-size:5rem">👑</span>
          <h1 class="text-gold font-display" style="font-size:3.5rem; letter-spacing:5px; text-shadow:0 0 20px rgba(234,179,8,0.7); margin-top:20px">¡VICTORIA!</h1>
          <h2 class="text-sm font-mono text-secondary" style="margin-top:10px">Has derrotado al Señor Oscuro Malachar</h2>
          <p class="text-secondary" style="margin:25px 0; line-height:1.7">
            Las nubes tormentosas se disipan. La gema ancestral resplandece una vez más con luz pura, y los reinos de Aethermoor quedan finalmente liberados del yugo de la ceniza. ¡La paz ha retornado gracias a tu valentía!
          </p>
          <button id="btn-victory-restart" class="btn btn-primary btn-block">Volver al Menú Principal</button>
        </div>
      </div>
    `;
  },
  bindEvents() {
    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      gameEngine.services.save.deleteSave();
      gameState.setScreen(SCREENS.MENU);
    });
  }
});

// Hook dynamic level-ups checking to combat wins or exploration triggers
eventBus.on(EVENTS.COMBAT_WIN, (data) => {
  const player = gameState.getPlayer();
  if (player) {
    // 1. Log defeat details
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Obtienes +${data.expGained} EXP y +${data.goldGained} Oro.`,
      type: 'reward'
    });

    // 2. Feed quests monster kills
    gameEngine.services.quest.checkCombatProgress(data.enemy);

    // 3. Award experience points
    player.exp += data.expGained;
    player.gold += data.goldGained;

    // 4. Distribute item drops
    data.loot.forEach(item => {
      gameEngine.services.inventory.addItem(item, 1);
    });

    // 5. Run levels checker
    gameEngine.services.inventory.checkLevelUp(player);
  }

  // Delay screen change slightly for rewards review
  setTimeout(() => {
    gameState.setScreen(SCREENS.GAME);
  }, 3000);
});

// Hook toast portal
eventBus.on(EVENTS.TOAST_SHOW, (data) => {
  screenManager.showToast(data.message, data.type);
});

// Hook player death status
eventBus.on(EVENTS.PLAYER_DIED, () => {
  setTimeout(() => {
    gameState.setScreen(SCREENS.DEATH);
  }, 1500);
});

// Window startup
window.addEventListener('DOMContentLoaded', () => {
  logger.info('Crónicas de Aethermoor - Web RPG inicializado.');
  gameEngine.init();
});
