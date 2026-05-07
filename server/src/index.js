require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/invoices', invoiceRoutes);

// GST verify route alias
const ic = require('./controllers/invoiceController');
app.post('/api/gst/verify', ic.verifyGST);
app.get('/api/gst/captcha', ic.fetchGSTCaptcha);
app.post('/api/gst/verify-captcha', ic.verifyGSTWithCaptcha);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
