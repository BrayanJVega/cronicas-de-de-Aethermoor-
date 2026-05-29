/**
 * InventoryService.js — Handles inventory operations, item consumption, equipment, and level progression calculations
 */

import { ITEM_TYPE, EQUIP_SLOTS, expForLevel, MAX_LEVEL, EVENTS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import logger from '../utils/logger.js';

export class InventoryService {
  /**
   * Add item to player inventory
   * @param {Object} itemData
   * @param {number} [count=1]
   * @returns {boolean} successful
   */
  addItem(itemData, count = 1) {
    const player = gameState.getPlayer();
    if (!player) return false;

    // Check if slot capacity exceeded
    if (player.inventory.length >= player.maxInventorySlots) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡Inventario lleno!',
        type: 'error'
      });
      return false;
    }

    // Try stackable potions / materials
    if (itemData.type === ITEM_TYPE.POTION || itemData.type === ITEM_TYPE.MATERIAL) {
      const existing = player.inventory.find(i => i.itemId === itemData.itemId);
      if (existing) {
        existing.quantity += count;
        eventBus.emit(EVENTS.ITEM_ACQUIRED, { item: existing, count });
        return true;
      }
    }

    // Otherwise create new entry instance
    const newEntry = {
      ...itemData,
      id: Math.random().toString(36).substring(2, 9),
      quantity: count
    };

    player.inventory.push(newEntry);
    eventBus.emit(EVENTS.ITEM_ACQUIRED, { item: newEntry, count });
    return true;
  }

  /**
   * Remove item from player inventory by instance ID
   * @param {string} itemInstanceId
   * @param {number} [count=1]
   * @returns {boolean} successful
   */
  removeItem(itemInstanceId, count = 1) {
    const player = gameState.getPlayer();
    if (!player) return false;

    const index = player.inventory.findIndex(i => i.id === itemInstanceId);
    if (index === -1) return false;

    const item = player.inventory[index];
    item.quantity -= count;

    if (item.quantity <= 0) {
      player.inventory.splice(index, 1);
    }
    return true;
  }

  /**
   * Consume a potion from player inventory
   * @param {string} itemInstanceId
   * @returns {boolean}
   */
  usePotion(itemInstanceId) {
    const player = gameState.getPlayer();
    if (!player) return false;

    const itemIndex = player.inventory.findIndex(i => i.id === itemInstanceId);
    if (itemIndex === -1) return false;

    const item = player.inventory[itemIndex];
    if (item.type !== ITEM_TYPE.POTION) {
      logger.warn('Item is not consumable');
      return false;
    }

    // Apply effects
    let messageParts = [];
    if (item.effects.healHp) {
      const prevHp = player.hp;
      player.hp = Math.min(player.hp + item.effects.healHp, player.stats.maxHp);
      messageParts.push(`+${player.hp - prevHp} PV`);
    }
    if (item.effects.healMp) {
      const prevMp = player.mp;
      player.mp = Math.min(player.mp + item.effects.healMp, player.stats.maxMp);
      messageParts.push(`+${player.mp - prevMp} PM`);
    }
    if (item.effects.healHpPercent) {
      player.hp = player.stats.maxHp;
      messageParts.push('¡Vida Restaurada!');
    }
    if (item.effects.healMpPercent) {
      player.mp = player.stats.maxMp;
      messageParts.push('¡Maná Restaurado!');
    }

    // Consume item
    this.removeItem(itemInstanceId, 1);

    const logMsg = `Usaste ${item.name}. ${messageParts.join(', ')}`;
    eventBus.emit(EVENTS.LOG_MESSAGE, { text: logMsg, type: 'system' });
    eventBus.emit(EVENTS.ITEM_USED, { item });

    return true;
  }

  /**
   * Equip an armor, shield, helmet or accessory
   * @param {string} itemInstanceId
   * @returns {boolean}
   */
  equipItem(itemInstanceId) {
    const player = gameState.getPlayer();
    if (!player) return false;

    const index = player.inventory.findIndex(i => i.id === itemInstanceId);
    if (index === -1) return false;

    const item = player.inventory[index];
    const targetSlot = item.slot;

    if (!targetSlot) {
      logger.warn('Item has no target equipment slot');
      return false;
    }

    // Unequip current item in that slot if exists
    const currentlyEquipped = player.equipment[targetSlot];
    if (currentlyEquipped) {
      player.inventory.push(currentlyEquipped);
    }

    // Move item to equipped slot
    player.equipment[targetSlot] = item;
    player.inventory.splice(index, 1);

    eventBus.emit(EVENTS.ITEM_EQUIPPED, { slot: targetSlot, item });
    eventBus.emit(EVENTS.LOG_MESSAGE, { text: `Equipaste ${item.name} en ${targetSlot}`, type: 'system' });
    return true;
  }

  /**
   * Unequip an item from slot, moving back to inventory
   * @param {string} slot
   * @returns {boolean}
   */
  unequipItem(slot) {
    const player = gameState.getPlayer();
    if (!player) return false;

    const item = player.equipment[slot];
    if (!item) return false;

    // Check if slot capacity exceeded
    if (player.inventory.length >= player.maxInventorySlots) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡Inventario lleno, desequipar fallido!',
        type: 'error'
      });
      return false;
    }

    player.equipment[slot] = null;
    player.inventory.push(item);

    eventBus.emit(EVENTS.LOG_MESSAGE, { text: `Desequipaste ${item.name}`, type: 'system' });
    return true;
  }

  /**
   * Perform validation and level up progression
   * @param {Object} player
   */
  checkLevelUp(player) {
    if (player.level >= MAX_LEVEL) return;

    let required = expForLevel(player.level);
    let didLevelUp = false;

    // Support multiple level-ups at once
    while (player.exp >= required && player.level < MAX_LEVEL) {
      player.exp -= required;
      player.level += 1;
      didLevelUp = true;

      // Apply level-up stats boost depending on player class selection
      const bonuses = player.classType === 'warrior'
        ? { maxHp: 15, maxMp: 3, attack: 3, defense: 2, magicAttack: 1, magicDefense: 1, speed: 1, critChance: 0.005, dodgeChance: 0.003 }
        : player.classType === 'archer'
        ? { maxHp: 8, maxMp: 5, attack: 2, defense: 1, magicAttack: 1, magicDefense: 1, speed: 2, critChance: 0.01, dodgeChance: 0.008 }
        : { maxHp: 6, maxMp: 8, attack: 1, defense: 1, magicAttack: 4, magicDefense: 2, speed: 1, critChance: 0.007, dodgeChance: 0.005 };

      for (const stat in bonuses) {
        player.stats[stat] += bonuses[stat];
      }

      // Restore health/mana to full on level up
      player.hp = player.stats.maxHp;
      player.mp = player.stats.maxMp;

      required = expForLevel(player.level);
    }

    if (didLevelUp) {
      eventBus.emit(EVENTS.PLAYER_LEVEL_UP, { newLevel: player.level });
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `¡Felicidades! Subiste al nivel ${player.level}. Atributos incrementados de clase.`,
        type: 'reward'
      });
    }
  }
}
