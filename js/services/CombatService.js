/**
 * CombatService.js — Controls battle rounds, turn-based loops, damage, status effects, and AI actions utilizing Chance.js
 */

import Chance from 'chance';
const chance = new Chance();

import { COMBAT, EVENTS, SCREENS, STATUS_EFFECT } from '../utils/constants.js';
import { Enemy } from '../models/Enemy.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import logger from '../utils/logger.js';

export class CombatService {
  /**
   * Start battle against an enemy
   * @param {string} enemyId
   */
  startBattle(enemyId) {
    logger.info(`Starting battle against: ${enemyId}`);
    const player = gameState.getPlayer();
    if (!player) return;

    const enemy = new Enemy(enemyId);

    // Initialize state structure
    const combatState = {
      enemy,
      turn: player.getSpeed() >= enemy.stats.speed ? 'player' : 'enemy',
      round: 1,
      playerStatusEffects: {}, // poison, burn, freeze, stun: { duration }
      enemyStatusEffects: {},
      playerDefending: false,
      enemyDefending: false
    };

    gameState.setCombat(combatState);
    gameState.setScreen(SCREENS.COMBAT);

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `¡Un salvaje ${enemy.name} (Nivel ${enemy.level}) ha aparecido!`,
      type: 'combat'
    });

    if (combatState.turn === 'enemy') {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `El enemigo es más rápido y toma la iniciativa.`,
        type: 'combat'
      });
      setTimeout(() => this._executeEnemyTurn(), 1200);
    } else {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `Tomas la iniciativa en el combate.`,
        type: 'system'
      });
    }
  }

  /**
   * Player normal physical attack action
   */
  playerAttack() {
    const combat = gameState.getCombat();
    if (!combat || combat.turn !== 'player') return;

    const player = gameState.getPlayer();
    const enemy = combat.enemy;

    // Reset defense multiplier
    combat.playerDefending = false;

    // Roll accuracy / dodge
    if (chance.floating({ min: 0, max: 1 }) < (enemy.stats.dodgeChance || 0)) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `¡${enemy.name} esquivó tu ataque!`,
        type: 'system'
      });
      this._endPlayerTurn();
      return;
    }

    // Damage calculations
    let isCrit = chance.floating({ min: 0, max: 1 }) < player.getCritChance();
    let baseDamage = player.getAttack();
    let variance = Math.floor(baseDamage * COMBAT.DAMAGE_VARIANCE);
    let roll = baseDamage + (variance > 0 ? chance.integer({ min: -variance, max: variance }) : 0);

    // Apply opponent armor calculations
    let damageDealt = Math.max(
      COMBAT.MIN_DAMAGE,
      Math.floor(roll * (1 - enemy.stats.defense / (enemy.stats.defense + 100)))
    );

    if (isCrit) {
      damageDealt = Math.floor(damageDealt * COMBAT.CRIT_MULTIPLIER);
    }

    if (combat.enemyDefending) {
      damageDealt = Math.floor(damageDealt * COMBAT.DEFEND_MULTIPLIER);
    }

    // Apply damage
    enemy.hp = Math.max(0, enemy.hp - damageDealt);

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Atacas a ${enemy.name} infligiendo ${damageDealt} de daño físico.${isCrit ? ' ¡GOLPE CRÍTICO!' : ''}`,
      type: 'combat'
    });

    eventBus.emit(EVENTS.COMBAT_ACTION, {
      attacker: 'player',
      defender: 'enemy',
      damage: damageDealt,
      isCrit,
      action: 'attack'
    });

    if (this._checkDeath()) return;
    this._endPlayerTurn();
  }

  /**
   * Player use skill
   * @param {Object} skill
   */
  playerUseSkill(skill) {
    const combat = gameState.getCombat();
    if (!combat || combat.turn !== 'player') return;

    const player = gameState.getPlayer();
    const enemy = combat.enemy;

    if (player.mp < skill.mpCost) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡Maná insuficiente!',
        type: 'error'
      });
      return;
    }

    // Spend Mana
    player.mp -= skill.mpCost;
    combat.playerDefending = false;

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Usas la habilidad [${skill.name}] consumiendo ${skill.mpCost} PM.`,
      type: 'combat'
    });

    // Resolve Skill Type
    if (skill.type === 'physical' || skill.type === 'magical') {
      let isCrit = chance.floating({ min: 0, max: 1 }) < (player.getCritChance() + (skill.bonusCrit || 0));
      let baseStat = skill.type === 'physical' ? player.getAttack() : player.getMagicAttack();
      let rawDmg = Math.floor(baseStat * skill.damage);
      let variance = Math.floor(rawDmg * COMBAT.DAMAGE_VARIANCE);
      let roll = rawDmg + (variance > 0 ? chance.integer({ min: -variance, max: variance }) : 0);

      let opponentDef = skill.type === 'physical' ? enemy.stats.defense : enemy.stats.magicDefense;
      let damageDealt = Math.max(
        COMBAT.MIN_DAMAGE,
        Math.floor(roll * (1 - opponentDef / (opponentDef + 100)))
      );

      if (isCrit || skill.guaranteedCrit) {
        damageDealt = Math.floor(damageDealt * COMBAT.CRIT_MULTIPLIER);
        isCrit = true;
      }

      if (combat.enemyDefending) {
        damageDealt = Math.floor(damageDealt * COMBAT.DEFEND_MULTIPLIER);
      }

      // Apply damage
      enemy.hp = Math.max(0, enemy.hp - damageDealt);

      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `¡${skill.name} causa ${damageDealt} de daño a ${enemy.name}!`,
        type: 'combat'
      });

      // Handle custom status effects
      if (skill.statusEffect && chance.floating({ min: 0, max: 1 }) < skill.statusEffect.chance) {
        combat.enemyStatusEffects[skill.statusEffect.type] = {
          duration: skill.statusEffect.duration
        };
        eventBus.emit(EVENTS.LOG_MESSAGE, {
          text: `¡${enemy.name} está bajo el estado: ${skill.statusEffect.type.toUpperCase()}!`,
          type: 'combat'
        });
      }

      // Handle self debuffs
      if (skill.selfEffect) {
        combat.playerStatusEffects['debuff'] = {
          duration: skill.selfEffect.duration,
          defenseReduction: skill.selfEffect.defenseReduction
        };
      }

      eventBus.emit(EVENTS.COMBAT_ACTION, {
        attacker: 'player',
        defender: 'enemy',
        damage: damageDealt,
        isCrit,
        action: 'skill',
        icon: skill.icon
      });
    } else if (skill.type === 'heal') {
      const healAmount = Math.floor(player.getMaxHp() * skill.effect.healPercent);
      player.hp = Math.min(player.getMaxHp(), player.hp + healAmount);
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `Restauras ${healAmount} PV con magia sanadora.`,
        type: 'reward'
      });
      eventBus.emit(EVENTS.COMBAT_ACTION, {
        attacker: 'player',
        defender: 'player',
        damage: -healAmount,
        action: 'heal',
        icon: skill.icon
      });
    } else if (skill.type === 'buff') {
      combat.playerStatusEffects['buff_atk'] = {
        duration: skill.effect.duration,
        multiplier: skill.effect.attackBoost
      };
      if (skill.effect.healPercent) {
        const heal = Math.floor(player.getMaxHp() * skill.effect.healPercent);
        player.hp = Math.min(player.getMaxHp(), player.hp + heal);
      }
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `Sientes un torrente de poder enfurecido rodeándote.`,
        type: 'reward'
      });
    }

    if (this._checkDeath()) return;
    this._endPlayerTurn();
  }

  /**
   * Player defending action — reduces incoming round damage
   */
  playerDefend() {
    const combat = gameState.getCombat();
    if (!combat || combat.turn !== 'player') return;

    combat.playerDefending = true;
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: 'Adoptas una postura defensiva firme (+50% Defensa).',
      type: 'system'
    });

    this._endPlayerTurn();
  }

  /**
   * Player uses a potion in battle
   * @param {string} itemInstanceId
   */
  playerUsePotion(itemInstanceId) {
    const combat = gameState.getCombat();
    if (!combat || combat.turn !== 'player') return;

    // Use dynamically via gameEngine's inventory service binding
    const success = window.gameEngine.services.inventory.usePotion(itemInstanceId);
    if (success) {
      this._endPlayerTurn();
    }
  }

  /**
   * Attempt to escape combat
   */
  playerFlee() {
    const combat = gameState.getCombat();
    if (!combat || combat.turn !== 'player') return;

    const enemy = combat.enemy;
    if (enemy.isBoss) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡No puedes huir de un Jefe!',
        type: 'error'
      });
      return;
    }

    const escapeChance = COMBAT.FLEE_BASE_CHANCE + (gameState.getPlayer().getSpeed() - enemy.stats.speed) * 0.02;

    if (chance.floating({ min: 0, max: 1 }) < escapeChance) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: '¡Escapaste del combate exitosamente!',
        type: 'system'
      });
      gameState.setCombat(null);
      gameState.setScreen(SCREENS.GAME);
      eventBus.emit(EVENTS.COMBAT_FLEE);
    } else {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: '¡Intentaste huir pero el enemigo te bloqueó el paso!',
        type: 'combat'
      });
      this._endPlayerTurn();
    }
  }

  /**
   * End player's turn phase
   * @private
   */
  _endPlayerTurn() {
    const combat = gameState.getCombat();
    if (!combat) return;

    combat.turn = 'enemy';
    this._executeEnemyTurn();
  }

  /**
   * Handle enemy turn AI and calculations
   * @private
   */
  _executeEnemyTurn() {
    const combat = gameState.getCombat();
    if (!combat) return;

    const player = gameState.getPlayer();
    const enemy = combat.enemy;

    // 1. Resolve stun or freeze status effects on enemy
    if (combat.enemyStatusEffects.stun && combat.enemyStatusEffects.stun.duration > 0) {
      combat.enemyStatusEffects.stun.duration -= 1;
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `¡${enemy.name} está aturdido y pierde el turno!`,
        type: 'system'
      });
      this._endEnemyTurn();
      return;
    }

    if (combat.enemyStatusEffects.freeze && combat.enemyStatusEffects.freeze.duration > 0) {
      if (chance.floating({ min: 0, max: 1 }) < COMBAT.FREEZE_SKIP_CHANCE) {
        combat.enemyStatusEffects.freeze.duration -= 1;
        eventBus.emit(EVENTS.LOG_MESSAGE, {
          text: `¡${enemy.name} está congelado y no puede moverse!`,
          type: 'system'
        });
        this._endEnemyTurn();
        return;
      }
    }

    // 2. Select AI action (skill vs regular attack)
    let selectedSkill = null;
    if (enemy.skills.length > 0 && chance.floating({ min: 0, max: 1 }) < 0.4) {
      selectedSkill = enemy.skills[chance.integer({ min: 0, max: enemy.skills.length - 1 })];
    }

    combat.enemyDefending = false;

    // Roll player dodge
    if (chance.floating({ min: 0, max: 1 }) < player.getDodgeChance()) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `¡Esquivas el ataque de ${enemy.name}!`,
        type: 'reward'
      });
      this._endEnemyTurn();
      return;
    }

    // Attack calculations
    let multiplier = selectedSkill ? selectedSkill.damage || 1.3 : 1.0;
    let baseAtk = enemy.stats.attack;
    if (enemy.stats.magicAttack && selectedSkill && selectedSkill.type === 'magical') {
      baseAtk = enemy.stats.magicAttack;
    }

    let rawDmg = Math.floor(baseAtk * multiplier);
    let variance = Math.floor(rawDmg * COMBAT.DAMAGE_VARIANCE);
    let roll = rawDmg + (variance > 0 ? chance.integer({ min: -variance, max: variance }) : 0);

    // Apply player defense calculations
    let currentDef = player.getDefense();
    let dmgDealt = Math.max(
      COMBAT.MIN_DAMAGE,
      Math.floor(roll * (1 - currentDef / (currentDef + 100)))
    );

    if (combat.playerDefending) {
      dmgDealt = Math.floor(dmgDealt * COMBAT.DEFEND_MULTIPLIER);
    }

    // Apply damage
    player.hp = Math.max(0, player.hp - dmgDealt);

    if (selectedSkill) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `${enemy.name} usa [${selectedSkill.name}] infligiendo ${dmgDealt} de daño.`,
        type: 'combat'
      });

      // Handle status effect from enemy
      if (selectedSkill.statusEffect && chance.floating({ min: 0, max: 1 }) < selectedSkill.statusEffect.chance) {
        combat.playerStatusEffects[selectedSkill.statusEffect.type] = {
          duration: selectedSkill.statusEffect.duration
        };
        eventBus.emit(EVENTS.LOG_MESSAGE, {
          text: `¡Te infligen el estado: ${selectedSkill.statusEffect.type.toUpperCase()}!`,
          type: 'combat'
        });
      }
    } else {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `${enemy.name} te ataca infligiendo ${dmgDealt} de daño físico.`,
        type: 'combat'
      });
    }

    eventBus.emit(EVENTS.COMBAT_ACTION, {
      attacker: 'enemy',
      defender: 'player',
      damage: dmgDealt,
      action: selectedSkill ? 'skill' : 'attack'
    });

    if (this._checkDeath()) return;
    this._endEnemyTurn();
  }

  /**
   * End enemy's turn phase
   * @private
   */
  _endEnemyTurn() {
    const combat = gameState.getCombat();
    if (!combat) return;

    combat.turn = 'player';
    combat.round += 1;

    // Apply environmental ticks (poison, burns) at end of combat rounds
    this._applyStatusTicks();
  }

  /**
   * Resolve poison, burn status tick downs at round end
   * @private
   */
  _applyStatusTicks() {
    const combat = gameState.getCombat();
    if (!combat) return;

    const player = gameState.getPlayer();
    const enemy = combat.enemy;

    // --- PLAYER STATUS TICKS ---
    if (combat.playerStatusEffects.poison && combat.playerStatusEffects.poison.duration > 0) {
      const dmg = Math.max(1, Math.floor(player.getMaxHp() * COMBAT.POISON_TICK));
      player.hp = Math.max(1, player.hp - dmg);
      combat.playerStatusEffects.poison.duration -= 1;
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `Sufres ${dmg} de daño por Veneno.`,
        type: 'combat'
      });
    }

    if (combat.playerStatusEffects.burn && combat.playerStatusEffects.burn.duration > 0) {
      const dmg = Math.max(1, Math.floor(player.getMaxHp() * COMBAT.BURN_TICK));
      player.hp = Math.max(1, player.hp - dmg);
      combat.playerStatusEffects.burn.duration -= 1;
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `Sufres ${dmg} de daño por Quemadura.`,
        type: 'combat'
      });
    }

    // --- ENEMY STATUS TICKS ---
    if (combat.enemyStatusEffects.poison && combat.enemyStatusEffects.poison.duration > 0) {
      const dmg = Math.max(1, Math.floor(enemy.stats.maxHp * COMBAT.POISON_TICK));
      enemy.hp = Math.max(0, enemy.hp - dmg);
      combat.enemyStatusEffects.poison.duration -= 1;
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `${enemy.name} sufre ${dmg} de daño por Veneno.`,
        type: 'combat'
      });
    }

    if (combat.enemyStatusEffects.burn && combat.enemyStatusEffects.burn.duration > 0) {
      const dmg = Math.max(1, Math.floor(enemy.stats.maxHp * COMBAT.BURN_TICK));
      enemy.hp = Math.max(0, enemy.hp - dmg);
      combat.enemyStatusEffects.burn.duration -= 1;
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `${enemy.name} sufre ${dmg} de daño por Quemadura.`,
        type: 'combat'
      });
    }

    this._checkDeath();
  }

  /**
   * Check if either fighter has been defeated
   * @private
   * @returns {boolean} if game screen changed due to defeat
   */
  _checkDeath() {
    const combat = gameState.getCombat();
    if (!combat) return false;

    const player = gameState.getPlayer();
    const enemy = combat.enemy;

    // Player wins
    if (enemy.hp <= 0) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `¡Has derrotado a ${enemy.name}!`,
        type: 'reward'
      });

      // Resolve story progress unlocks
      if (enemy.id === 'boss_treant') {
        gameState.unlockRegion('cueva-cristalina');
        gameState.setFlag('unlocked_cueva', true);
      } else if (enemy.id === 'boss_golem') {
        gameState.unlockRegion('montana-tormenta');
        gameState.setFlag('unlocked_montana', true);
      } else if (enemy.id === 'boss_wyvern') {
        gameState.unlockRegion('castillo-oscuro');
        gameState.setFlag('unlocked_castillo', true);
      } else if (enemy.id === 'boss_malachar') {
        // Trigger Victory
        gameState.setCombat(null);
        gameState.setScreen(SCREENS.VICTORY);
        return true;
      }

      // Calculate experience and gold rewards
      const expEarned = enemy.expReward;
      const goldEarned = enemy.rollGold();
      const itemsLooted = enemy.rollLoot();

      eventBus.emit(EVENTS.COMBAT_WIN, {
        enemy,
        expGained: expEarned,
        goldGained: goldEarned,
        loot: itemsLooted
      });

      gameState.setCombat(null);
      return true;
    }

    // Player loses
    if (player.hp <= 0) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: '¡Has caído derrotado en combate!',
        type: 'combat'
      });
      eventBus.emit(EVENTS.COMBAT_LOSE);
      eventBus.emit(EVENTS.PLAYER_DIED);
      gameState.setCombat(null);
      return true;
    }

    return false;
  }
}
