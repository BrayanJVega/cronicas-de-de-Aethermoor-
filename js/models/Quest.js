/**
 * Quest.js — Quest model containing objective tracking state
 */

import { QUEST_DATA } from '../data/quests.js';
import { QUEST_STATUS } from '../utils/constants.js';

export class Quest {
  /**
   * @param {string} questId
   */
  constructor(questId) {
    const data = QUEST_DATA[questId];
    if (!data) {
      throw new Error(`Quest ID ${questId} not found in quests database.`);
    }

    this.id = questId;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type;
    this.prerequisites = [...data.prerequisites];
    this.rewards = { ...data.rewards };

    // Objective tracking
    this.objective = { ...data.objectives };
    this.status = QUEST_STATUS.AVAILABLE;
  }

  /**
   * Increment objective progress
   * @param {number} amount
   * @returns {boolean} if completed
   */
  addProgress(amount = 1) {
    if (this.status !== QUEST_STATUS.ACTIVE) return false;

    this.objective.currentCount = Math.min(
      this.objective.targetCount,
      this.objective.currentCount + amount
    );

    if (this.objective.currentCount >= this.objective.targetCount) {
      this.status = QUEST_STATUS.COMPLETED;
      return true;
    }
    return false;
  }

  /**
   * Check if objectives are fully met
   * @returns {boolean}
   */
  isCompleted() {
    return this.objective.currentCount >= this.objective.targetCount;
  }
}
