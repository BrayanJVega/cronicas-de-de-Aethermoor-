import { CLASSES, SCREENS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { CLASS_DATA } from '../data/classes.js';
import { validatePlayerName } from '../utils/validators.js';
import { Player } from '../models/Player.js';
import { CHARACTER_IMAGES } from '../data/images.js';

export class CharacterCreationUI {
  constructor() {
    this.selectedClass = CLASSES.WARRIOR;
  }

  /**
   * Render screen layout
   * @param {HTMLElement} container
   */
  render(container) {
    // Generate class cards dynamically
    let classCardsHtml = '';
    for (const key in CLASS_DATA) {
      const cls = CLASS_DATA[key];
      const isSelected = this.selectedClass === cls.id;
      
      const base64Img = CHARACTER_IMAGES[cls.id];
      const portraitHtml = base64Img 
        ? `<div class="class-portrait-container"><img src="data:image/png;base64,${base64Img}" class="class-portrait-img" alt="${cls.name}"></div>`
        : `<div class="card-class-icon">${cls.icon}</div>`;

      classCardsHtml += `
        <div class="card card-class ${isSelected ? 'selected' : ''}" data-class="${cls.id}">
          ${portraitHtml}
          <h3 class="card-class-name" style="margin-top: 10px">${cls.name}</h3>
          <p class="text-sm text-secondary" style="margin: 5px 0 10px 0">${cls.description}</p>
          <div class="class-stats">
            <div class="stat-row"><span class="text-muted">Vida:</span><span class="stat-value">${cls.baseStats.maxHp}</span></div>
            <div class="stat-row"><span class="text-muted">Maná:</span><span class="stat-value">${cls.baseStats.maxMp}</span></div>
            <div class="stat-row"><span class="text-muted">Ataque:</span><span class="stat-value">${cls.baseStats.attack}</span></div>
            <div class="stat-row"><span class="text-muted">Defensa:</span><span class="stat-value">${cls.baseStats.defense}</span></div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="screen-creation">
        <div class="creation-header">
          <h1 class="heading-2 text-gold">Crea tu Héroe</h1>
          <p class="text-secondary text-sm">Define tu destino en la tierra de Aethermoor</p>
        </div>

        <div class="creation-form card" style="max-width: 600px; width: 100%">
          <div class="creation-input-group">
            <label class="creation-label">Nombre del Héroe</label>
            <input id="input-hero-name" type="text" class="creation-input" placeholder="Ej. Roderick, Lyra, Kael..." maxlength="20" autofocus>
            <span id="name-validation-error" class="text-xs" style="color: var(--color-accent-red); display: none; margin-top: 5px"></span>
          </div>

          <label class="creation-label" style="margin-top: 20px">Elige tu Clase</label>
          <div class="class-grid" style="margin-top: 10px">
            ${classCardsHtml}
          </div>

          <div style="display: flex; gap: 15px; margin-top: 30px">
            <button id="btn-creation-back" class="btn btn-ghost btn-block">Volver</button>
            <button id="btn-creation-submit" class="btn btn-primary btn-block">Comenzar Aventura</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const classCards = document.querySelectorAll('.card-class');
    const btnBack = document.getElementById('btn-creation-back');
    const btnSubmit = document.getElementById('btn-creation-submit');
    const nameInput = document.getElementById('input-hero-name');
    const errorText = document.getElementById('name-validation-error');

    // Handle class card selection clicks
    classCards.forEach(card => {
      card.addEventListener('click', () => {
        classCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedClass = card.getAttribute('data-class');
      });
    });

    if (btnBack) {
      btnBack.addEventListener('click', () => {
        gameState.setScreen(SCREENS.MENU);
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const nameValue = nameInput.value;
        const validation = validatePlayerName(nameValue);

        if (!validation.valid) {
          errorText.textContent = validation.error;
          errorText.style.display = 'block';
          nameInput.style.borderColor = 'var(--color-accent-red)';
          return;
        }

        // Hide validation messages
        errorText.style.display = 'none';
        nameInput.style.borderColor = 'var(--color-border)';

        // Create player data structure
        const newHero = new Player(nameValue.trim(), this.selectedClass);

        // Start new game via engine orchestrator
        window.gameEngine.newGame(newHero);
      });
    }
  }
}
