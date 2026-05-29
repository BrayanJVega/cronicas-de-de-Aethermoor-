/**
 * ScreenManager.js — Manages UI state changes, screen transitions, and global notifications utilizing GSAP
 */

import { gsap } from 'gsap';
import { SCREENS, EVENTS } from '../utils/constants.js';
import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import logger from '../utils/logger.js';
import { audioManager } from '../services/AudioManager.js';

export class ScreenManager {
  constructor() {
    this.currentScreenId = null;
    this.screens = {};

    // Create dynamically a toast container if not in HTML
    this._initToastContainer();

    // Listen to screen changes
    eventBus.on(EVENTS.SCREEN_CHANGE, (data) => this.transitionTo(data.to));
  }

  /**
   * Register a UI view handler for a specific screen ID
   * @param {string} screenId
   * @param {Object} uiModule — must implement render() and bindEvents()
   */
  registerScreen(screenId, uiModule) {
    this.screens[screenId] = uiModule;
    logger.debug(`Screen registered: ${screenId}`);
  }

  /**
   * Switch active screen with a smooth GSAP cinematic transition
   * @param {string} screenId
   */
  transitionTo(screenId) {
    logger.info(`Screen transition request: ${screenId}`);

    const appContainer = document.getElementById('app');
    if (!appContainer) {
      logger.error('Root #app container not found in DOM!');
      return;
    }

    // Retrieve UI controller
    const uiModule = this.screens[screenId];
    if (!uiModule) {
      logger.error(`No UI module registered for screen: ${screenId}`);
      return;
    }

    // Trigger region BGM updates during screen changes
    this._updateRegionBgm(screenId);

    // Play subtle hover/click transition sound
    audioManager.playSfx('hover', 0.25);

    // 1. GSAP Out-Animation: Shrink, rotate slightly in 3D space, and fade out
    gsap.to(appContainer, {
      opacity: 0,
      scale: 0.95,
      rotationX: 10,
      transformPerspective: 800,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        // 2. Render new screen content and bind events
        appContainer.innerHTML = '';
        uiModule.render(appContainer);
        uiModule.bindEvents();

        // Bind global sound effects to any newly rendered buttons
        this._bindButtonSounds();

        // 3. GSAP In-Animation: Grow, level, and fade in with an elegant elastic ease
        gsap.fromTo(appContainer, 
          {
            opacity: 0,
            scale: 1.05,
            rotationX: -10,
            transformPerspective: 800
          },
          {
            opacity: 1,
            scale: 1,
            rotationX: 0,
            duration: 0.5,
            ease: 'back.out(1.2)',
            clearProps: 'transform,rotationX,scale'
          }
        );

        this.currentScreenId = screenId;
      }
    });
  }

  /**
   * Update regional BGM dynamically based on current screen/location
   * @private
   */
  _updateRegionBgm(screenId) {
    if (screenId === SCREENS.MENU) {
      audioManager.playBgm('village');
    } else if (screenId === SCREENS.CREATION) {
      audioManager.playBgm('village');
    } else if (screenId === SCREENS.GAME) {
      // Get current active region to match background loop
      const currentRegion = gameState.get('currentRegion');
      
      if (currentRegion === 'bosque') audioManager.playBgm('forest');
      else if (currentRegion === 'cueva') audioManager.playBgm('cave');
      else if (currentRegion === 'montana') audioManager.playBgm('mountain');
      else if (currentRegion === 'castillo') audioManager.playBgm('castle');
      else audioManager.playBgm('village');
    } else if (screenId === SCREENS.COMBAT) {
      audioManager.playBgm('combat');
    } else if (screenId === SCREENS.DEATH) {
      audioManager.stopBgm();
      audioManager.playSfx('defeat');
    } else if (screenId === SCREENS.VICTORY) {
      audioManager.stopBgm();
      audioManager.playSfx('victory');
    }
  }

  /**
   * Bind hover/click SFX to all active buttons on the screen automatically
   * @private
   */
  _bindButtonSounds() {
    const buttons = document.querySelectorAll('.btn, button, .card-class, .btn-action');
    buttons.forEach(btn => {
      // Check if already bound
      if (btn.dataset.audioBound) return;
      btn.dataset.audioBound = 'true';

      btn.addEventListener('mouseenter', () => {
        if (!btn.disabled && !btn.classList.contains('disabled')) {
          audioManager.playSfx('hover', 0.2);
        }
      });
      btn.addEventListener('click', () => {
        if (!btn.disabled && !btn.classList.contains('disabled')) {
          audioManager.playSfx('click', 0.4);
        }
      });
    });
  }

  /**
   * Display a non-blocking toast overlay notification with GSAP sliding alerts
   * @param {string} message
   * @param {string} [type='info'] — success, error, info, gold
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';

    container.appendChild(toast);

    // Play specific trigger sfx
    if (type === 'gold') audioManager.playSfx('levelUp', 0.5);
    else if (type === 'success') audioManager.playSfx('coin', 0.45);
    else if (type === 'error') audioManager.playSfx('hurt', 0.35);
    else audioManager.playSfx('quest', 0.4);

    // GSAP Entrance
    gsap.to(toast, {
      opacity: 1,
      x: 0,
      duration: 0.4,
      ease: 'back.out(1.5)'
    });

    // GSAP Exit & cleanup
    gsap.to(toast, {
      opacity: 0,
      x: 80,
      duration: 0.35,
      delay: 2.65,
      ease: 'power2.in',
      onComplete: () => toast.remove()
    });
  }

  /**
   * Build the floating toast notification portal in body
   * @private
   */
  _initToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      document.body.appendChild(container);
    }
  }
}
