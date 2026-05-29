/**
 * CombatUI.js — Combat UI coordinator. Turn logs, damage numbers overlays, skills selection.
 */

import { gsap } from 'gsap';
import { SCREENS, EVENTS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { percentage } from '../utils/helpers.js';
import { audioManager } from '../services/AudioManager.js';

export class CombatUI {
  constructor() {
    this.logs = [];

    // Log combat specific events
    eventBus.on(EVENTS.LOG_MESSAGE, (data) => {
      if (gameState.get('currentScreen') !== SCREENS.COMBAT) return;
      this.logs.push(data);
      this._updateLogDOM();
    });

    // Display damage animations on actions
    eventBus.on(EVENTS.COMBAT_ACTION, (data) => {
      this._animateCombatAction(data);
    });
  }

  /**
   * Render Battle Arena layout
   * @param {HTMLElement} container
   */
  render(container) {
    const player = gameState.getPlayer();
    const combat = gameState.getCombat();
    if (!player || !combat) return;

    const enemy = combat.enemy;

    // HP & MP percentages
    const playerHpPct = percentage(player.hp, player.getMaxHp());
    const playerMpPct = percentage(player.mp, player.getMaxMp());
    const enemyHpPct = percentage(enemy.hp, enemy.stats.maxHp);

    // Dynamic skills triggers
    let skillsHtml = '';
    const skills = player.getUnlockedSkills();
    skills.forEach(skill => {
      const disabled = player.mp < skill.mpCost || combat.turn !== 'player';
      skillsHtml += `
        <button class="btn btn-secondary btn-sm btn-skill" data-skill-id="${skill.id}" ${disabled ? 'disabled' : ''}>
          <span>${skill.icon} ${skill.name}</span>
          <span style="font-size:8px; opacity:0.8"> (${skill.mpCost} PM)</span>
        </button>
      `;
    });

    // Dynamic potion inventory list
    let potionsHtml = '';
    const potions = player.inventory.filter(i => i.type === 'potion');
    if (potions.length > 0) {
      potions.forEach(potion => {
        potionsHtml += `
          <button class="btn btn-ghost btn-sm btn-potion" data-potion-id="${potion.id}" ${combat.turn !== 'player' ? 'disabled' : ''}>
            <span>${potion.icon} ${potion.name} (x${potion.quantity})</span>
          </button>
        `;
      });
    } else {
      potionsHtml = '<span class="text-xs text-muted">Sin pociones de combate.</span>';
    }

    // Build status effects badges
    let playerStatusHtml = '';
    for (const key in combat.playerStatusEffects) {
      if (combat.playerStatusEffects[key].duration > 0) {
        playerStatusHtml += `<span class="status-badge status-${key}">${key.toUpperCase()} (${combat.playerStatusEffects[key].duration})</span>`;
      }
    }

    let enemyStatusHtml = '';
    for (const key in combat.enemyStatusEffects) {
      if (combat.enemyStatusEffects[key].duration > 0) {
        enemyStatusHtml += `<span class="status-badge status-${key}">${key.toUpperCase()} (${combat.enemyStatusEffects[key].duration})</span>`;
      }
    }

    container.innerHTML = `
      <div class="screen-combat">
        <div class="combat-arena">
          
          <!-- FIELD AREA -->
          <div class="combat-field">
            
            <!-- PLAYER PANEL -->
            <div id="player-panel-card" class="fighter-panel">
              <div id="player-sprite-div" class="fighter-sprite player-sprite">🛡️</div>
              <h3 class="fighter-name">${player.name}</h3>
              <span class="fighter-level">Nivel ${player.level} (${player.classType.toUpperCase()})</span>
              
              <div class="fighter-bars">
                <!-- HP -->
                <div class="bar-container bar-hp">
                  <div class="bar-label"><span>Vida</span><span>${player.hp}/${player.getMaxHp()}</span></div>
                  <div class="bar-track"><div id="player-hp-bar" class="bar-fill" style="width: ${playerHpPct}%"></div></div>
                </div>
                <!-- MP -->
                <div class="bar-container bar-mp" style="margin-top:5px">
                  <div class="bar-label"><span>Maná</span><span>${player.mp}/${player.getMaxMp()}</span></div>
                  <div class="bar-track"><div id="player-mp-bar" class="bar-fill" style="width: ${playerMpPct}%"></div></div>
                </div>
              </div>
              <div class="fighter-status">${playerStatusHtml}</div>
            </div>

            <!-- VS DIVIDER -->
            <div id="combat-vs-divider" class="combat-vs">VS</div>

            <!-- ENEMY PANEL -->
            <div id="enemy-panel-card" class="fighter-panel">
              <div id="enemy-sprite-div" class="fighter-sprite enemy-sprite">${enemy.icon}</div>
              <h3 class="fighter-name">${enemy.name}</h3>
              <span class="fighter-level">Nivel ${enemy.level} ${enemy.isBoss ? '🔥 JEFE' : ''}</span>
              
              <div class="fighter-bars">
                <!-- HP -->
                <div class="bar-container bar-enemy">
                  <div class="bar-label"><span>Vida</span><span>${enemy.hp}/${enemy.stats.maxHp}</span></div>
                  <div class="bar-track"><div id="enemy-hp-bar" class="bar-fill" style="width: ${enemyHpPct}%"></div></div>
                </div>
              </div>
              <div class="fighter-status">${enemyStatusHtml}</div>
            </div>

          </div>

          <!-- LOG CONSOLE -->
          <div id="combat-log-console" class="combat-log">
            <div class="log-entry log-system">Ronda ${combat.round}: Esperando órdenes...</div>
          </div>

          <!-- ACTION SWITCHBOARD -->
          <div class="combat-actions">
            <button id="btn-combat-attack" class="btn btn-primary" ${combat.turn !== 'player' ? 'disabled' : ''}>⚔️ Atacar</button>
            <button id="btn-combat-defend" class="btn btn-ghost" ${combat.turn !== 'player' ? 'disabled' : ''}>🛡️ Defender</button>
            
            <!-- Magic Skills list -->
            <div style="grid-column: span 2; display: flex; flex-direction:column; gap:5px">
              <span class="text-xs text-gold" style="font-weight:600">HABILIDADES DE CLASE</span>
              <div style="display:flex; flex-wrap:wrap; gap:5px">${skillsHtml}</div>
            </div>

            <!-- Consumables list -->
            <div style="grid-column: span 2; display: flex; flex-direction:column; gap:5px; margin-top:10px">
              <span class="text-xs text-gold" style="font-weight:600">POCIONES</span>
              <div style="display:flex; flex-wrap:wrap; gap:5px">${potionsHtml}</div>
            </div>

            <button id="btn-combat-flee" class="btn btn-danger" style="grid-column: span 2" ${combat.turn !== 'player' ? 'disabled' : ''}>🏃 Huir de Combate</button>
          </div>

        </div>
      </div>
    `;

    this._updateLogDOM();
  }

  /**
   * Render log arrays directly to UI console
   * @private
   */
  _updateLogDOM() {
    const consoleDiv = document.getElementById('combat-log-console');
    if (!consoleDiv) return;

    let html = '';
    // display only 5 last entries to avoid UI overload
    const chunk = this.logs.slice(-5);
    for (const entry of chunk) {
      html += `<div class="log-entry log-${entry.type}" style="opacity: 0; transform: translateY(5px)">${entry.text}</div>`;
    }
    consoleDiv.innerHTML = html;

    const entries = consoleDiv.querySelectorAll('.log-entry');
    gsap.to(entries, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      stagger: 0.08,
      ease: 'power2.out'
    });

    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  }

  /**
   * Run sprite punch or shake movements on hits with GSAP
   * @private
   * @param {Object} data — { attacker, defender, damage, action, isCrit }
   */
  _animateCombatAction(data) {
    const isPlayerAttacking = data.attacker === 'player';
    const attackerCard = document.getElementById(isPlayerAttacking ? 'player-panel-card' : 'enemy-panel-card');
    const defenderCard = document.getElementById(isPlayerAttacking ? 'enemy-panel-card' : 'player-panel-card');
    const defenderSprite = document.getElementById(isPlayerAttacking ? 'enemy-sprite-div' : 'player-sprite-div');

    if (!attackerCard || !defenderCard) return;

    const direction = isPlayerAttacking ? 50 : -50;

    // Trigger attacks sounds
    if (data.action === 'heal') {
      audioManager.playSfx('heal', 0.6);
    } else if (data.action === 'skill' || data.action === 'spell') {
      audioManager.playSfx('magic', 0.6);
    } else {
      audioManager.playSfx('hit', 0.6);
      if (!isPlayerAttacking) audioManager.playSfx('hurt', 0.55);
    }

    // GSAP combat card physical punch tween
    gsap.timeline()
      .to(attackerCard, {
        x: direction,
        scale: 1.05,
        duration: 0.15,
        ease: 'power2.out'
      })
      .call(() => {
        // Flash target defender sprite briefly
        if (data.action === 'heal') {
          gsap.fromTo(defenderSprite, { filter: 'brightness(2) saturate(1.5) hue-rotate(90deg)' }, { filter: 'none', duration: 0.35 });
        } else {
          gsap.fromTo(defenderSprite, { filter: 'brightness(2) saturate(1.5) hue-rotate(-50deg)' }, { filter: 'none', duration: 0.35 });
        }

        // Damage popup rising parabolic
        this._spawnDamagePopup(data.damage, defenderSprite, data.action === 'heal', data.isCrit);

        // Shake target card
        gsap.fromTo(defenderCard,
          { x: 0 },
          {
            x: isPlayerAttacking ? 12 : -12,
            duration: 0.07,
            repeat: 3,
            yoyo: true,
            ease: 'sine.inOut',
            onComplete: () => {
              gsap.set(defenderCard, { clearProps: 'x' });
            }
          }
        );

        // Refresh DOM with slight delay to capture new HP/bars state
        setTimeout(() => {
          this.render(document.getElementById('app'));
          this.bindEvents();
        }, 300);
      })
      .to(attackerCard, {
        x: 0,
        scale: 1,
        duration: 0.25,
        ease: 'power2.inOut',
        clearProps: 'x,scale'
      });
  }

  /**
   * Generate float damage floating indicators in battle screen
   * @private
   */
  _spawnDamagePopup(amount, targetElement, isHeal, isCrit) {
    const popup = document.createElement('div');
    popup.className = `damage-popup ${isCrit ? 'critical' : ''} ${isHeal ? 'heal' : ''}`;
    popup.textContent = isHeal ? `+${Math.abs(amount)}` : `-${amount}`;

    const rect = targetElement.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top;

    popup.style.left = `${startX}px`;
    popup.style.top = `${startY}px`;
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.transform = 'translate(-50%, -50%) scale(0.5)';
    popup.style.pointerEvents = 'none';
    popup.style.animation = 'none';

    document.body.appendChild(popup);

    const randomX = (Math.random() - 0.5) * 100;
    const randomY = -80 - Math.random() * 40;

    gsap.timeline({
      onComplete: () => popup.remove()
    })
    .to(popup, {
      opacity: 1,
      scale: isCrit ? 1.75 : 1.25,
      x: randomX * 0.4,
      y: randomY * 0.5,
      duration: 0.25,
      ease: 'back.out(2)'
    })
    .to(popup, {
      x: randomX,
      y: randomY,
      opacity: 0,
      scale: 0.8,
      duration: 0.65,
      ease: 'power2.in',
      delay: 0.15
    });
  }

  /**
   * Bind event triggers to DOM
   */
  bindEvents() {
    const btnAttack = document.getElementById('btn-combat-attack');
    const btnDefend = document.getElementById('btn-combat-defend');
    const btnFlee = document.getElementById('btn-combat-flee');

    if (btnAttack) {
      btnAttack.addEventListener('click', () => {
        window.gameEngine.services.combat.playerAttack();
      });
    }

    if (btnDefend) {
      btnDefend.addEventListener('click', () => {
        window.gameEngine.services.combat.playerDefend();
      });
    }

    if (btnFlee) {
      btnFlee.addEventListener('click', () => {
        window.gameEngine.services.combat.playerFlee();
      });
    }

    // Bind skills triggers
    const skillBtns = document.querySelectorAll('.btn-skill');
    skillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const skillId = btn.getAttribute('data-skill-id');
        const player = gameState.getPlayer();
        const skill = player.getUnlockedSkills().find(s => s.id === skillId);
        if (skill) {
          window.gameEngine.services.combat.playerUseSkill(skill);
        }
      });
    });

    // Bind potion use triggers
    const potionBtns = document.querySelectorAll('.btn-potion');
    potionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const instanceId = btn.getAttribute('data-potion-id');
        window.gameEngine.services.combat.playerUsePotion(instanceId);
      });
    });
  }
}
