# 🛡️ Crónicas de Aethermoor — RPG Web de Aventuras

¡Bienvenido a **Crónicas de Aethermoor**, un completo y robusto videojuego de rol (RPG) de fantasía y aventuras en navegador de nivel profesional. Desarrollado de forma modular, escalable y mantenible utilizando **HTML5 + CSS3 (Vanilla) + JavaScript ES6+** puro, siguiendo principios **SOLID**, **Clean Code** y patrones de diseño desacoplados.

La persistencia del juego se realiza localmente mediante **LocalStorage** con validaciones robustas de integridad de datos y guardado automático en segundo plano.

---

## 🎮 Características del Juego

1. **Creación de Héroes**: Escribe el nombre de tu aventurero y elige entre 3 clases jugables:
   - 🛡️ **Guerrero**: Gran vitalidad y defensa física física devastadora.
   - 🏹 **Arquero**: Gran velocidad y alta probabilidad de golpes críticos y esquivas.
   - 🔮 **Mago**: Daño mágico destructivo consumiendo su gran reserva de maná.
2. **Exploración Regional**: 5 regiones interconectadas de Aethermoor con niveles escalados, eventos aleatorios (cofres de oro, trampas dañinas, pociones milagrosas) y enemigos salvajes.
3. **Combate por Turnos en Arena**:
   - Ataques físicos regulares, defensa táctica (reduce 50% de daño) y consumo de pociones curativas.
   - Habilidades mágicas de clase con efectos secundarios como Quemaduras, Congelamientos, Aturdimientos o Venenos.
   - Animaciones dinámicas de impacto físico y popups flotantes de daño crítico y curaciones en tiempo real.
4. **Sistema de Misiones**: Misiones principales y secundarias ramificadas con seguimiento automático de progreso y entrega de recompensas de oro, experiencia y equipamiento.
5. **Economía de Mercaderes**: Compra y vende armas, armaduras, cascos, escudos y accesorios consumibles de rarezas (Común ➔ Legendario) a mercaderes locales a cambio de oro.
6. **Guardado Persistente**:
   - Guardado automático cada 30 segundos (`autoSave`).
   - Guardado manual de fácil acceso desde el HUD de exploración.
   - Resistencia ante cierres de pestañas o recargas del navegador.

---

## 📂 Arquitectura de Carpetas y Módulos

El proyecto sigue una estructura limpia y desacoplada de capas:

