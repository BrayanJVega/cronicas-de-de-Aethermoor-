/**
 * NPC.js — NPC instance wrapping dialogue tree and shop information
 */

import { NPC_DATA } from '../data/npcs.js';

export class NPC {
  /**
   * @param {string} npcId
   */
  constructor(npcId) {
    const data = NPC_DATA[npcId];
    if (!data) {
      throw new Error(`NPC id "${npcId}" does not exist.`);
    }

    this.id = npcId;
    this.name = data.name;
    this.role = data.role;
    this.icon = data.icon;
    this.dialogueTreeId = data.dialogueTreeId;
    this.description = data.description;
    this.healCost = data.healCost || 0;
    this.questIds = data.questIds ? [...data.questIds] : [];
    this.shopInventory = data.shopInventory ? [...data.shopInventory] : [];
  }
}
