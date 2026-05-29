/**
 * items.js — Item database containing weapons, armor, accessories, and consumables
 * Rarity: common, rare, epic, legendary
 */

import { ITEM_TYPE, RARITY, EQUIP_SLOTS } from '../utils/constants.js';

export const ITEM_DATA = Object.freeze({
  // --- CONSUMABLES (POTIONS) ---
  'potion_hp_minor': {
    id: 'potion_hp_minor',
    name: 'Poción Menor de Vida',
    type: ITEM_TYPE.POTION,
    rarity: RARITY.COMMON,
    price: 15,
    icon: '🧪',
    description: 'Restaura 30 Puntos de Vida de inmediato.',
    effects: { healHp: 30 }
  },
  'potion_hp_standard': {
    id: 'potion_hp_standard',
    name: 'Poción de Vida',
    type: ITEM_TYPE.POTION,
    rarity: RARITY.RARE,
    price: 40,
    icon: '🍷',
    description: 'Restaura 80 Puntos de Vida de inmediato.',
    effects: { healHp: 80 }
  },
  'potion_hp_major': {
    id: 'potion_hp_major',
    name: 'Poción Mayor de Vida',
    type: ITEM_TYPE.POTION,
    rarity: RARITY.EPIC,
    price: 100,
    icon: '🏺',
    description: 'Restaura 200 Puntos de Vida de inmediato.',
    effects: { healHp: 200 }
  },
  'potion_mp_minor': {
    id: 'potion_mp_minor',
    name: 'Poción Menor de Maná',
    type: ITEM_TYPE.POTION,
    rarity: RARITY.COMMON,
    price: 20,
    icon: '🧪',
    description: 'Restaura 15 Puntos de Maná de inmediato.',
    effects: { healMp: 15 }
  },
  'potion_mp_standard': {
    id: 'potion_mp_standard',
    name: 'Poción de Maná',
    type: ITEM_TYPE.POTION,
    rarity: RARITY.RARE,
    price: 50,
    icon: '🔮',
    description: 'Restaura 40 Puntos de Maná de inmediato.',
    effects: { healMp: 40 }
  },
  'potion_elixir': {
    id: 'potion_elixir',
    name: 'Elixir de los Ancestros',
    type: ITEM_TYPE.POTION,
    rarity: RARITY.LEGENDARY,
    price: 300,
    icon: '🧪',
    description: 'Restaura completamente los Puntos de Vida y Maná, además de curar todos los estados alterados.',
    effects: { healHpPercent: 1.0, healMpPercent: 1.0, cureStatus: true }
  },

  // --- WEAPONS (WARRIOR / PHYSICAL) ---
  'weapon_rusty_sword': {
    id: 'weapon_rusty_sword',
    name: 'Espada Oxidada',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.COMMON,
    price: 25,
    icon: '🗡️',
    description: 'Una espada vieja con muescas en el filo. Apenas mejor que luchar con las manos vacías.',
    stats: { attack: 4 }
  },
  'weapon_iron_sword': {
    id: 'weapon_iron_sword',
    name: 'Espada de Hierro',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.COMMON,
    price: 80,
    icon: '⚔️',
    description: 'Una sólida espada forjada en hierro. Fiable y bien balanceada.',
    stats: { attack: 10 }
  },
  'weapon_steel_claymore': {
    id: 'weapon_steel_claymore',
    name: 'Mandoble de Acero',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.RARE,
    price: 220,
    icon: '🗡️',
    description: 'Un espadón pesado tallado con runas simples. Aumenta significativamente el daño físico.',
    stats: { attack: 22 }
  },
  'weapon_dragon_slayer': {
    id: 'weapon_dragon_slayer',
    name: 'Matadragones',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.EPIC,
    price: 600,
    icon: '⚔️',
    description: 'Forjada en fuego dragón. Una hoja implacable que inflige quemaduras al golpear.',
    stats: { attack: 45, critChance: 0.05 }
  },
  'weapon_excalibur': {
    id: 'weapon_excalibur',
    name: 'Espada Sagrada Excalibur',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.LEGENDARY,
    price: 2000,
    icon: '✨',
    description: 'La legendaria espada de la luz. Su portador es imbuido con poder celestial inimaginable.',
    stats: { attack: 95, defense: 10, critChance: 0.12 }
  },

  // --- WEAPONS (ARCHER / RANGED / AGILITY) ---
  'weapon_short_bow': {
    id: 'weapon_short_bow',
    name: 'Arco Corto de Madera',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.COMMON,
    price: 30,
    icon: '🏹',
    description: 'Flexible y ligero. Fácil de tensar pero carece de largo alcance devastador.',
    stats: { attack: 5, speed: 2 }
  },
  'weapon_composite_bow': {
    id: 'weapon_composite_bow',
    name: 'Arco Compuesto de Caza',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.COMMON,
    price: 90,
    icon: '🏹',
    description: 'Arco reforzado con astas y tendones. Lanza flechas con gran penetración.',
    stats: { attack: 12, speed: 4, critChance: 0.03 }
  },
  'weapon_windrunner_bow': {
    id: 'weapon_windrunner_bow',
    name: 'Arco Susurro del Viento',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.RARE,
    price: 250,
    icon: '🏹',
    description: 'Las flechas disparadas por este arco viajan envueltas en ráfagas de aire que aceleran al tirador.',
    stats: { attack: 20, speed: 8, critChance: 0.06 }
  },
  'weapon_shadowstrike_bow': {
    id: 'weapon_shadowstrike_bow',
    name: 'Arco del Asalto Sombrío',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.EPIC,
    price: 650,
    icon: '🏹',
    description: 'Imbuido con esencia del vacío. Aumenta enormemente los golpes críticos y puede aturdir.',
    stats: { attack: 38, speed: 12, critChance: 0.15 }
  },
  'weapon_artemis_bow': {
    id: 'weapon_artemis_bow',
    name: 'Arco Divino de Artemisa',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.LEGENDARY,
    price: 2100,
    icon: '🏹',
    description: 'Bendecido por la diosa de la caza. Nunca erra un disparo y sus flechas atraviesan cualquier armadura.',
    stats: { attack: 85, speed: 22, critChance: 0.25 }
  },

  // --- WEAPONS (MAGE / STAFFS / MAGIC) ---
  'weapon_novice_staff': {
    id: 'weapon_novice_staff',
    name: 'Báculo de Aprendiz',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.COMMON,
    price: 30,
    icon: '🪄',
    description: 'Un trozo de roble con una pequeña piedra amatista atada en la punta.',
    stats: { magicAttack: 6, maxMp: 10 }
  },
  'weapon_elder_wand': {
    id: 'weapon_elder_wand',
    name: 'Varita de Saúco',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.COMMON,
    price: 100,
    icon: '🪄',
    description: 'Una varita delgada que canaliza la magia elemental con fluidez.',
    stats: { magicAttack: 14, maxMp: 20 }
  },
  'weapon_pyromancer_staff': {
    id: 'weapon_pyromancer_staff',
    name: 'Báculo del Piromante',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.RARE,
    price: 270,
    icon: '🔮',
    description: 'Coronado por un orbe de fuego eterno que amplifica los conjuros destructivos.',
    stats: { magicAttack: 28, maxMp: 35, attack: 4 }
  },
  'weapon_archmage_staff': {
    id: 'weapon_archmage_staff',
    name: 'Báculo de Gran Mago',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.EPIC,
    price: 700,
    icon: '🔮',
    description: 'Reservado solo para los sabios del Alto Concilio. Otorga una inmensa concentración arcana.',
    stats: { magicAttack: 55, maxMp: 60, magicDefense: 10 }
  },
  'weapon_apocalypse_staff': {
    id: 'weapon_apocalypse_staff',
    name: 'Cetro del Apocalipsis',
    type: ITEM_TYPE.WEAPON,
    slot: EQUIP_SLOTS.WEAPON,
    rarity: RARITY.LEGENDARY,
    price: 2300,
    icon: '☠️',
    description: 'Canaliza las fuerzas destructivas del mismísimo vacío. Su mera presencia desintegra la materia.',
    stats: { magicAttack: 110, maxMp: 120, critChance: 0.1 }
  },

  // --- ARMOR ---
  'armor_tattered_clothes': {
    id: 'armor_tattered_clothes',
    name: 'Ropas Harapientas',
    type: ITEM_TYPE.ARMOR,
    slot: EQUIP_SLOTS.ARMOR,
    rarity: RARITY.COMMON,
    price: 10,
    icon: '👕',
    description: 'Telas desgastadas e ineficaces. Al menos te cubren del frío.',
    stats: { defense: 2, magicDefense: 2 }
  },
  'armor_leather_chest': {
    id: 'armor_leather_chest',
    name: 'Pechera de Cuero Curtido',
    type: ITEM_TYPE.ARMOR,
    slot: EQUIP_SLOTS.ARMOR,
    rarity: RARITY.COMMON,
    price: 60,
    icon: '🛡️',
    description: 'Ofrece protección ligera adecuada sin entorpecer los movimientos.',
    stats: { defense: 6, magicDefense: 4, speed: 2 }
  },
  'armor_chainmail': {
    id: 'armor_chainmail',
    name: 'Cota de Malla de Acero',
    type: ITEM_TYPE.ARMOR,
    slot: EQUIP_SLOTS.ARMOR,
    rarity: RARITY.RARE,
    price: 180,
    icon: '🛡️',
    description: 'Una intrincada red de eslabones metálicos que detiene espadazos con destreza.',
    stats: { defense: 15, magicDefense: 8 }
  },
  'armor_paladin_plate': {
    id: 'armor_paladin_plate',
    name: 'Armadura del Paladín',
    type: ITEM_TYPE.ARMOR,
    slot: EQUIP_SLOTS.ARMOR,
    rarity: RARITY.EPIC,
    price: 550,
    icon: '🛡️',
    description: 'Armadura pesada bendecida que resplandece en la penumbra. Alta defensa física y mágica.',
    stats: { defense: 35, magicDefense: 25, maxHp: 50 }
  },
  'armor_aegis_suit': {
    id: 'armor_aegis_suit',
    name: 'Armadura Coraza de la Égida',
    type: ITEM_TYPE.ARMOR,
    slot: EQUIP_SLOTS.ARMOR,
    rarity: RARITY.LEGENDARY,
    price: 1800,
    icon: '✨',
    description: 'Mitología forjada en metal estelar. Absorbe los impactos y anula la mayoría de las maldiciones.',
    stats: { defense: 75, magicDefense: 55, maxHp: 120, defenseBoost: 1.1 }
  },

  // --- SHIELDS ---
  'shield_wooden': {
    id: 'shield_wooden',
    name: 'Escudo de Madera Rotizo',
    type: ITEM_TYPE.SHIELD,
    slot: EQUIP_SLOTS.SHIELD,
    rarity: RARITY.COMMON,
    price: 20,
    icon: '🛡️',
    description: 'Viejas tablas de pino reforzadas con una banda de metal.',
    stats: { defense: 3 }
  },
  'shield_iron': {
    id: 'shield_iron',
    name: 'Escudo Redondo de Hierro',
    type: ITEM_TYPE.SHIELD,
    slot: EQUIP_SLOTS.SHIELD,
    rarity: RARITY.COMMON,
    price: 70,
    icon: '🛡️',
    description: 'Escudo pesado ideal para bloquear flechas y desviar tajos físicos.',
    stats: { defense: 8, speed: -1 }
  },
  'shield_dragon_scale': {
    id: 'shield_dragon_scale',
    name: 'Brocquel de Escamas de Dragón',
    type: ITEM_TYPE.SHIELD,
    slot: EQUIP_SLOTS.SHIELD,
    rarity: RARITY.EPIC,
    price: 450,
    icon: '🛡️',
    description: 'Escudo fabricado con duras escamas de guiverno. Altamente resistente al calor y fuego.',
    stats: { defense: 24, magicDefense: 15, maxHp: 30 }
  },

  // --- HELMETS ---
  'helmet_leather': {
    id: 'helmet_leather',
    name: 'Capucha de Cuero Rústica',
    type: ITEM_TYPE.HELMET,
    slot: EQUIP_SLOTS.HELMET,
    rarity: RARITY.COMMON,
    price: 25,
    icon: '🪖',
    description: 'Cubre tu cabeza y orejas de rasguños casuales.',
    stats: { defense: 2, magicDefense: 1 }
  },
  'helmet_iron': {
    id: 'helmet_iron',
    name: 'Casco de Hierro con Visera',
    type: ITEM_TYPE.HELMET,
    slot: EQUIP_SLOTS.HELMET,
    rarity: RARITY.COMMON,
    price: 75,
    icon: '🪖',
    description: 'Casco resistente que resguarda el cráneo pero reduce ligeramente el campo visual.',
    stats: { defense: 5 }
  },
  'helmet_griffin_crown': {
    id: 'helmet_griffin_crown',
    name: 'Corona del Grifo Real',
    type: ITEM_TYPE.HELMET,
    slot: EQUIP_SLOTS.HELMET,
    rarity: RARITY.EPIC,
    price: 400,
    icon: '👑',
    description: 'Adornada con plumas doradas. Infunde valor y agudeza mental en combate.',
    stats: { defense: 12, magicDefense: 10, critChance: 0.04 }
  },

  // --- ACCESSORIES (RINGS, AMULETS) ---
  'accessory_copper_ring': {
    id: 'accessory_copper_ring',
    name: 'Anillo de Cobre Sencillo',
    type: ITEM_TYPE.ACCESSORY,
    slot: EQUIP_SLOTS.ACCESSORY,
    rarity: RARITY.COMMON,
    price: 15,
    icon: '💍',
    description: 'Un aro metálico común sin propiedades mágicas notables.',
    stats: { maxHp: 5 }
  },
  'accessory_ring_of_life': {
    id: 'accessory_ring_of_life',
    name: 'Anillo de Vitalidad',
    type: ITEM_TYPE.ACCESSORY,
    slot: EQUIP_SLOTS.ACCESSORY,
    rarity: RARITY.RARE,
    price: 180,
    icon: '💍',
    description: 'Grabado con runas sanadoras. Otorga al portador salud robusta.',
    stats: { maxHp: 40, defense: 2 }
  },
  'accessory_amulet_of_power': {
    id: 'accessory_amulet_of_power',
    name: 'Amuleto del Despertar Arcana',
    type: ITEM_TYPE.ACCESSORY,
    slot: EQUIP_SLOTS.ACCESSORY,
    rarity: RARITY.EPIC,
    price: 500,
    icon: '📿',
    description: 'Un zafiro suspendido por una cadena que palpita con energía mágica ancestral.',
    stats: { magicAttack: 15, maxMp: 50 }
  },
  'accessory_chronos_hourglass': {
    id: 'accessory_chronos_hourglass',
    name: 'Reloj de Arena Cósmico',
    type: ITEM_TYPE.ACCESSORY,
    slot: EQUIP_SLOTS.ACCESSORY,
    rarity: RARITY.LEGENDARY,
    price: 1500,
    icon: '⌛',
    description: 'Permite vislumbrar breves fragmentos del futuro inmediato. Mejora la velocidad y la evasión.',
    stats: { speed: 15, dodgeChance: 0.12, critChance: 0.06 }
  },

  // --- STORY / VALUABLES / QUEST ITEMS ---
  'crystal_shard_earth': {
    id: 'crystal_shard_earth',
    name: 'Fragmento del Cristal de Tierra',
    type: ITEM_TYPE.MATERIAL,
    rarity: RARITY.LEGENDARY,
    price: 0,
    icon: '🟢',
    description: 'Un fragmento resplandeciente recuperado del Bosque Sombrío. Vibra con la fuerza de la tierra.',
    questItem: true
  },
  'crystal_shard_water': {
    id: 'crystal_shard_water',
    name: 'Fragmento del Cristal de Agua',
    type: ITEM_TYPE.MATERIAL,
    rarity: RARITY.LEGENDARY,
    price: 0,
    icon: '🔵',
    description: 'Un trozo de cristal que gotea agua pura y fresca. Proviene de la Cueva Cristalina.',
    questItem: true
  },
  'crystal_shard_wind': {
    id: 'crystal_shard_wind',
    name: 'Fragmento del Cristal de Viento',
    type: ITEM_TYPE.MATERIAL,
    rarity: RARITY.LEGENDARY,
    price: 0,
    icon: '⚪',
    description: 'Es tan liviano que parece flotar en la palma de tu mano. Recuperado de la Montaña Tormenta.',
    questItem: true
  },
  'crystal_shard_fire': {
    id: 'crystal_shard_fire',
    name: 'Fragmento del Cristal de Fuego',
    type: ITEM_TYPE.MATERIAL,
    rarity: RARITY.LEGENDARY,
    price: 0,
    icon: '🔴',
    description: 'Emite un calor abrasador pero reconfortante. Encontrado en las profundidades del Castillo Oscuro.',
    questItem: true
  }
});
