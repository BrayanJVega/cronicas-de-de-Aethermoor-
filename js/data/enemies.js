/**
 * enemies.js — Enemy definitions including basic enemies, mini-bosses, and boss
 */

export const ENEMY_DATA = Object.freeze({
  // --- ALDEA / TUTORIAL AREA ---
  'dummy': {
    id: 'dummy',
    name: 'Espantapájaros de Entrenamiento',
    level: 1,
    icon: '🌾',
    stats: {
      maxHp: 40,
      attack: 2,
      defense: 2,
      magicDefense: 2,
      speed: 1,
      critChance: 0
    },
    expReward: 15,
    goldReward: 5,
    lootTable: [
      { itemId: 'potion_hp_minor', chance: 0.5 },
      { itemId: 'accessory_copper_ring', chance: 0.1 }
    ],
    skills: []
  },

  // --- BOSQUE SOMBRÍO (LEVEL 2-5) ---
  'goblin': {
    id: 'goblin',
    name: 'Goblin Travieso',
    level: 2,
    icon: '👺',
    stats: {
      maxHp: 65,
      attack: 8,
      defense: 4,
      magicDefense: 3,
      speed: 12,
      critChance: 0.05
    },
    expReward: 35,
    goldReward: 15,
    lootTable: [
      { itemId: 'potion_hp_minor', chance: 0.4 },
      { itemId: 'weapon_rusty_sword', chance: 0.08 },
      { itemId: 'helmet_leather', chance: 0.08 }
    ],
    skills: [
      {
        name: 'Puñalada Traicionera',
        damage: 1.3,
        mpCost: 0,
        statusEffect: { type: 'poison', chance: 0.2, duration: 2 }
      }
    ]
  },
  'wolf': {
    id: 'wolf',
    name: 'Lobo Hambriento',
    level: 3,
    icon: '🐺',
    stats: {
      maxHp: 80,
      attack: 12,
      defense: 5,
      magicDefense: 4,
      speed: 14,
      critChance: 0.08
    },
    expReward: 50,
    goldReward: 10,
    lootTable: [
      { itemId: 'potion_hp_minor', chance: 0.3 },
      { itemId: 'armor_tattered_clothes', chance: 0.1 }
    ],
    skills: [
      {
        name: 'Mordisco Feroz',
        damage: 1.4,
        mpCost: 0
      }
    ]
  },
  'boss_treant': {
    id: 'boss_treant',
    name: 'Grootok, el Ancestro Corrupto',
    level: 5,
    icon: '🌳',
    isBoss: true,
    stats: {
      maxHp: 250,
      attack: 18,
      defense: 14,
      magicDefense: 10,
      speed: 6,
      critChance: 0.05
    },
    expReward: 200,
    goldReward: 100,
    lootTable: [
      { itemId: 'crystal_shard_earth', chance: 1.0 }, // Story item guaranteed
      { itemId: 'accessory_ring_of_life', chance: 0.5 },
      { itemId: 'potion_hp_standard', chance: 1.0 }
    ],
    skills: [
      {
        name: 'Raíces Enredaderas',
        damage: 1.2,
        statusEffect: { type: 'stun', chance: 0.4, duration: 1 }
      },
      {
        name: 'Golpe de Rama Pesado',
        damage: 1.6
      }
    ]
  },

  // --- CUEVA CRISTALINA (LEVEL 5-8) ---
  'skeleton': {
    id: 'skeleton',
    name: 'Guerrero Esqueleto',
    level: 5,
    icon: '💀',
    stats: {
      maxHp: 110,
      attack: 16,
      defense: 10,
      magicDefense: 5,
      speed: 9,
      critChance: 0.05
    },
    expReward: 70,
    goldReward: 25,
    lootTable: [
      { itemId: 'potion_mp_minor', chance: 0.3 },
      { itemId: 'weapon_iron_sword', chance: 0.07 },
      { itemId: 'shield_wooden', chance: 0.1 }
    ],
    skills: [
      {
        name: 'Golpe de Hueso',
        damage: 1.3
      }
    ]
  },
  'bandit': {
    id: 'bandit',
    name: 'Bandido de la Cueva',
    level: 6,
    icon: '🥷',
    stats: {
      maxHp: 130,
      attack: 19,
      defense: 8,
      magicDefense: 8,
      speed: 13,
      critChance: 0.1
    },
    expReward: 85,
    goldReward: 40,
    lootTable: [
      { itemId: 'potion_hp_standard', chance: 0.2 },
      { itemId: 'armor_leather_chest', chance: 0.05 },
      { itemId: 'weapon_short_bow', chance: 0.05 }
    ],
    skills: [
      {
        name: 'Golpe Sucio',
        damage: 1.2,
        statusEffect: { type: 'stun', chance: 0.25, duration: 1 }
      }
    ]
  },
  'boss_golem': {
    id: 'boss_golem',
    name: 'Golem de Cristal Rubí',
    level: 8,
    icon: '🤖',
    isBoss: true,
    stats: {
      maxHp: 450,
      attack: 26,
      defense: 25,
      magicDefense: 18,
      speed: 5,
      critChance: 0.02
    },
    expReward: 400,
    goldReward: 200,
    lootTable: [
      { itemId: 'crystal_shard_water', chance: 1.0 }, // Story item
      { itemId: 'weapon_steel_claymore', chance: 0.3 },
      { itemId: 'weapon_windrunner_bow', chance: 0.3 },
      { itemId: 'weapon_pyromancer_staff', chance: 0.3 }
    ],
    skills: [
      {
        name: 'Machacar Cristalino',
        damage: 1.8
      },
      {
        name: 'Explosión Prismática',
        damage: 1.4,
        statusEffect: { type: 'burn', chance: 0.3, duration: 2 }
      }
    ]
  },

  // --- MONTAÑA TORMENTA (LEVEL 8-12) ---
  'dark_mage': {
    id: 'dark_mage',
    name: 'Mago Oscuro Renegado',
    level: 9,
    icon: '🧙',
    stats: {
      maxHp: 160,
      attack: 10,
      defense: 8,
      magicDefense: 22,
      speed: 11,
      critChance: 0.08,
      magicAttack: 25
    },
    expReward: 120,
    goldReward: 60,
    lootTable: [
      { itemId: 'potion_mp_standard', chance: 0.4 },
      { itemId: 'weapon_novice_staff', chance: 0.1 },
      { itemId: 'weapon_elder_wand', chance: 0.05 }
    ],
    skills: [
      {
        name: 'Saeta Oscura',
        damage: 1.5,
        statusEffect: { type: 'burn', chance: 0.2, duration: 2 }
      },
      {
        name: 'Danza del Rayo',
        damage: 1.8
      }
    ]
  },
  'harpy': {
    id: 'harpy',
    name: 'Harpía Vendaval',
    level: 10,
    icon: '🦅',
    stats: {
      maxHp: 180,
      attack: 26,
      defense: 12,
      magicDefense: 12,
      speed: 18,
      critChance: 0.12
    },
    expReward: 150,
    goldReward: 50,
    lootTable: [
      { itemId: 'potion_hp_standard', chance: 0.3 },
      { itemId: 'helmet_iron', chance: 0.08 },
      { itemId: 'shield_iron', chance: 0.08 }
    ],
    skills: [
      {
        name: 'Garra del Ciclón',
        damage: 1.4,
        statusEffect: { type: 'freeze', chance: 0.2, duration: 1 }
      }
    ]
  },
  'boss_wyvern': {
    id: 'boss_wyvern',
    name: 'Aurelius, Wyvern de la Tormenta',
    level: 12,
    icon: '🐉',
    isBoss: true,
    stats: {
      maxHp: 750,
      attack: 38,
      defense: 24,
      magicDefense: 24,
      speed: 16,
      critChance: 0.1
    },
    expReward: 800,
    goldReward: 400,
    lootTable: [
      { itemId: 'crystal_shard_wind', chance: 1.0 }, // Story item
      { itemId: 'armor_paladin_plate', chance: 0.4 },
      { itemId: 'accessory_amulet_of_power', chance: 0.4 }
    ],
    skills: [
      {
        name: 'Aliento Eléctrico',
        damage: 1.5,
        statusEffect: { type: 'stun', chance: 0.3, duration: 1 }
      },
      {
        name: 'Picado Sónico',
        damage: 2.0
      }
    ]
  },

  // --- CASTILLO OSCURO (LEVEL 12+) ---
  'dark_knight': {
    id: 'dark_knight',
    name: 'Caballero del Vacío',
    level: 13,
    icon: '🛡️',
    stats: {
      maxHp: 250,
      attack: 38,
      defense: 30,
      magicDefense: 20,
      speed: 12,
      critChance: 0.08
    },
    expReward: 250,
    goldReward: 100,
    lootTable: [
      { itemId: 'potion_hp_major', chance: 0.4 },
      { itemId: 'potion_mp_standard', chance: 0.4 },
      { itemId: 'armor_chainmail', chance: 0.1 }
    ],
    skills: [
      {
        name: 'Corte del Segador',
        damage: 1.5,
        statusEffect: { type: 'poison', chance: 0.3, duration: 3 }
      }
    ]
  },
  'shadow_beast': {
    id: 'shadow_beast',
    name: 'Bestia del Abismo',
    level: 14,
    icon: '👺',
    stats: {
      maxHp: 280,
      attack: 46,
      defense: 18,
      magicDefense: 18,
      speed: 15,
      critChance: 0.15
    },
    expReward: 300,
    goldReward: 80,
    lootTable: [
      { itemId: 'potion_hp_major', chance: 0.5 },
      { itemId: 'potion_elixir', chance: 0.05 }
    ],
    skills: [
      {
        name: 'Garra de Pánico',
        damage: 1.4,
        statusEffect: { type: 'stun', chance: 0.3, duration: 1 }
      }
    ]
  },
  'boss_malachar': {
    id: 'boss_malachar',
    name: 'Hechicero Supremo Malachar',
    level: 15,
    icon: '👑',
    isBoss: true,
    stats: {
      maxHp: 1800,
      attack: 62,
      defense: 38,
      magicDefense: 45,
      speed: 18,
      critChance: 0.12,
      magicAttack: 70
    },
    expReward: 2500,
    goldReward: 1000,
    lootTable: [
      { itemId: 'crystal_shard_fire', chance: 1.0 }, // Story item
      { itemId: 'armor_aegis_suit', chance: 0.3 },
      { itemId: 'accessory_chronos_hourglass', chance: 0.3 }
    ],
    skills: [
      {
        name: 'Maldición del Fin',
        damage: 1.8,
        statusEffect: { type: 'poison', chance: 0.5, duration: 4 }
      },
      {
        name: 'Llamarada Apocalíptica',
        damage: 2.2,
        statusEffect: { type: 'burn', chance: 0.4, duration: 3 }
      },
      {
        name: 'Cero Absoluto',
        damage: 1.6,
        statusEffect: { type: 'freeze', chance: 0.35, duration: 1 }
      }
    ]
  }
});