```
JUEGO-NICE/
├── index.html                  # Portal principal y contenedor del DOM
├── package.json                # Configuración del servidor de desarrollo Vite
├── css/
│   ├── base/
│   │   ├── reset.css           # Reseteo CSS consistente para navegadores
│   │   ├── variables.css       # Tokens de diseño (Colores HSL, fuentes, bordes)
│   │   └── typography.css      # Carga de fuentes premium (Outfit, Inter) y headings
│   ├── components/
│   │   ├── buttons.css         # Variantes de botones táctiles premium
│   │   ├── cards.css           # Diseños de cartas de equipamiento y clases
│   │   ├── modals.css          # Superposiciones y diálogos emergentes
│   │   └── bars.css            # Barras dinámicas de HP, MP y EXP
│   ├── pages/
│   │   ├── menu.css            # Menú principal de carga premium
│   │   ├── game.css            # HUD superior y mapa interactivo
│   │   ├── combat.css          # Arena de batalla animada
│   │   └── shop.css            # Diseño de tienda transaccional
│   ├── themes/
│   │   └── dark.css            # Variables y animaciones de tema oscuro premium
│   └── main.css                # Importador centralizado de estilos
├── js/
│   ├── core/
│   │   ├── EventBus.js        # Comunicación por eventos pub/sub desacoplados
│   │   ├── GameState.js       # Estado reactivo y única fuente de verdad
│   │   └── GameEngine.js      # Orquestador del ciclo de vida y rehidratador
│   ├── data/
│   │   ├── classes.js          # Plantillas de estadísticas y habilidades de clases
│   │   ├── enemies.js          # Bestiario con pools de botines y habilidades IA
│   │   ├── items.js            # Catálogo de objetos equipables y consumibles
│   │   ├── maps.js             # Regiones conectadas y eventos de zona
│   │   ├── npcs.js             # Roles de NPCs y configuraciones de tiendas
│   │   ├── dialogues.js        # Árboles de diálogo de texto ramificados
│   │   └── quests.js           # Líneas de misiones principales y secundarias
│   ├── models/
│   │   ├── Player.js           # Estadísticas base, dinámicas y niveles del héroe
│   │   ├── Enemy.js            # Instancias de enemigos, botines y oro variance
│   │   ├── Item.js             # Envoltura de instancias de objetos con IDs únicos
│   │   ├── Quest.js            # Manejo del progreso y metas de misiones
│   │   └── NPC.js              # Datos dinámicos del NPC de exploración
│   ├── services/
│   │   ├── CombatService.js    # Lógica de turnos, daño, estados alterados e IA
│   │   ├── InventoryService.js # Gestor de equipamiento, pociones y niveles
│   │   ├── SaveService.js      # Lectura, escritura y validación de localStorage
│   │   ├── QuestService.js     # Validador de objetivos y entregador de recompensas
│   │   ├── ShopService.js      # Intercambios económicos de compra/venta
│   │   └── MapService.js       # Navegación regional y resolutor de eventos
│   ├── ui/
│   │   ├── ScreenManager.js    # Controlador de pantallas con transiciones fade
│   │   ├── MenuUI.js           # Controlador del Menú Principal
│   │   ├── CharacterCreationUI.js # Interfaz de selección de clase y nombre
│   │   ├── GameUI.js           # HUD y panel de exploración del mundo
│   │   ├── CombatUI.js         # Interfaz de combate activa y popups de daño
│   │   ├── InventoryUI.js      # Grid interactivo de mochila y ranuras de equipo
│   │   ├── ShopUI.js           # Tienda interactiva con el mercader regional
│   │   ├── QuestUI.js          # Registro visual de misiones del jugador
│   │   └── DialogUI.js         # Intérprete visual de diálogos ramificados
│   ├── utils/
│   │   ├── constants.js        # Enums, nombres de eventos y configuraciones de balanceo
│   │   ├── helpers.js          # Funciones matemáticas, porcentajes y selecciones azar
│   │   ├── logger.js           # Logger centralizado y niveles de depuración
│   │   └── validators.js       # Validaciones contra inyección o datos corruptos
│   └── main.js                 # Launcher de carga y registro inicial de pantallas
```

---

## 🚀 Cómo Iniciar el Juego

### Opción 1: Servidor de Desarrollo Rápido (Recomendado)
Para una carga óptima con recarga rápida hot-reload utilizando el servidor **Vite** incluido:
1. Abre tu terminal en el directorio del proyecto `c:\Users\bverag\Downloads\JUEGO-NICE`.
2. Ejecuta `npm install` para descargar las dependencias de desarrollo.
3. Ejecuta `npm run dev` para iniciar el servidor.
4. Abre la URL en tu navegador (por defecto `http://localhost:5173`).

### Opción 2: Sin Instalaciones (Directo en el Navegador)
Dado que está construido con JavaScript ES6 moderno nativo, puedes utilizar cualquier servidor local estático sin configurar dependencias:
- **VS Code**: Instala la extensión **Live Server**, haz clic derecho en `index.html` y selecciona **Open with Live Server**.
- **Python**: Ejecuta `python -m http.server 8000` en la terminal del directorio y entra a `http://localhost:8000`.

---

## 🛠️ Cómo Extender y Modificar el Juego

El juego ha sido diseñado para que añadir contenido nuevo no requiera editar la lógica de combate, exploración o menús. Basta con modificar los archivos correspondientes en `/js/data/`:

*   **Añadir Nuevos Objetos**: Añade una nueva clave con su respectiva rareza y estadísticas en `js/data/items.js`. El juego lo renderizará en los comercios de inmediato.
*   **Crear Enemigos y Jefes**: Configura su vida, ataque, probabilidad de esquiva y tabla de botines en `js/data/enemies.js`.
*   **Agregar Regiones**: Edita `js/data/maps.js`, conecta tu nueva zona a las adyacentes y especifica qué enemigos salvajes o NPCs mercaderes la habitan.
*   **Escribir Conversaciones**: Configura árboles de conversación interactiva ramificada en `js/data/dialogues.js`.

---

## 📜 Licencia y Autoría

Desarrollado para la campaña de rol **Crónicas de Aethermoor**. Todo el código fuente está modularizado bajo estándares modernos de desarrollo de videojuegos en navegador.
