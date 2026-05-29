/**
 * MenuUI.js — Renders and controls the premium main landing menu with GSAP cinematic intro
 */

import { gsap } from 'gsap';
import { SCREENS, EVENTS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';

export class MenuUI {
  /**
   * Render Main Menu to the DOM root app container
   * @param {HTMLElement} container
   */
  render(container) {
    const hasSave = window.gameEngine.services.save.hasSave();

    container.innerHTML = `
      <div class="screen-menu">
        <div class="menu-intro-overlay"></div>
        <div class="menu-content-wrapper" style="opacity: 0; transform: scale(0.95)">
          <h1 class="menu-title" style="transform: translateY(-50px); opacity: 0">C R Ó N I C A S</h1>
          <h2 class="menu-subtitle font-display" style="letter-spacing: 2px; opacity: 0">de Aethermoor</h2>
          
          <div class="menu-actions">
            <button id="btn-new-game" class="btn btn-primary btn-lg menu-btn" style="opacity: 0; transform: translateY(30px)">
              <span>Nueva Partida</span>
            </button>
            
            <button id="btn-continue" class="btn btn-secondary btn-lg menu-btn" ${hasSave ? '' : 'disabled'} style="opacity: 0; transform: translateY(30px)">
              <span>Continuar Aventura</span>
            </button>
            
            <button id="btn-delete-save" class="btn btn-ghost btn-sm menu-btn" style="margin-top: 20px; font-size: 10px; opacity: 0; transform: translateY(30px); display: ${hasSave ? 'block' : 'none'}">
              <span>Borrar Datos Guardados</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Trigger premium GSAP cinematic introduction sequence
    this._playIntroCinematic();
  }

  /**
   * Run GSAP cinematic animations on UI components
   * @private
   */
  _playIntroCinematic() {
    const timeline = gsap.timeline();

    // 1. Reveal content wrapper smoothly
    timeline.to('.menu-content-wrapper', {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out'
    });

    // 2. Drop title and animate text spacing
    timeline.to('.menu-title', {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'back.out(1.7)'
    }, '-=0.4');

    // 3. Wide subtitle tracking spacing dynamic effect
    timeline.to('.menu-subtitle', {
      opacity: 1,
      letterSpacing: '8px',
      duration: 1.2,
      ease: 'power2.out'
    }, '-=0.6');

    // 4. Stagger buttons entrance from bottom
    timeline.to('.menu-btn', {
      opacity: (index, target) => {
        // preserve opacity for delete button if needed
        return target.id === 'btn-delete-save' ? 0.6 : 1;
      },
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.8');
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    const btnNew = document.getElementById('btn-new-game');
    const btnContinue = document.getElementById('btn-continue');
    const btnDelete = document.getElementById('btn-delete-save');

    if (btnNew) {
      btnNew.addEventListener('click', () => {
        gameState.setScreen(SCREENS.CREATION);
      });
    }

    if (btnContinue && !btnContinue.disabled) {
      btnContinue.addEventListener('click', () => {
        window.gameEngine.loadGame();
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas eliminar tu partida guardada? Esto no se puede deshacer.')) {
          window.gameEngine.services.save.deleteSave();
          eventBus.emit(EVENTS.TOAST_SHOW, {
            message: 'Datos de guardado eliminados.',
            type: 'info'
          });
          // Refresh screen state
          gameState.setScreen(SCREENS.MENU);
        }
      });
    }
  }
}
