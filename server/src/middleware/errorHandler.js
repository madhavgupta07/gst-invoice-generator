/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, _next) {
    console.error('Error:', err.message);
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: 'Validation Error', details: messages });
    }

    if (err.code === 11000) {
        return res.status(409).json({ error: 'Duplicate entry. This invoice number already exists.' });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format.' });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
}

module.exports = errorHandler;
