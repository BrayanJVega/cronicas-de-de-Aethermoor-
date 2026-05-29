/**
 * logger.js — Centralized logging and error handling
 * Provides debug, info, warn, error levels with timestamps
 */

const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
});

class Logger {
  constructor() {
    this.level = LOG_LEVELS.DEBUG;
    this.history = [];
    this.maxHistory = 200;
  }

  /**
   * Set minimum log level
   * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} levelName
   */
  setLevel(levelName) {
    this.level = LOG_LEVELS[levelName] ?? LOG_LEVELS.DEBUG;
  }

  /**
   * @private
   */
  _log(level, levelName, style, ...args) {
    if (level < this.level) return;

    const timestamp = new Date().toLocaleTimeString('es-ES');
    const prefix = `[${timestamp}] [${levelName}]`;

    // Store in history
    this.history.push({ timestamp, level: levelName, message: args.join(' ') });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Console output
    console.log(`%c${prefix}`, style, ...args);
  }

  debug(...args) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', 'color: #64748b', ...args);
  }

  info(...args) {
    this._log(LOG_LEVELS.INFO, 'INFO', 'color: #3b82f6; font-weight: bold', ...args);
  }

  warn(...args) {
    this._log(LOG_LEVELS.WARN, 'WARN', 'color: #f59e0b; font-weight: bold', ...args);
  }

  error(...args) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', 'color: #ef4444; font-weight: bold', ...args);
  }

  /**
   * Get full log history
   * @returns {Array}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear log history
   */
  clear() {
    this.history = [];
  }
}

// Singleton
const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught error:', event.message, 'at', event.filename, ':', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});

export default logger;
