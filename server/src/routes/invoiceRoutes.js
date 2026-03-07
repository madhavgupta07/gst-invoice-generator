const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    downloadPDF,
    verifyGST,
    fetchGSTCaptcha,
    verifyGSTWithCaptcha,
} = require('../controllers/invoiceController');

// All invoice routes are protected
router.use(protect);

// Invoice CRUD
router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

// PDF download
router.get('/:id/pdf', downloadPDF);

// GST Verification
router.post('/gst/verify', verifyGST);
router.get('/gst/captcha', fetchGSTCaptcha);
router.post('/gst/verify-captcha', verifyGSTWithCaptcha);

module.exports = router;
