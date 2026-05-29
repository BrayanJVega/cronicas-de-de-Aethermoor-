/**
 * maps.js — Map configuration defining regions, connections, enemies, NPCs, and events
 */

import { REGIONS } from '../utils/constants.js';

export const MAP_DATA = Object.freeze({
  [REGIONS.VILLAGE]: {
    id: REGIONS.VILLAGE,
    name: 'Aldea Luminara',
    description: 'Un oasis de paz y tranquilidad al pie del valle. Es el último refugio a salvo de la corrupción que asola el reino.',
    levelRange: 'Nivel 1 - 3',
    icon: '🏡',
    bgClass: 'bg-village',
    connections: [REGIONS.FOREST],
    npcs: ['npc_elder', 'npc_curandera', 'npc_comerciante_rural'],
    enemies: ['dummy'],
    exploreEvents: [
      {
        name: 'Pozo de los Deseos',
        description: 'Encuentras un pozo antiguo. Arrojas una moneda brillante y sientes una oleada de energía.',
        chance: 0.3,
        effect: { healPercent: 0.5, message: '¡Has recuperado el 50% de tu salud!' }
      },
      {
        name: 'Hierbas Medicinales',
        description: 'Buscas entre los arbustos y encuentras unas hojas con aroma dulzón.',
        chance: 0.4,
        effect: { giveItems: [{ itemId: 'potion_hp_minor', count: 1 }], message: 'Has encontrado una Poción Menor de Vida.' }
      }
    ]
  },

  [REGIONS.FOREST]: {
    id: REGIONS.FOREST,
    name: 'Bosque Sombrío',
    description: 'Un bosque espeso donde los árboles parecen susurrar advertencias y las sombras cobran vida propia.',
    levelRange: 'Nivel 3 - 6',
    icon: '🌲',
    bgClass: 'bg-forest',
    connections: [REGIONS.VILLAGE, REGIONS.CAVE],
    npcs: ['npc_cazador'],
    enemies: ['goblin', 'wolf'],
    bossId: 'boss_treant',
    exploreEvents: [
      {
        name: 'Cofre Oculto',
        description: 'Ves un cofre cubierto de musgo escondido bajo el hueco de un roble centenario.',
        chance: 0.25,
        effect: { gold: 50, giveItems: [{ itemId: 'accessory_copper_ring', count: 1 }], message: '¡Cofre abierto! Obtienes 50 de oro y un Anillo de Cobre.' }
      },
      {
        name: 'Emboscada Goblin',
        description: '¡Una risa maliciosa resuena en las copas de los árboles! Un goblin cae frente a ti.',
        chance: 0.3,
        effect: { forceCombat: 'goblin', message: '¡Te emboscan!' }
      }
    ]
  },

  [REGIONS.CAVE]: {
    id: REGIONS.CAVE,
    name: 'Cueva Cristalina',
    description: 'Túneles subterráneos húmedos iluminados por el resplandor de cristales mágicos de rubí. Hogar de monstruos que temen a la luz.',
    levelRange: 'Nivel 6 - 9',
    icon: '💎',
    bgClass: 'bg-cave',
    connections: [REGIONS.FOREST, REGIONS.MOUNTAIN],
    npcs: ['npc_herrero'],
    enemies: ['skeleton', 'bandit'],
    bossId: 'boss_golem',
    exploreEvents: [
      {
        name: 'Geoda Brillante',
        description: 'Golpeas un cristal saliente y se rompe revelando gemas raras.',
        chance: 0.35,
        effect: { gold: 120, message: 'Vendes los fragmentos de cristal brillantes por 120 de oro.' }
      },
      {
        name: 'Trampa del Derrumbe',
        description: '¡Pisas una baldosa floja y varias rocas caen del techo de la cueva!',
        chance: 0.25,
        effect: { damagePercent: 0.2, message: '¡Te golpea una roca perdiendo un 20% de tu salud máxima!' }
      }
    ]
  },

  [REGIONS.MOUNTAIN]: {
    id: REGIONS.MOUNTAIN,
    name: 'Montaña Tormenta',
    description: 'Picos escarpados cubiertos de nubes de tormenta eternas y vientos aulladores que amenazan con arrojar a los intrusos al abismo.',
    levelRange: 'Nivel 9 - 12',
    icon: '🏔️',
    bgClass: 'bg-mountain',
    connections: [REGIONS.CAVE, REGIONS.CASTLE],
    npcs: ['npc_ermitano'],
    enemies: ['dark_mage', 'harpy'],
    bossId: 'boss_wyvern',
    exploreEvents: [
      {
        name: 'Estatua del Viento',
        description: 'Una majestuosa efigie de piedra dedicada a un dios olvidado descansa en el sendero.',
        chance: 0.3,
        effect: { fullRestore: true, message: 'La estatua brilla y restaura toda tu salud y maná.' }
      },
      {
        name: 'Nido de Harpía',
        description: 'Encuentras un nido gigante lleno de plumas doradas.',
        chance: 0.2,
        effect: { giveItems: [{ itemId: 'potion_hp_major', count: 1 }], message: '¡Has recuperado una Poción Mayor de Vida!' }
      }
    ]
  },

  [REGIONS.CASTLE]: {
    id: REGIONS.CASTLE,
    name: 'Castillo Oscuro',
    description: 'La fortaleza sombría de Malachar. El epicentro de la corrupción donde el cielo sangra y la esperanza muere.',
    levelRange: 'Nivel 12 - 15',
    icon: '🏰',
    bgClass: 'bg-castle',
    connections: [REGIONS.MOUNTAIN],
    npcs: [],
    enemies: ['dark_knight', 'shadow_beast'],
    bossId: 'boss_malachar',
    exploreEvents: [
      {
        name: 'Cofre del Tesoro Maldito',
        description: 'Un cofre negro azabache rodeado de un aura siniestra.',
        chance: 0.2,
        effect: { gold: 350, giveItems: [{ itemId: 'potion_elixir', count: 1 }], message: 'El cofre contiene un Elixir de los Ancestros y 350 de oro.' }
      },
      {
        name: 'Trampa del Vacío',
        description: 'Un portal temporal se abre absorbiendo tu fuerza vital.',
        chance: 0.3,
        effect: { damage: 50, message: 'La energía oscura te daña causándote 50 puntos de daño directo.' }
      }
    ]
  }
});
