/**
 * QuestService.js — Tracks and handles all quest states, rewards, and objectives
 */

import { QUEST_STATUS, EVENTS, QUEST_TYPE } from '../utils/constants.js';
import { QUEST_DATA } from '../data/quests.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { ITEM_DATA } from '../data/items.js';

export class QuestService {
  /**
   * Initialize quests list into state
   */
  initializeQuests() {
    // Rehydrate quests map state
    const tracking = {};
    for (const key in QUEST_DATA) {
      tracking[key] = {
        id: key,
        status: QUEST_STATUS.AVAILABLE,
        currentCount: 0
      };
    }
    gameState.set('questsTracking', tracking);
  }

  /**
   * Accept a quest for tracking
   * @param {string} questId
   */
  acceptQuest(questId) {
    const tracking = gameState.get('questsTracking');
    if (!tracking || !tracking[questId]) return;

    if (tracking[questId].status === QUEST_STATUS.AVAILABLE) {
      tracking[questId].status = QUEST_STATUS.ACTIVE;
      gameState.addActiveQuest(questId);

      eventBus.emit(EVENTS.QUEST_ACCEPTED, { questId });
      eventBus.emit(EVENTS.LOG_MESSAGE, {
        text: `Misión Aceptada: "${QUEST_DATA[questId].title}"`,
        type: 'quest'
      });
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: '📜 Misión Aceptada',
        type: 'info'
      });

      // Unlock the second region (Bosque Sombrío) to allow travel
      if (questId === 'quest_main_1') {
        gameState.unlockRegion('bosque-sombrio');
      }
    }
  }

  /**
   * Check if a quest is unlocked based on prerequisites
   * @param {string} questId
   * @returns {boolean}
   */
  isQuestUnlocked(questId) {
    const data = QUEST_DATA[questId];
    if (!data) return false;

    const tracking = gameState.get('questsTracking');
    if (!tracking) return false;

    // Check prerequisites are turned in / completed
    for (const reqId of data.prerequisites) {
      if (tracking[reqId].status !== QUEST_STATUS.TURNED_IN) {
        return false;
      }
    }
    return true;
  }

  /**
   * Feed enemy defeat into active quests objectives
   * @param {Object} enemyDefeated
   */
  checkCombatProgress(enemyDefeated) {
    const tracking = gameState.get('questsTracking');
    if (!tracking) return;

    const activeIds = gameState.get('activeQuests') || [];
    for (const questId of activeIds) {
      const qData = QUEST_DATA[questId];
      const stateObj = tracking[questId];

      if (qData.objectives.targetId === enemyDefeated.id) {
        stateObj.currentCount = Math.min(
          qData.objectives.targetCount,
          stateObj.currentCount + 1
        );

        eventBus.emit(EVENTS.QUEST_PROGRESS, { questId, current: stateObj.currentCount });

        // Check if objective complete
        if (stateObj.currentCount >= qData.objectives.targetCount) {
          stateObj.status = QUEST_STATUS.COMPLETED;
          gameState.completeQuest(questId);
          eventBus.emit(EVENTS.QUEST_COMPLETED, { questId });
          eventBus.emit(EVENTS.LOG_MESSAGE, {
            text: `¡Misión Lista para entregar: "${qData.title}"!`,
            type: 'quest'
          });
          eventBus.emit(EVENTS.TOAST_SHOW, {
            message: '📜 Misión Completada',
            type: 'gold'
          });
        }
      }
    }
  }

  /**
   * Claim reward for completed quest, changing state to turned in
   * @param {string} questId
   */
  turnInQuest(questId) {
    const tracking = gameState.get('questsTracking');
    if (!tracking || !tracking[questId]) return;

    const stateObj = tracking[questId];
    if (stateObj.status !== QUEST_STATUS.COMPLETED) return;

    const qData = QUEST_DATA[questId];
    const player = gameState.getPlayer();

    // Award Rewards
    player.exp += qData.rewards.exp;
    player.gold += qData.rewards.gold;

    stateObj.status = QUEST_STATUS.TURNED_IN;
    gameState.completeQuest(questId); // ensures removed from active

    // Award rewards item objects
    if (qData.rewards.items && qData.rewards.items.length > 0) {
      // Rehydrate item
      for (const entry of qData.rewards.items) {
        const itemInfo = ITEM_DATA[entry.itemId];
        if (itemInfo) {
          player.inventory.push({
            ...itemInfo,
            id: Math.random().toString(36).substring(2, 9),
            quantity: entry.count
          });
        }
      }
    }

    eventBus.emit(EVENTS.LOG_MESSAGE, {
      text: `Misión Entregada: "${qData.title}". +${qData.rewards.exp} EXP, +${qData.rewards.gold} Oro`,
      type: 'reward'
    });

    // Check level up after rewards
    // (bound via globally listened level check helper)
    eventBus.emit(EVENTS.TOAST_SHOW, {
      message: '🎁 Recompensas de misión reclamadas',
      type: 'success'
    });
  }
}
