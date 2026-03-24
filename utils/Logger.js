/**
 * Grit Centralized Logger
 * Provides structured logging for debugging and monitoring.
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

// Set this to DEBUG for dev, WARN or ERROR for production
const CURRENT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

const log = (level, tag, message, data = null) => {
    if (LOG_LEVELS[level] < CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${tag}]: ${message}`;

    switch (level) {
        case 'DEBUG':
            console.log(logMessage, data || '');
            break;
        case 'INFO':
            console.info(logMessage, data || '');
            break;
        case 'WARN':
            console.warn(logMessage, data || '');
            break;
        case 'ERROR':
            console.error(logMessage, data || '');
            // In a real production app, you might send this to Sentry or another monitoring tool.
            break;
    }
};

export const Logger = {
    debug: (tag, message, data) => log('DEBUG', tag, message, data),
    info: (tag, message, data) => log('INFO', tag, message, data),
    warn: (tag, message, data) => log('WARN', tag, message, data),
    error: (tag, message, data) => log('ERROR', tag, message, data),
};
