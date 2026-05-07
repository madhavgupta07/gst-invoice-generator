const mongoose = require('mongoose');

const receiverSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
}, { timestamps: true });

receiverSchema.index({ userId: 1 });
receiverSchema.index({ userId: 1, gstin: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Receiver', receiverSchema);
