/**
 * TOKO BUKU AA - RESPONSE UTILITIES
 * Standardized API response helpers
 */

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @param {String} message - Optional message
 */
function successResponse(res, { data, message, meta }, statusCode = 200) {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString()
    };

    if (message) {
        response.message = message;
    }

    if (meta) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
}

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 */
function errorResponse(res, message, statusCode = 500, details = null) {
    const response = {
        success: false,
        error: {
            message
        },
        timestamp: new Date().toISOString()
    };

    if (details) {
        response.error.details = details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && details instanceof Error) {
        response.error.stack = details.stack;
    }

    return res.status(statusCode).json(response);
}

/**
 * Paginated response helper
 */
function paginatedResponse(res, { data, total, page, limit, pages }) {
    return successResponse(res, {
        data,
        meta: {
            pagination: {
                total,
                page,
                limit,
                pages,
                has_next: page < pages,
                has_prev: page > 1
            }
        }
    });
}

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};
