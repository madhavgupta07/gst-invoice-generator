/**
 * Invoice Controller — handles all invoice CRUD and PDF operations.
 */

const Invoice = require('../models/Invoice');
const { calculateInvoice } = require('../services/gstService');
const { generateInvoicePDF } = require('../services/pdfService');
const { getCaptcha, verifyWithCaptcha, verifyGSTIN } = require('../services/gstVerify');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/invoices — Create a new invoice and generate PDF.
 */
async function createInvoice(req, res, next) {
    try {
        const { seller, buyer, consignee, products, invoiceNumber, invoiceDate, dispatchDetails,
            eWayBillNo, referenceNo, referenceDate, otherReferences, buyersOrderNo, buyersOrderDate,
            dispatchDocNo, deliveryNoteDate, dispatchedThrough, destination, billOfLading, motorVehicleNo, termsOfDelivery
        } = req.body;

        if (!seller || !buyer || !products || !products.length || !invoiceNumber) {
            return res.status(400).json({ error: 'Missing required fields: seller, buyer, products, invoiceNumber' });
        }

        // Calculate GST
        const taxResult = calculateInvoice(products, seller.stateCode, buyer.stateCode);

        // Build the invoice document
        const invoiceData = {
            userId: req.user.id,
            invoiceNumber,
            invoiceDate: invoiceDate || new Date(),
            seller,
            buyer,
            consignee,
            dispatchDetails: dispatchDetails || '',
            eWayBillNo: eWayBillNo || '',
            referenceNo: referenceNo || '',
            referenceDate: referenceDate || '',
            otherReferences: otherReferences || '',
            buyersOrderNo: buyersOrderNo || '',
            buyersOrderDate: buyersOrderDate || '',
            dispatchDocNo: dispatchDocNo || '',
            deliveryNoteDate: deliveryNoteDate || '',
            dispatchedThrough: dispatchedThrough || '',
            destination: destination || '',
            billOfLading: billOfLading || '',
            motorVehicleNo: motorVehicleNo || '',
            termsOfDelivery: termsOfDelivery || '',
            products: taxResult.products,
            subtotal: taxResult.subtotal,
            cgst: taxResult.cgst,
            sgst: taxResult.sgst,
            igst: taxResult.igst,
            totalTax: taxResult.totalTax,
            grandTotal: taxResult.grandTotal,
            isInterstate: taxResult.isInterstate,
            amountInWords: taxResult.amountInWords,
        };

        const invoice = await Invoice.create(invoiceData);

        // Generate PDF
        const pdfPath = await generateInvoicePDF(invoice);
        invoice.pdfUrl = `/api/invoices/${invoice._id}/pdf`;
        await invoice.save();

        res.status(201).json(invoice);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/invoices — List all invoices with optional search and filters.
 * Query params: search, status, startDate, endDate, page, limit
 */
async function getInvoices(req, res, next) {
    try {
        const { search, status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const filter = { userId: req.user.id };

        if (search) {
            filter.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'buyer.name': { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            filter.paymentStatus = status;
        }

        if (startDate || endDate) {
            filter.invoiceDate = {};
            if (startDate) filter.invoiceDate.$gte = new Date(startDate);
            if (endDate) filter.invoiceDate.$lte = new Date(endDate);
        }

        const total = await Invoice.countDocuments(filter);
        const invoices = await Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            invoices,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/invoices/:id — Get a single invoice.
 */
async function getInvoice(req, res, next) {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/invoices/:id — Update an invoice and regenerate PDF.
 */
async function updateInvoice(req, res, next) {
    try {
        const { seller, buyer, products, invoiceNumber, invoiceDate, dispatchDetails, paymentStatus } = req.body;

        const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        // Recalculate if products changed
        if (products && products.length > 0) {
            const sellerSC = (seller || invoice.seller).stateCode;
            const buyerSC = (buyer || invoice.buyer).stateCode;
            const taxResult = calculateInvoice(products, sellerSC, buyerSC);

            invoice.products = taxResult.products;
            invoice.subtotal = taxResult.subtotal;
            invoice.cgst = taxResult.cgst;
            invoice.sgst = taxResult.sgst;
            invoice.igst = taxResult.igst;
            invoice.totalTax = taxResult.totalTax;
            invoice.grandTotal = taxResult.grandTotal;
            invoice.isInterstate = taxResult.isInterstate;
            invoice.amountInWords = taxResult.amountInWords;
        }

        const updateFields = [
            'seller', 'buyer', 'consignee', 'invoiceNumber', 'invoiceDate', 'dispatchDetails', 'paymentStatus',
            'eWayBillNo', 'referenceNo', 'referenceDate', 'otherReferences', 'buyersOrderNo', 'buyersOrderDate',
            'dispatchDocNo', 'deliveryNoteDate', 'dispatchedThrough', 'destination', 'billOfLading', 'motorVehicleNo', 'termsOfDelivery'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                invoice[field] = req.body[field];
            }
        });

        await invoice.save();

        // Regenerate PDF
        await generateInvoicePDF(invoice);

        res.json(invoice);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/invoices/:id — Delete an invoice and its PDF.
 */
async function deleteInvoice(req, res, next) {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        // Delete PDF file
        const pdfFilename = `invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const pdfPath = path.join(__dirname, '../../invoices', pdfFilename);
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }

        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/invoices/:id/pdf — Download the invoice PDF.
 */
async function downloadPDF(req, res, next) {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const pdfFilename = `invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const pdfPath = path.join(__dirname, '../../invoices', pdfFilename);

        if (!fs.existsSync(pdfPath)) {
            // Regenerate if missing
            await generateInvoicePDF(invoice);
        }

        res.download(pdfPath, `invoice_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/gst/verify — Verify a GSTIN.
 */
async function verifyGST(req, res, next) {
    try {
        const { gstin } = req.body;
        if (!gstin || gstin.length !== 15) {
            return res.status(400).json({ error: 'Invalid GSTIN. Must be 15 characters.' });
        }
        const result = await verifyGSTIN(gstin);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/gst/captcha — Fetch a new CAPTCHA for GST portal verification
 */
async function fetchGSTCaptcha(req, res, next) {
    try {
        const result = await getCaptcha();
        if (result.error) {
            return res.status(500).json(result);
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/gst/verify-captcha — Verify GSTIN using solved CAPTCHA
 */
async function verifyGSTWithCaptcha(req, res, next) {
    try {
        const { sessionId, gstin, captcha } = req.body;
        if (!sessionId || !gstin || !captcha) {
            return res.status(400).json({ error: 'sessionId, gstin, and captcha are required' });
        }
        if (gstin.length !== 15) {
            return res.status(400).json({ error: 'Invalid GSTIN. Must be 15 characters.' });
        }

        const result = await verifyWithCaptcha(sessionId, gstin, captcha);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    downloadPDF,
    verifyGST,
    fetchGSTCaptcha,
    verifyGSTWithCaptcha,
};
