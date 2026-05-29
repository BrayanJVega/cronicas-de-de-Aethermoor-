/**
 * DialogUI.js — UI screen for branching dialogues with choices. Coordinating triggers.
 */

import Typewriter from 'typewriter-effect/dist/core';
import { gsap } from 'gsap';
import { SCREENS, EVENTS, QUEST_STATUS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { DIALOGUE_DATA } from '../data/dialogues.js';
import { NPC_DATA } from '../data/npcs.js';
import { QUEST_DATA } from '../data/quests.js';
import { audioManager } from '../services/AudioManager.js';

export class DialogUI {
  constructor() {
    this.npcId = null;
    this.currentNodeId = 'greeting';

    // Hook onto npc interactions
    eventBus.on(EVENTS.NPC_INTERACT, (data) => {
      this.npcId = data.npcId;
      const npc = NPC_DATA[data.npcId];
      this.currentNodeId = npc.dialogueTreeId ? DIALOGUE_DATA[npc.dialogueTreeId].startNode : 'greeting';

      gameState.setScreen(SCREENS.DIALOG);
    });
  }

  /**
   * Render active Dialogue screen layout
   * @param {HTMLElement} container
   */
  render(container) {
    const player = gameState.getPlayer();
    const npc = NPC_DATA[this.npcId];
    if (!player || !npc) return;

    const dialogTree = DIALOGUE_DATA[npc.dialogueTreeId];
    let node = dialogTree ? dialogTree.nodes[this.currentNodeId] : null;

    // Default basic dialogue tree fallback if missing
    if (!node) {
      node = {
        text: 'Hola aventurero, ten un excelente viaje.',
        choices: [{ text: 'Adiós.', nextNode: 'exit' }]
      };
    }

    // --- DYNAMIC DIALOGUE MERGE FOR QUEST TURN-INS ---
    let customChoices = [];
    if (npc.questIds && npc.questIds.length > 0) {
      const tracking = gameState.get('questsTracking') || {};
      npc.questIds.forEach(questId => {
        const status = tracking[questId]?.status;
        const qData = QUEST_DATA[questId];

        if (status === QUEST_STATUS.COMPLETED) {
          customChoices.push({
            text: `🎁 [Entregar Misión] Reclamar recompensas de "${qData.title}"`,
            action: `turnInQuest:${questId}`,
            nextNode: 'exit'
          });
        } else if (status === QUEST_STATUS.AVAILABLE && window.gameEngine.services.quest.isQuestUnlocked(questId)) {
          customChoices.push({
            text: `📜 [Misión Disponible] Hablar sobre "${qData.title}"`,
            nextNode: 'ask_help' // usually points to mission briefings
          });
        }
      });
    }

    // Merge custom triggers
    const choices = [...customChoices, ...(node.choices || [])];

    let choicesHtml = '';
    choices.forEach((choice, index) => {
      choicesHtml += `
        <button class="btn btn-ghost btn-block btn-choice" style="opacity: 0; transform: translateY(10px)" data-index="${index}" data-next="${choice.nextNode}" data-action="${choice.action || ''}">
          <span>${choice.text}</span>
        </button>
      `;
    });

    container.innerHTML = `
      <div class="screen-menu" style="background: radial-gradient(ellipse at 50% 100%, rgba(59, 130, 246, 0.12) 0%, transparent 60%), var(--color-bg-primary)">
        <div class="card dialogue-card" style="max-width: 600px; width: 100%; display:flex; flex-direction:column; gap:20px; padding:30px">
          
          <!-- Header NPC identity -->
          <div style="display:flex; align-items:center; gap:15px; border-bottom:1px solid var(--color-border); padding-bottom:15px">
            <span style="font-size:3.5rem">${npc.icon}</span>
            <div>
              <h3 class="text-gold font-display" style="font-size:1.4rem">${npc.name}</h3>
              <span class="text-xs text-muted" style="text-transform:uppercase">${npc.role.replace('_', ' ')}</span>
            </div>
          </div>

          <!-- Dialog Text with Typewriter target -->
          <p id="dialogue-text" class="text-md font-mono" style="line-height:1.6; color:var(--color-text-primary); text-align:justify; margin:10px 0; min-height: 70px;">
            <!-- Rendered by typewriter-effect -->
          </p>

          <!-- Choices Actions Grid -->
          <div id="choices-container" style="display:flex; flex-direction:column; gap:10px; margin-top:10px">
            ${choicesHtml}
          </div>

        </div>
      </div>
    `;

    // Store raw text for the typewriter trigger in bindEvents
    this._currentNodeText = node.text;
  }

  /**
   * Bind Choice action listeners and execute typewriter
   */
  bindEvents() {
    const textElement = document.getElementById('dialogue-text');
    const choicesContainer = document.getElementById('choices-container');
    const choicesList = document.querySelectorAll('.btn-choice');

    if (textElement) {
      // 1. Initialize Typewriter
      const typewriter = new Typewriter(textElement, {
        delay: 25,
        cursor: '▮',
        autoStart: false
      });

      // Simple voice tick helper
      let tickCount = 0;
      typewriter
        .typeString(`"${this._currentNodeText}"`)
        .callFunction(() => {
          // Cleanup typewriter cursor on complete
          const cursor = textElement.querySelector('.Typewriter__cursor');
          if (cursor) cursor.style.display = 'none';

          // 2. Cascade show choices using GSAP
          gsap.to(choicesList, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.1,
            ease: 'power2.out'
          });
        })
        .start();

      // Hook typewriter tick sound
      const checkTypewriterTicks = setInterval(() => {
        if (!textElement) {
          clearInterval(checkTypewriterTicks);
          return;
        }
        
        // Count text length changes to play micro-sfx
        const length = textElement.textContent.length;
        if (length > tickCount) {
          tickCount = length;
          // Play tiny high frequency text ticks
          if (length % 2 === 0) {
            audioManager.playSfx('hover', 0.08);
          }
        }

        // Stop interval if writing completed
        if (length >= this._currentNodeText.length + 2) {
          clearInterval(checkTypewriterTicks);
        }
      }, 50);
    }

    // 3. Bind choice button clicks
    choicesList.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextNode = btn.getAttribute('data-next');
        const action = btn.getAttribute('data-action');

        // Resolve custom triggers bound to choice elements
        if (action) {
          this._resolveChoiceAction(action);
        }

        if (nextNode === 'exit') {
          gameState.setScreen(SCREENS.GAME);
          return;
        }

        this.currentNodeId = nextNode;
        this.render(document.getElementById('app'));
        this.bindEvents();
      });
    });
  }

  /**
   * Coordinate custom triggers inside the dialogue choices
   * @private
   */
  _resolveChoiceAction(action) {
    const parts = action.split(':');
    const type = parts[0];
    const payload = parts[1];

    if (type === 'acceptQuest') {
      window.gameEngine.services.quest.acceptQuest(payload);
    } else if (type === 'turnInQuest') {
      window.gameEngine.services.quest.turnInQuest(payload);
    } else if (type === 'openShop') {
      // Setup the dynamic merchant screen and trigger screen change
      window.gameEngine.screenManager.screens[SCREENS.SHOP].setMerchant(this.npcId);
      // Wait briefly for smooth dialog animation to complete
      setTimeout(() => {
        gameState.setScreen(SCREENS.SHOP);
      }, 100);
    } else if (type === 'healPlayer') {
      const player = gameState.getPlayer();
      const goldCost = Number(payload);

      if (player.gold < goldCost) {
        eventBus.emit(EVENTS.TOAST_SHOW, {
          message: '¡Oro insuficiente para comprar ungüentos!',
          type: 'error'
        });
        return;
      }

      player.gold -= goldCost;
      player.fullHeal();
      audioManager.playSfx('heal', 0.6);
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: 'La curandera Elara ha reconstituido tu vitalidad al completo.',
        type: 'reward'
      });
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '💚 Salud e Hilo espiritual restablecido',
        type: 'success'
      });
    }
  }
}
