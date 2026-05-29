/**
 * GameUI.js — HUD, region maps navigation, action triggers, logs, and modal inventory links
 */

import { SCREENS, EVENTS, REGIONS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { MAP_DATA } from '../data/maps.js';
import { NPC_DATA } from '../data/npcs.js';
import { formatNumber, percentage } from '../utils/helpers.js';
import { expForLevel } from '../utils/constants.js';
import { ExplorationMapUI } from './ExplorationMapUI.js';
import { CHARACTER_IMAGES } from '../data/images.js';

export class GameUI {
  constructor() {
    this.logs = [];
    this.maxLogs = 10;

    // Handle incoming messages to append to HUD
    eventBus.on(EVENTS.LOG_MESSAGE, (data) => {
      this.logs.push(data);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      this._updateLogDOM();
    });
  }

  /**
   * Render primary exploration page and HUD
   * @param {HTMLElement} container
   */
  render(container) {
    const player = gameState.getPlayer();
    if (!player) return;

    const regionId = gameState.get('currentRegion');
    const region = MAP_DATA[regionId];

    // HP & MP bars progress
    const hpPct = percentage(player.hp, player.stats.maxHp);
    const mpPct = percentage(player.mp, player.stats.maxMp);
    const expReq = expForLevel(player.level);
    const expPct = percentage(player.exp, expReq);

    // Build adjacent regions connections list
    let regionsHtml = '';
    for (const key of region.connections) {
      const target = MAP_DATA[key];
      const isUnlocked = gameState.isRegionUnlocked(key);
      regionsHtml += `
        <button class="btn btn-ghost btn-sm btn-travel" data-region="${key}" ${isUnlocked ? '' : 'disabled'}>
          <span>${target.icon} Viajar a ${target.name}</span>
          ${isUnlocked ? '' : '<span style="font-size:8px; opacity:0.6"> (Cerrado)</span>'}
        </button>
      `;
    }

    // Build regional NPC list
    let npcsHtml = '';
    if (region.npcs && region.npcs.length > 0) {
      for (const npcId of region.npcs) {
        const npc = NPC_DATA[npcId];
        npcsHtml += `
          <button class="btn btn-secondary btn-sm btn-npc" data-npc="${npcId}">
            <span>${npc.icon} Hablar con ${npc.name}</span>
          </button>
        `;
      }
    }

    // Build logs HTML
    let logsHtml = '';
    for (const entry of this.logs) {
      logsHtml += `<div class="log-entry log-${entry.type}">${entry.text}</div>`;
    }

    const base64Img = CHARACTER_IMAGES[player.classType];
    const avatarHtml = base64Img 
      ? `<img src="data:image/png;base64,${base64Img}" class="hud-avatar-img" alt="${player.classType}">`
      : `🛡️`;

    container.innerHTML = `
      <div class="screen-game">
        <!-- TOP HUD -->
        <header class="hud">
          <div class="hud-player-info">
            <div class="hud-avatar">${avatarHtml}</div>
            <div class="hud-details">
              <div class="hud-name">${player.name}</div>
              <div class="hud-level font-mono">Nivel ${player.level} (${player.classType.toUpperCase()})</div>
            </div>
          </div>
          
          <div class="hud-bars">
            <!-- HP -->
            <div class="bar-container bar-hp bar-compact ${player.hp < player.stats.maxHp * 0.25 ? 'low' : ''}">
              <div class="bar-label"><span>PV</span><span>${player.hp}/${player.stats.maxHp}</span></div>
              <div class="bar-track"><div class="bar-fill" style="width: ${hpPct}%"></div></div>
            </div>
            <!-- MP -->
            <div class="bar-container bar-mp bar-compact">
              <div class="bar-label"><span>PM</span><span>${player.mp}/${player.stats.maxMp}</span></div>
              <div class="bar-track"><div class="bar-fill" style="width: ${mpPct}%"></div></div>
            </div>
            <!-- EXP -->
            <div class="bar-container bar-exp bar-compact">
              <div class="bar-label"><span>EXP</span><span>${player.exp}/${expReq}</span></div>
              <div class="bar-track"><div class="bar-fill" style="width: ${expPct}%"></div></div>
            </div>
          </div>
          
          <div class="hud-gold">💰 <span class="font-mono">${formatNumber(player.gold)}</span></div>
          
          <div class="hud-actions">
            <button id="btn-inventory-open" class="btn btn-ghost btn-sm">🎒 Bolsa</button>
            <button id="btn-quests-open" class="btn btn-ghost btn-sm">📜 Misiones</button>
            <button id="btn-save" class="btn btn-ghost btn-sm">💾 Guardar</button>
          </div>
        </header>

        <!-- GAME AREA -->
        <main class="game-content">
          <div class="location-header card">
            <div style="font-size: 3rem">${region.icon}</div>
            <h2 class="location-name font-display">${region.name}</h2>
            <div class="text-xs text-gold font-mono" style="margin-bottom:10px">${region.levelRange}</div>
            <p class="location-description">${region.description}</p>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap: 20px; margin-top: 20px">
            <!-- LEFT ACTIONS -->
            <div class="card" style="display:flex; flex-direction:column; gap:15px">
              <h3 class="card-title text-gold" style="font-size:1rem; border-bottom:1px solid var(--color-border); padding-bottom:10px">Acciones de Zona</h3>
              
              <button id="btn-explore" class="btn btn-primary">🔍 Explorar Región</button>
              
              ${region.bossId ? `<button id="btn-challenge-boss" class="btn btn-danger">💀 Desafiar Jefe Regional</button>` : ''}
              
              <h3 class="card-title text-gold" style="font-size:1rem; border-bottom:1px solid var(--color-border); padding-bottom:10px; margin-top:20px">Personajes</h3>
              <div style="display:flex; flex-direction:column; gap:10px">
                ${npcsHtml || '<span class="text-xs text-muted">No hay NPCs en esta zona.</span>'}
              </div>
            </div>

            <!-- RIGHT NAVIGATION AND LOGS -->
            <div style="display:flex; flex-direction:column; gap:20px">
              <!-- Travel connections -->
              <div class="card">
                <h3 class="card-title text-gold" style="font-size:1rem; border-bottom:1px solid var(--color-border); padding-bottom:10px">Mapa / Viaje Rápido</h3>
                <div style="display:grid; grid-template-columns:1fr; gap:10px; margin-top:10px">
                  ${regionsHtml}
                </div>
              </div>

              <!-- Log Console -->
              <div class="card" style="flex:1; display:flex; flex-direction:column">
                <h3 class="card-title font-mono" style="font-size:0.9rem">Bitácora de Viaje</h3>
                <div id="game-log-console" class="game-log" style="flex:1; max-height: 250px; overflow-y:auto; margin-top:10px">
                  ${logsHtml || '<div class="log-entry log-system">La aventura te aguarda...</div>'}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    // Ensure scrolls down logs
    this._scrollToBottomLogs();
  }

  /**
   * Update active logs dynamically inside DOM
   * @private
   */
  _updateLogDOM() {
    const consoleDiv = document.getElementById('game-log-console');
    if (!consoleDiv) return;

    let html = '';
    for (const entry of this.logs) {
      html += `<div class="log-entry log-${entry.type}">${entry.text}</div>`;
    }
    consoleDiv.innerHTML = html;
    this._scrollToBottomLogs();
  }

  _scrollToBottomLogs() {
    setTimeout(() => {
      const consoleDiv = document.getElementById('game-log-console');
      if (consoleDiv) consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }, 50);
  }

  /**
   * Bind DOM Actions
   */
  bindEvents() {
    const btnExplore = document.getElementById('btn-explore');
    const btnBoss = document.getElementById('btn-challenge-boss');
    const btnSave = document.getElementById('btn-save');
    const btnInventory = document.getElementById('btn-inventory-open');
    const btnQuests = document.getElementById('btn-quests-open');

    // Explore Clicks
    if (btnExplore) {
      btnExplore.addEventListener('click', () => {
        const explorationMap = new ExplorationMapUI();
        explorationMap.open();
      });
    }

    // Boss Fights Trigger
    if (btnBoss) {
      btnBoss.addEventListener('click', () => {
        window.gameEngine.services.map.challengeBoss();
      });
    }

    // Manual Save
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        window.gameEngine.saveGame();
      });
    }

    // Open Modals / Subscreens
    if (btnInventory) {
      btnInventory.addEventListener('click', () => {
        gameState.setScreen(SCREENS.INVENTORY);
      });
    }

    if (btnQuests) {
      btnQuests.addEventListener('click', () => {
        gameState.setScreen(SCREENS.QUEST_LOG);
      });
    }

    // Dynamic travel connections listeners
    const travelBtns = document.querySelectorAll('.btn-travel');
    travelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = btn.getAttribute('data-region');
        window.gameEngine.services.map.travelTo(dest);
        this.render(document.getElementById('app'));
        this.bindEvents();
      });
    });

    // NPC Dialog Interaction
    const npcBtns = document.querySelectorAll('.btn-npc');
    npcBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const npcId = btn.getAttribute('data-npc');
        eventBus.emit(EVENTS.NPC_INTERACT, { npcId });
      });
    });
  }
}
