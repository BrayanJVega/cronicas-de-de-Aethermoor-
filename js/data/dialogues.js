/**
 * dialogues.js — Branching dialogue trees for all NPCs
 * Structure allows for node-based dialogue systems with choices
 */

export const DIALOGUE_DATA = Object.freeze({
  // --- ANCIANO OAKHAVEN ---
  'elder_luminara': {
    startNode: 'greeting',
    nodes: {
      'greeting': {
        text: 'Saludos, joven viajero. Aethermoor está en grave peligro. El Cristal de Dawn ha sido destrozado por el Hechicero Malachar, y su influencia corruptora devora nuestras tierras.',
        choices: [
          { text: '¿Qué puedo hacer para ayudar?', nextNode: 'ask_help' },
          { text: '¿Dónde encuentro a Malachar?', nextNode: 'ask_malachar' },
          { text: 'Tengo que irme.', nextNode: 'exit' }
        ]
      },
      'ask_help': {
        text: 'Debes recolectar los 4 Fragmentos del Cristal que cayeron en las diversas regiones para restaurar el equilibrio. El primer fragmento está en el Bosque Sombrío. Grootok, el guardián arbóreo ancestral, ha enloquecido por la corrupción.',
        choices: [
          { text: 'Derrotaré a Grootok y traeré el fragmento.', nextNode: 'accept_quest_1' },
          { text: 'Suena muy peligroso para mí.', nextNode: 'coward' }
        ]
      },
      'accept_quest_1': {
        text: '¡Que la luz te guíe! Dirígete al este hacia el Bosque Sombrío. Ten cuidado, los goblins y lobos merodean los caminos.',
        action: 'acceptQuest:quest_main_1',
        choices: [
          { text: 'Entendido. ¡Me pongo en marcha!', nextNode: 'exit' }
        ]
      },
      'ask_malachar': {
        text: 'Malachar se refugia en su Castillo Oscuro más allá de la Montaña Tormenta. Ningún mortal corriente puede cruzar las barreras mágicas sin el poder unificado de los fragmentos cristalinos.',
        choices: [
          { text: 'Entonces buscaré los fragmentos.', nextNode: 'ask_help' },
          { text: 'Me marcho.', nextNode: 'exit' }
        ]
      },
      'coward': {
        text: 'La cobardía solo acelerará nuestra perdición... Vuelve cuando el coraje encienda tu alma.',
        choices: [
          { text: 'Adiós.', nextNode: 'exit' }
        ]
      },
      'exit': {
        text: 'Camina con cuidado bajo las sombras del mundo.',
        isEnd: true
      }
    }
  },

  // --- CURANDERA ELARA ---
  'curandera_elara': {
    startNode: 'greeting',
    nodes: {
      'greeting': {
        text: 'Hola, mi niño. Tus viajes deben ser agotadores. Si tienes algunas heridas o tu energía espiritual se ha agotado, puedo curarte por un módico precio de 10 monedas de oro para comprar ingredientes.',
        choices: [
          { text: 'Por favor, cúrame (10 Oro).', nextNode: 'heal_action' },
          { text: '¿Quién eres exactamente?', nextNode: 'who_are_you' },
          { text: 'Estoy bien, gracias.', nextNode: 'exit' }
        ]
      },
      'heal_action': {
        text: 'Que las fuerzas de la naturaleza reconstituyan tu espíritu...',
        action: 'healPlayer:10', // Custom trigger action in the UI
        choices: [
          { text: '¡Me siento rejuvenecido!', nextNode: 'exit' }
        ]
      },
      'who_are_you': {
        text: 'He vivido en Luminara por más de setenta inviernos. Canalizo la magia natural para aliviar las dolencias de quienes protegen nuestras fronteras.',
        choices: [
          { text: 'Increíble. Cúrame ahora.', nextNode: 'heal_action' },
          { text: 'Adiós, Elara.', nextNode: 'exit' }
        ]
      },
      'exit': {
        text: 'Que el bosque susurre salud en tu sendero.',
        isEnd: true
      }
    }
  },

  // --- MERCADER BARNABY ---
  'comerciante_barnaby': {
    startNode: 'greeting',
    nodes: {
      'greeting': {
        text: '¡Buenas mercancías para buenos aventureros! Tengo espadas, báculos, escudos y pociones directos del mercado de la costa. ¿Interesado?',
        choices: [
          { text: 'Muéstrame tu tienda.', action: 'openShop', nextNode: 'exit' },
          { text: '¿De dónde sacas tus objetos?', nextNode: 'lore' },
          { text: 'Hoy no compraré nada.', nextNode: 'exit' }
        ]
      },
      'lore': {
        text: 'Antes de que Malachar destruyera el cristal, las caravanas mercantes llegaban todas las semanas de Aether City. Ahora tengo que fabricar mis propios ungüentos y comprar metal reciclado.',
        choices: [
          { text: 'Déjame ver tu tienda entonces.', action: 'openShop', nextNode: 'exit' },
          { text: 'Nos vemos.', nextNode: 'exit' }
        ]
      },
      'exit': {
        text: '¡Que tu oro rinda bien!',
        isEnd: true
      }
    }
  },

  // --- CAZADOR SILAS ---
  'cazador_silas': {
    startNode: 'greeting',
    nodes: {
      'greeting': {
        text: 'Silencio... Los ruidos del bosque están crispados hoy. Si vas a entrar al Bosque Sombrío, ten cuidado con las hordas de goblins.',
        choices: [
          { text: '¿Tienes alguna tarea para mí?', nextNode: 'check_quests' },
          { text: '¿Qué sabes de Grootok?', nextNode: 'grootok_info' },
          { text: 'Adiós.', nextNode: 'exit' }
        ]
      },
      'check_quests': {
        text: 'Esos malditos goblins se roban mis cepos de caza. Si cazas 3 Goblins te daré mi Arco Corto de repuesto.',
        choices: [
          { text: 'Acepto la cacería de goblins.', nextNode: 'accept_goblin_quest' },
          { text: 'No tengo tiempo.', nextNode: 'exit' }
        ]
      },
      'accept_goblin_quest': {
        text: 'Apunta al cuello y no te confíes de sus trucos sucios.',
        action: 'acceptQuest:quest_sec_clear_goblins',
        choices: [
          { text: 'Hecho.', nextNode: 'exit' }
        ]
      },
      'grootok_info': {
        text: 'Grootok era un espíritu pacífico de las raíces de roble. Ahora sus ojos brillan con luz roja enfermiza y ataca a todo viajero. Está custodiando el fragmento verde de cristal en el centro del bosque.',
        choices: [
          { text: 'Entiendo.', nextNode: 'greeting' }
        ]
      },
      'exit': {
        text: 'Mantén las flechas listas en el carcaj.',
        isEnd: true
      }
    }
  },

  // --- HERRERO GRUNDOR ---
  'herrero_grundor': {
    startNode: 'greeting',
    nodes: {
      'greeting': {
        text: '¡Cielos santos! La forja está fría como el hielo por culpa de los malditos esqueletos que retumban en el subsuelo. ¿Vienes a comprar acero de verdad?',
        choices: [
          { text: 'Muéstrame tus armas y escudos.', action: 'openShop', nextNode: 'exit' },
          { text: '¿Cómo puedo ayudarte con la forja?', nextNode: 'ask_quest' },
          { text: 'Me marcho.', nextNode: 'exit' }
        ]
      },
      'ask_quest': {
        text: 'Los ruidos de esos huesos andantes me desconcentran. Aplasta 4 Esqueletos en la Cueva y te recompensaré con un Escudo de Hierro sólido.',
        choices: [
          { text: 'Me encargaré de esos esqueletos.', nextNode: 'accept_skeleton_quest' },
          { text: 'Tengo prisa.', nextNode: 'exit' }
        ]
      },
      'accept_skeleton_quest': {
        text: '¡Rompe sus cráneos de mi parte!',
        action: 'acceptQuest:quest_sec_clean_cave',
        choices: [
          { text: '¡Entendido!', nextNode: 'exit' }
        ]
      },
      'exit': {
        text: '¡Golpea duro y mantén la forja encendida!',
        isEnd: true
      }
    }
  },

  // --- SABIO ZEPHYR ---
  'ermitano_zephyr': {
    startNode: 'greeting',
    nodes: {
      'greeting': {
        text: 'El viento aúlla con rabia ancestral. Los truenos anuncian el avance inevitable de la oscuridad. ¿Buscas sabiduría, o solo equipamiento para enfrentar la tormenta?',
        choices: [
          { text: 'Quiero ver tu tienda rúnica.', action: 'openShop', nextNode: 'exit' },
          { text: '¿Cómo detengo las tempestades?', nextNode: 'tempest_info' },
          { text: 'Me retiro.', nextNode: 'exit' }
        ]
      },
      'tempest_info': {
        text: 'El gran dragón wyvern Aurelius convoca los truenos desde la cima de la montaña. Sus vientos te desgarrarán si no estás preparado. Elimina a 3 magos oscuros del sendero sagrado para disipar la barrera menor.',
        choices: [
          { text: 'Acepto acabar con los magos.', nextNode: 'accept_mages_quest' },
          { text: 'Buscaré otra forma.', nextNode: 'exit' }
        ]
      },
      'accept_mages_quest': {
        text: 'Que el viento guíe tu espada y tu mente contra los conjuros prohibidos.',
        action: 'acceptQuest:quest_sec_mountain_mages',
        choices: [
          { text: 'Así se hará.', nextNode: 'exit' }
        ]
      },
      'exit': {
        text: 'El destino está tallado en las runas de piedra.',
        isEnd: true
      }
    }
  }
});
