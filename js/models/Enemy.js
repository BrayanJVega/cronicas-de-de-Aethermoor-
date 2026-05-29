/**
 * Enemy.js — Enemy entity model instance for combat and loot calculations utilizing Chance.js
 */

import Chance from 'chance';
const chance = new Chance();

import { ENEMY_DATA } from '../data/enemies.js';
import { ITEM_DATA } from '../data/items.js';

export class Enemy {
  /**
   * @param {string} enemyId
   */
  constructor(enemyId) {
    const data = ENEMY_DATA[enemyId];
    if (!data) {
      throw new Error(`Enemy data id: ${enemyId} not found`);
    }

    this.id = enemyId;
    this.name = data.name;
    this.level = data.level;
    this.icon = data.icon;
    this.isBoss = !!data.isBoss;

    // Core stats
    this.stats = { ...data.stats };
    this.hp = this.stats.maxHp;

    // Rewards
    this.expReward = data.expReward;
    this.goldReward = data.goldReward;

    // Skills
    this.skills = data.skills ? [...data.skills] : [];
    this.lootTable = data.lootTable ? [...data.lootTable] : [];
  }

  /**
   * Rolls for loot drop upon defeat based on enemy loot table
   * @returns {Array<Object>} list of items to award to player
   */
  rollLoot() {
    const itemsEarned = [];
    for (const entry of this.lootTable) {
      if (chance.floating({ min: 0, max: 1 }) < entry.chance) {
        const itemInfo = ITEM_DATA[entry.itemId];
        if (itemInfo) {
          itemsEarned.push({ ...itemInfo });
        }
      }
    }
    return itemsEarned;
  }

  /**
   * Roll a random gold drop with standard ±15% variance utilizing Chance.js
   * @returns {number}
   */
  rollGold() {
    const variance = Math.floor(this.goldReward * 0.15);
    return chance.integer({ min: this.goldReward - variance, max: this.goldReward + variance });
  }
}
