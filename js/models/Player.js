/**
 * Player.js — Player data model defining attributes, active equipment, inventory, and progression
 */

import { CLASS_DATA } from '../data/classes.js';
import { EQUIP_SLOTS } from '../utils/constants.js';

export class Player {
  /**
   * @param {string} name
   * @param {string} classType
   */
  constructor(name, classType) {
    const classInfo = CLASS_DATA[classType];
    if (!classInfo) {
      throw new Error(`Invalid class type: ${classType}`);
    }

    this.name = name;
    this.classType = classType;
    this.level = 1;
    this.exp = 0;
    this.gold = 100; // Starting Gold

    // Base core statistics from chosen class
    this.stats = { ...classInfo.baseStats };

    // Current attributes (restorable / consumable)
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;

    // Equipped slots
    this.equipment = {
      [EQUIP_SLOTS.WEAPON]: null,
      [EQUIP_SLOTS.ARMOR]: null,
      [EQUIP_SLOTS.HELMET]: null,
      [EQUIP_SLOTS.SHIELD]: null,
      [EQUIP_SLOTS.ACCESSORY]: null,
    };

    // Inventory Array of Item instances or raw data
    this.inventory = [];
    this.maxInventorySlots = 20;
  }

  /**
   * Return total attack combined with equipment bonuses
   * @returns {number}
   */
  getAttack() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.attack) {
        bonus += item.stats.attack;
      }
    }
    return this.stats.attack + bonus;
  }

  /**
   * Return total magic attack combined with equipment bonuses
   * @returns {number}
   */
  getMagicAttack() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.magicAttack) {
        bonus += item.stats.magicAttack;
      }
    }
    return this.stats.magicAttack + bonus;
  }

  /**
   * Return total defense combined with equipment bonuses
   * @returns {number}
   */
  getDefense() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.defense) {
        bonus += item.stats.defense;
      }
    }
    const def = this.stats.defense + bonus;
    // Apply defense boost multiplier if equipped items grant it (e.g. aegis plate)
    let multiplier = 1;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.defenseBoost) {
        multiplier *= item.stats.defenseBoost;
      }
    }
    return Math.floor(def * multiplier);
  }

  /**
   * Return total magic defense combined with equipment
   * @returns {number}
   */
  getMagicDefense() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.magicDefense) {
        bonus += item.stats.magicDefense;
      }
    }
    return this.stats.magicDefense + bonus;
  }

  /**
   * Return maximum HP combining level bonuses and accessories
   * @returns {number}
   */
  getMaxHp() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.maxHp) {
        bonus += item.stats.maxHp;
      }
    }
    return this.stats.maxHp + bonus;
  }

  /**
   * Return maximum MP combining level bonuses and accessories
   * @returns {number}
   */
  getMaxMp() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.maxMp) {
        bonus += item.stats.maxMp;
      }
    }
    return this.stats.maxMp + bonus;
  }

  /**
   * Return total Speed combined with equipment bonuses
   * @returns {number}
   */
  getSpeed() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.speed) {
        bonus += item.stats.speed;
      }
    }
    return Math.max(1, this.stats.speed + bonus);
  }

  /**
   * Return crit chance combined with equipment bonuses
   * @returns {number}
   */
  getCritChance() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.critChance) {
        bonus += item.stats.critChance;
      }
    }
    return this.stats.critChance + bonus;
  }

  /**
   * Return dodge chance combined with equipment bonuses
   * @returns {number}
   */
  getDodgeChance() {
    let bonus = 0;
    for (const key in this.equipment) {
      const item = this.equipment[key];
      if (item && item.stats && item.stats.dodgeChance) {
        bonus += item.stats.dodgeChance;
      }
    }
    return this.stats.dodgeChance + bonus;
  }

  /**
   * Get all unlocked skills based on current level
   * @returns {Array<Object>}
   */
  getUnlockedSkills() {
    const classInfo = CLASS_DATA[this.classType];
    return classInfo.skills.filter(skill => this.level >= skill.unlockLevel);
  }

  /**
   * Apply full healing to Player
   */
  fullHeal() {
    this.hp = this.getMaxHp();
    this.mp = this.getMaxMp();
  }
}
