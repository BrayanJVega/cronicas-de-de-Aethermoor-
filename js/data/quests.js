/**
 * quests.js — Quest definitions
 * Includes main story quests, secondary quests, and daily tasks
 */

import { QUEST_TYPE } from '../utils/constants.js';

export const QUEST_DATA = Object.freeze({
  // --- MAIN STORY LINE ---
  'quest_main_1': {
    id: 'quest_main_1',
    title: 'El Árbol de la Vida Sombrío',
    description: 'El Anciano de Luminara teme que la corrupción del Bosque Sombrío esté afectando al Árbol de la Tierra. Derrota a Grootok y recupera el primer Fragmento del Cristal.',
    type: QUEST_TYPE.MAIN,
    prerequisites: [],
    objectives: {
      type: 'kill_boss',
      targetId: 'boss_treant',
      targetCount: 1,
      currentCount: 0
    },
    rewards: {
      exp: 150,
      gold: 100,
      items: [{ itemId: 'potion_hp_standard', count: 2 }]
    }
  },
  'quest_main_2': {
    id: 'quest_main_2',
    title: 'El Brillo Devorado',
    description: 'El agua del valle está contaminada. Debes adentrarte en la Cueva Cristalina, limpiar la zona de esbirros y recuperar el Fragmento de Agua que custodia el Golem de Cristal Rubí.',
    type: QUEST_TYPE.MAIN,
    prerequisites: ['quest_main_1'],
    objectives: {
      type: 'kill_boss',
      targetId: 'boss_golem',
      targetCount: 1,
      currentCount: 0
    },
    rewards: {
      exp: 350,
      gold: 250,
      items: [{ itemId: 'potion_mp_standard', count: 2 }, { itemId: 'accessory_ring_of_life', count: 1 }]
    }
  },
  'quest_main_3': {
    id: 'quest_main_3',
    title: 'El Azote de la Tormenta',
    description: 'Aurelius, un majestuoso Wyvern, ha sido corrompido por Malachar y bloquea el paso montañoso con tempestades eternas. Derrótalo en la Montaña Tormenta.',
    type: QUEST_TYPE.MAIN,
    prerequisites: ['quest_main_2'],
    objectives: {
      type: 'kill_boss',
      targetId: 'boss_wyvern',
      targetCount: 1,
      currentCount: 0
    },
    rewards: {
      exp: 700,
      gold: 500,
      items: [{ itemId: 'potion_hp_major', count: 2 }, { itemId: 'helmet_griffin_crown', count: 1 }]
    }
  },
  'quest_main_4': {
    id: 'quest_main_4',
    title: 'El Fin de la Oscuridad',
    description: 'El Castillo Oscuro te espera. Reúne todo tu coraje, penetra la fortaleza de Malachar y derrótalo de una vez por todas para salvar el reino de Aethermoor.',
    type: QUEST_TYPE.MAIN,
    prerequisites: ['quest_main_3'],
    objectives: {
      type: 'kill_boss',
      targetId: 'boss_malachar',
      targetCount: 1,
      currentCount: 0
    },
    rewards: {
      exp: 2000,
      gold: 1500,
      items: [{ itemId: 'potion_elixir', count: 3 }]
    }
  },

  // --- SECONDARY QUESTS ---
  'quest_sec_clear_goblins': {
    id: 'quest_sec_clear_goblins',
    title: 'Amenaza Goblin',
    description: 'El cazador del Bosque Sombrío está cansado de que los goblins le roben sus trampas. Elimina a 3 Goblins del bosque.',
    type: QUEST_TYPE.SECONDARY,
    prerequisites: [],
    objectives: {
      type: 'kill',
      targetId: 'goblin',
      targetCount: 3,
      currentCount: 0
    },
    rewards: {
      exp: 80,
      gold: 50,
      items: [{ itemId: 'weapon_short_bow', count: 1 }]
    }
  },
  'quest_sec_clean_cave': {
    id: 'quest_sec_clean_cave',
    title: 'Huesos Polvorientos',
    description: 'El Herrero de la Cueva Cristalina no puede forjar debido a los ruidos de los esqueletos que habitan los túneles inferiores. Acaba con 4 Esqueletos.',
    type: QUEST_TYPE.SECONDARY,
    prerequisites: ['quest_main_1'],
    objectives: {
      type: 'kill',
      targetId: 'skeleton',
      targetCount: 4,
      currentCount: 0
    },
    rewards: {
      exp: 180,
      gold: 120,
      items: [{ itemId: 'shield_iron', count: 1 }]
    }
  },
  'quest_sec_mountain_mages': {
    id: 'quest_sec_mountain_mages',
    title: 'Magia Corruptora',
    description: 'El Ermitaño de la Montaña Tormenta te pide que debilites el círculo de mages oscuros que invoca rayos en el templo. Elimina a 3 Magos Oscuros.',
    type: QUEST_TYPE.SECONDARY,
    prerequisites: ['quest_main_2'],
    objectives: {
      type: 'kill',
      targetId: 'dark_mage',
      targetCount: 3,
      currentCount: 0
    },
    rewards: {
      exp: 300,
      gold: 200,
      items: [{ itemId: 'accessory_amulet_of_power', count: 1 }]
    }
  },

  // --- REPEATABLE DAILY QUESTS ---
  'quest_daily_hunt': {
    id: 'quest_daily_hunt',
    title: 'Control de Plagas Salvaje (Diaria)',
    description: 'Mantén la ruta mercantil de la aldea segura cazando criaturas locales. Elimina a 2 Lobos hambrientos.',
    type: QUEST_TYPE.DAILY,
    prerequisites: [],
    objectives: {
      type: 'kill',
      targetId: 'wolf',
      targetCount: 2,
      currentCount: 0
    },
    rewards: {
      exp: 60,
      gold: 40,
      items: [{ itemId: 'potion_hp_minor', count: 1 }]
    }
  }
});
