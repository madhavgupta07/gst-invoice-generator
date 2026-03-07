const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    hsnCode: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'PCS' },
    rate: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, required: true, default: 18 },
    amount: { type: Number, required: true },
});

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    seller: { type: addressSchema, required: true },
    buyer: { type: addressSchema, required: true },
    consignee: { type: addressSchema, required: false }, // Ship To

    // Tally Specific Metadata Fields
    eWayBillNo: { type: String, default: '' },
    referenceNo: { type: String, default: '' },
    referenceDate: { type: String, default: '' },
    otherReferences: { type: String, default: '' },
    buyersOrderNo: { type: String, default: '' },
    buyersOrderDate: { type: String, default: '' },
    dispatchDocNo: { type: String, default: '' },
    deliveryNoteDate: { type: String, default: '' },
    dispatchedThrough: { type: String, default: '' },
    destination: { type: String, default: '' },
    billOfLading: { type: String, default: '' },
    motorVehicleNo: { type: String, default: '' },
    termsOfDelivery: { type: String, default: '' },

    dispatchDetails: { type: String, default: '' }, // Keep for backwards compatibility
    products: [productSchema],
    subtotal: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalTax: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, default: '' },
    isInterstate: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
    pdfUrl: { type: String, default: '' },
}, { timestamps: true });

invoiceSchema.index({ 'buyer.name': 'text', invoiceNumber: 'text' });
invoiceSchema.index({ invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);