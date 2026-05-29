/**
 * ShopService.js — Handles merchant actions like buying items, selling loot, and checking gold balances
 */

import { ITEM_DATA } from '../data/items.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../utils/constants.js';

export class ShopService {
  /**
   * Purchase an item from a merchant NPC
   * @param {string} itemId — database id
   * @returns {boolean} successful
   */
  buyItem(itemId) {
    const player = gameState.getPlayer();
    if (!player) return false;

    const itemInfo = ITEM_DATA[itemId];
    if (!itemInfo) return false;

    const price = itemInfo.price;

    // Validate gold balance
    if (player.gold < price) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡Oro insuficiente!',
        type: 'error'
      });
      return false;
    }

    // Validate inventory capacity
    if (player.inventory.length >= player.maxInventorySlots) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡Inventario lleno!',
        type: 'error'
      });
      return false;
    }

    // Process Transaction
    player.gold -= price;

    // Add new instance of item
    const newItem = {
      ...itemInfo,
      id: Math.random().toString(36).substring(2, 9),
      quantity: 1
    };
    player.inventory.push(newItem);

    eventBus.emit(EVENTS.ITEM_BOUGHT, { item: newItem, price });
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Compraste ${itemInfo.name} por ${price} de oro.`,
      type: 'system'
    });
    eventBus.emit(EVENTS.TOAST_SHOW, {
      message: '💰 Objeto comprado',
      type: 'success'
    });
    return true;
  }

  /**
   * Sell an item back to merchants (at 50% price rate)
   * @param {string} itemInstanceId
   * @returns {boolean} successful
   */
  sellItem(itemInstanceId) {
    const player = gameState.getPlayer();
    if (!player) return false;

    const itemIndex = player.inventory.findIndex(i => i.id === itemInstanceId);
    if (itemIndex === -1) return false;

    const item = player.inventory[itemIndex];
    if (item.questItem) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '¡No puedes vender objetos de misión!',
        type: 'error'
      });
      return false;
    }

    const priceRecieved = Math.max(1, Math.floor(item.price * 0.5));

    // Process transaction
    player.gold += priceRecieved;

    // Handle quantity decrement
    item.quantity -= 1;
    if (item.quantity <= 0) {
      player.inventory.splice(itemIndex, 1);
    }

    eventBus.emit(EVENTS.ITEM_SOLD, { item, price: priceRecieved });
    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Vendiste ${item.name} por ${priceRecieved} de oro.`,
      type: 'system'
    });
    eventBus.emit(EVENTS.TOAST_SHOW, {
      message: '💰 Objeto vendido',
      type: 'success'
    });
    return true;
  }
}
