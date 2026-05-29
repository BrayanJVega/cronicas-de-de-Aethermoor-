/**
 * EventBus.js — Publish/Subscribe event system
 * Decouples all game modules via events instead of direct references
 * 
 * Usage:
 *   import { eventBus } from './EventBus.js';
 *   eventBus.on('combat:start', handler);
 *   eventBus.emit('combat:start', { enemy });
 */

import logger from '../utils/logger.js';

class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();

    /** @type {Map<string, Set<Function>>} */
    this._onceListeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event — event name
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      logger.error(`EventBus.on: callback for "${event}" is not a function`);
      return () => {};
    }

    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event — fires only once
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    if (!this._onceListeners.has(event)) {
      this._onceListeners.set(event, new Set());
    }
    this._onceListeners.get(event).add(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
    this._onceListeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event
   * @param {*} data — payload
   */
  emit(event, data = null) {
    logger.debug(`Event: ${event}`, data ? JSON.stringify(data).substring(0, 100) : '');

    // Regular listeners
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(data);
        } catch (err) {
          logger.error(`EventBus: error in listener for "${event}":`, err.message);
        }
      }
    }

    // Once listeners
    const onceListeners = this._onceListeners.get(event);
    if (onceListeners) {
      for (const cb of onceListeners) {
        try {
          cb(data);
        } catch (err) {
          logger.error(`EventBus: error in once-listener for "${event}":`, err.message);
        }
      }
      this._onceListeners.delete(event);
    }
  }

  /**
   * Remove all listeners (for cleanup/testing)
   */
  clear() {
    this._listeners.clear();
    this._onceListeners.clear();
    logger.debug('EventBus: all listeners cleared');
  }
}

// Singleton export
export const eventBus = new EventBus();
