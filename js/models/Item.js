/**
 * Item.js — Model representational wrapper for Item objects
 */

import { ITEM_DATA } from '../data/items.js';
import { generateId } from '../utils/helpers.js';

export class Item {
  /**
   * Create an item instance
   * @param {string} itemId
   * @param {number} [quantity=1]
   */
  constructor(itemId, quantity = 1) {
    const data = ITEM_DATA[itemId];
    if (!data) {
      throw new Error(`Item id "${itemId}" does not exist in items database.`);
    }

    this.id = generateId(); // Unique instance ID
    this.itemId = itemId; // Database reference ID
    this.name = data.name;
    this.type = data.type;
    this.slot = data.slot || null;
    this.rarity = data.rarity;
    this.price = data.price;
    this.icon = data.icon;
    this.description = data.description;
    this.stats = data.stats ? { ...data.stats } : null;
    this.effects = data.effects ? { ...data.effects } : null;
    this.questItem = !!data.questItem;
    this.quantity = quantity;
  }
}
