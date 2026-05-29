/**
 * npcs.js — NPC database with roles, inventories, quest ids, and dialogues references
 */

import { NPC_ROLE } from '../utils/constants.js';

export const NPC_DATA = Object.freeze({
  // --- VILLAGE AREA NPCs ---
  'npc_elder': {
    id: 'npc_elder',
    name: 'Anciano Oakhaven',
    role: NPC_ROLE.STORY,
    icon: '🧓',
    questIds: ['quest_main_1'],
    dialogueTreeId: 'elder_luminara',
    description: 'El líder sabio de la aldea. Sus ojos reflejan siglos de historia y preocupación.'
  },
  'npc_curandera': {
    id: 'npc_curandera',
    name: 'Curandera Elara',
    role: NPC_ROLE.HEALER,
    icon: '👵',
    dialogueTreeId: 'curandera_elara',
    description: 'Una anciana bondadosa que domina la herboristería y la magia restaurativa menor.',
    healCost: 10 // Gold cost for 100% heal
  },
  'npc_comerciante_rural': {
    id: 'npc_comerciante_rural',
    name: 'Mercader Barnaby',
    role: NPC_ROLE.MERCHANT,
    icon: '🧔',
    dialogueTreeId: 'comerciante_barnaby',
    description: 'Vende suministros básicos a los viajeros que se aventuran fuera de la aldea.',
    shopInventory: [
      'potion_hp_minor',
      'potion_mp_minor',
      'weapon_rusty_sword',
      'weapon_short_bow',
      'weapon_novice_staff',
      'armor_tattered_clothes',
      'shield_wooden',
      'helmet_leather',
      'accessory_copper_ring'
    ]
  },

  // --- FOREST AREA NPCs ---
  'npc_cazador': {
    id: 'npc_cazador',
    name: 'Cazador Silas',
    role: NPC_ROLE.QUEST_GIVER,
    icon: '🧔',
    questIds: ['quest_sec_clear_goblins', 'quest_daily_hunt'],
    dialogueTreeId: 'cazador_silas',
    description: 'Un montaraz solitario que resguarda los linderos del Bosque Sombrío.'
  },

  // --- CAVE AREA NPCs ---
  'npc_herrero': {
    id: 'npc_herrero',
    name: 'Herrero Grundor',
    role: NPC_ROLE.BLACKSMITH,
    icon: '🧔',
    questIds: ['quest_sec_clean_cave'],
    dialogueTreeId: 'herrero_grundor',
    description: 'Un enano robusto que trabaja el metal cristalino en las profundidades de la cueva.',
    shopInventory: [
      'potion_hp_standard',
      'potion_mp_standard',
      'weapon_iron_sword',
      'weapon_composite_bow',
      'weapon_elder_wand',
      'armor_leather_chest',
      'shield_iron',
      'helmet_iron',
      'accessory_ring_of_life'
    ]
  },

  // --- MOUNTAIN AREA NPCs ---
  'npc_ermitano': {
    id: 'npc_ermitano',
    name: 'Sabio Zephyr',
    role: NPC_ROLE.BLACKSMITH, // also acts as a high-tier merchant/blacksmith
    icon: '👴',
    questIds: ['quest_sec_mountain_mages'],
    dialogueTreeId: 'ermitano_zephyr',
    description: 'Un sabio eremita que vive cerca de las tormentas, vendiendo equipamiento rúnico avanzado.',
    shopInventory: [
      'potion_hp_major',
      'potion_mp_standard',
      'potion_elixir',
      'weapon_steel_claymore',
      'weapon_windrunner_bow',
      'weapon_pyromancer_staff',
      'armor_chainmail',
      'armor_paladin_plate',
      'accessory_amulet_of_power'
    ]
  }
});
