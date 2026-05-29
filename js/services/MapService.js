/**
 * MapService.js — Coordinates travels, region unlocks, and random exploration events utilizing Chance.js
 */

import Chance from 'chance';
const chance = new Chance();

import { MAP_DATA } from '../data/maps.js';
import { REGIONS, EVENTS, SCREENS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { ITEM_DATA } from '../data/items.js';

export class MapService {
  /**
   * Move player to adjacent region
   * @param {string} regionId
   * @returns {boolean} successful
   */
  travelTo(regionId) {
    const data = MAP_DATA[regionId];
    if (!data) return false;

    // Check unlocking constraints
    if (!gameState.isRegionUnlocked(regionId)) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡Esta región está bloqueada!',
        type: 'error'
      });
      return false;
    }

    gameState.setRegion(regionId);
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Has entrado a ${data.name}. ${data.description}`,
      type: 'system'
    });
    return true;
  }

  /**
   * Trigger an explore action in the current region using Chance.js procedural checks
   */
  explore() {
    const regionId = gameState.get('currentRegion');
    const data = MAP_DATA[regionId];
    if (!data) return;

    // 1. Roll for random special event using chance
    if (data.exploreEvents && data.exploreEvents.length > 0 && chance.bool({ likelihood: 45 })) {
      const event = chance.pickone(data.exploreEvents);
      this._resolveEvent(event);
      return;
    }

    // 2. Roll for combat engagement (45% chance)
    if (chance.bool({ likelihood: 45 })) {
      const enemyPool = data.enemies || [];
      if (enemyPool.length > 0) {
        const picked = chance.pickone(enemyPool);
        eventBus.emit(EVENTS.COMBAT_START, { enemyId: picked });
        return;
      }
    }

    // 3. Simple empty search fallback
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: 'Exploras la zona pero no encuentras nada relevante.',
      type: 'system'
    });
  }

  /**
   * Resolve a custom map exploration event
   * @private
   * @param {Object} event
   */
  _resolveEvent(event) {
    const player = gameState.getPlayer();
    if (!player) return;

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `${event.name}: ${event.description}`,
      type: 'quest'
    });

    const effect = event.effect;

    // Gold reward
    if (effect.gold) {
      player.gold += effect.gold;
    }

    // Direct HP heal
    if (effect.healPercent) {
      const amount = Math.floor(player.stats.maxHp * effect.healPercent);
      player.hp = Math.min(player.hp + amount, player.stats.maxHp);
    }

    // Full heal restore
    if (effect.fullRestore) {
      player.hp = player.stats.maxHp;
      player.mp = player.stats.maxMp;
    }

    // Direct damage penalty
    if (effect.damagePercent) {
      const penalty = Math.floor(player.stats.maxHp * effect.damagePercent);
      player.hp = Math.max(1, player.hp - penalty);
    }

    if (effect.damage) {
      player.hp = Math.max(1, player.hp - effect.damage);
    }

    // Award items
    if (effect.giveItems && effect.giveItems.length > 0) {
      for (const entry of effect.giveItems) {
        const itemInfo = ITEM_DATA[entry.itemId];
        if (itemInfo) {
          player.inventory.push({
            ...itemInfo,
            id: chance.string({ length: 7, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' }),
            quantity: entry.count
          });
        }
      }
    }

    // Force automatic combat engagement
    if (effect.forceCombat) {
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: effect.message,
        type: 'combat'
      });
      // Delay combat slightly for user to read dialogue
      setTimeout(() => {
        eventBus.emit(EVENTS.COMBAT_START, { enemyId: effect.forceCombat });
      }, 1000);
      return;
    }

    // Toast and logger display
    eventBus.emit(EVENTS.TOAST_SHOW, {
      message: event.name,
      type: 'info'
    });
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: effect.message,
      type: 'reward'
    });
  }

  /**
   * Unlock boss combat screen for current region
   */
  challengeBoss() {
    const regionId = gameState.get('currentRegion');
    const data = MAP_DATA[regionId];
    if (!data || !data.bossId) return;

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `¡Te enfrentas al Jefe de la región: ${data.name}!`,
      type: 'combat'
    });
    eventBus.emit(EVENTS.COMBAT_START, { enemyId: data.bossId });
  }
}
