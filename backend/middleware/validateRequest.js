/**
 * TOKO BUKU AA - REQUEST VALIDATION MIDDLEWARE
 * Validasi request body menggunakan Joi
 */

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

/**
 * Validation schemas
 */
const schemas = {
    // Book schemas
    createBook: Joi.object({
        kode_barang: Joi.string().required().max(50).example('B001'),
        nama: Joi.string().required().max(255).example('Laskar Pelangi'),
        harga: Joi.number().positive().required().example(95000),
        stok: Joi.number().integer().min(0).optional().default(0).example(25)
    }),

    updateBook: Joi.object({
        kode_barang: Joi.string().max(50).optional(),
        nama: Joi.string().max(255).optional(),
        harga: Joi.number().positive().optional(),
        stok: Joi.number().integer().min(0).optional()
    }).min(1),

    // Transaction schemas
    createTransaction: Joi.object({
        items: Joi.array().items(
            Joi.object({
                id: Joi.number().integer().positive().required(),
                quantity: Joi.number().integer().positive().required(),
                harga: Joi.number().positive().optional()
            })
        ).min(1).required(),

        metode_pembayaran: Joi.string()
            .valid('cash', 'card', 'qris', 'transfer')
            .required()
            .example('cash'),

        uang_diterima: Joi.number()
            .when('metode_pembayaran', {
                is: 'cash',
                then: Joi.number().min(0).required()
            })
            .otherwise(Joi.number().min(0).optional()),

        diskon: Joi.number().min(0).optional().default(0).example(0),
        nama_kasir: Joi.string().max(100).optional().example('Admin')
    }),

    checkStock: Joi.object({
        items: Joi.array().items(
            Joi.object({
                id: Joi.number().integer().positive().required(),
                qty: Joi.number().integer().positive().required()
            })
        ).min(1).required()
    }),

    // Query parameter schemas
    queryPagination: Joi.object({
        limit: Joi.number().integer().min(1).max(100).optional(),
        offset: Joi.number().integer().min(0).optional()
    }),

    queryDateRange: Joi.object({
        tanggal_mulai: Joi.date().iso().optional(),
        tanggal_selesai: Joi.date().iso().optional().min(Joi.ref('tanggal_mulai'))
    }),

    querySearch: Joi.object({
        search: Joi.string().max(100).optional(),
        kategori: Joi.string().max(50).optional()
    })
};

/**
 * Validation middleware factory
 */
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            throw new ValidationError(
                'Validasi gagal',
                details
            );
        }

        // Replace req.body with sanitized value
        req.body = value;
        next();
    };
}

/**
 * Validate query parameters
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            throw new ValidationError(
                'Query parameter tidak valid',
                details
            );
        }

        req.query = value;
        next();
    };
}

/**
 * Validate route parameters
 */
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            throw new ValidationError('Parameter tidak valid');
        }

        req.params = value;
        next();
    };
}

module.exports = {
    validate,
    validateQuery,
    validateParams,
    schemas
};
