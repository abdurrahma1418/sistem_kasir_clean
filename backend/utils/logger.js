/**
 * TOKO BUKU AA - LOGGER UTILITIES
 * Logging system menggunakan Winston
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Add metadata if exists
        if (Object.keys(metadata).length > 0) {
            // Filter out winston internal properties
            const data = Object.keys(metadata)
                .filter(key => !key.startsWith('Symbol'))
                .reduce((obj, key) => {
                    obj[key] = metadata[key];
                    return obj;
                }, {});

            if (Object.keys(data).length > 0) {
                msg += ` ${JSON.stringify(data)}`;
            }
        }

        return msg;
    })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'toko-buku-aa',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

/**
 * Log request middleware
 */
function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });

    next();
}

/**
 * Database query logger
 */
function queryLogger(sql, params, duration) {
    logger.debug('Database Query', {
        sql: sql.replace(/\s+/g, ' ').trim(),
        params,
        duration: `${duration}ms`
    });
}

module.exports = logger;
module.exports.requestLogger = requestLogger;
module.exports.queryLogger = queryLogger;
