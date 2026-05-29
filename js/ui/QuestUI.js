/**
 * QuestUI.js — Renders quests tracking log checklist and completions status
 */

import { SCREENS, QUEST_STATUS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { QUEST_DATA } from '../data/quests.js';

export class QuestUI {
  /**
   * Render screen layout
   * @param {HTMLElement} container
   */
  render(container) {
    const tracking = gameState.get('questsTracking');
    if (!tracking) return;

    let activeHtml = '';
    let completedHtml = '';

    for (const id in tracking) {
      const stateObj = tracking[id];
      const qData = QUEST_DATA[id];

      const html = `
        <div class="card" style="margin-bottom:12px; padding:15px">
          <h4 class="text-gold" style="font-size:1rem">${qData.title}</h4>
          <p class="text-xs text-secondary" style="margin-top:5px; font-style:italic">"${qData.description}"</p>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
            <span class="text-xs font-mono text-muted">
              Progreso: [${stateObj.currentCount}/${qData.objectives.targetCount}]
            </span>
            <span class="text-xs text-gold font-mono" style="text-transform:uppercase">
              Recompensa: ${qData.rewards.exp} EXP / ${qData.rewards.gold} Oro
            </span>
          </div>
        </div>
      `;

      if (stateObj.status === QUEST_STATUS.ACTIVE || stateObj.status === QUEST_STATUS.COMPLETED) {
        activeHtml += html;
      } else if (stateObj.status === QUEST_STATUS.TURNED_IN) {
        completedHtml += html;
      }
    }

    container.innerHTML = `
      <div class="screen-shop">
        <header class="shop-header">
          <h2 class="heading-3 text-gold">📜 Registro de Misiones</h2>
          <p class="text-secondary text-sm">Organiza tus misiones de campaña y recompensas opcionales</p>
        </header>

        <main class="shop-layout">
          <!-- ACTIVE QUESTS -->
          <div class="shop-panel">
            <h3 class="shop-panel-title">Misiones en Progreso</h3>
            <div>
              ${activeHtml || '<span class="text-xs text-muted">No tienes misiones activas en este momento. Habla con NPCs del mapa para obtener tareas.</span>'}
            </div>
          </div>

          <!-- COMPLETED QUESTS -->
          <div class="shop-panel">
            <h3 class="shop-panel-title">Historial / Completadas</h3>
            <div>
              ${completedHtml || '<span class="text-xs text-muted">No has completado misiones todavía.</span>'}
            </div>
          </div>
        </main>

        <div style="max-width: var(--max-width-game); margin: 20px auto; width:100%">
          <button id="btn-quests-back" class="btn btn-ghost btn-block">Volver al Mapa</button>
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const btnBack = document.getElementById('btn-quests-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        gameState.setScreen(SCREENS.GAME);
      });
    }
  }
}
