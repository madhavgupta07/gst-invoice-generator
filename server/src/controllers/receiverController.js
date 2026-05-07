const Receiver = require('../models/Receiver');

// GET /api/receivers?search=
async function getReceivers(req, res, next) {
    try {
        const filter = { userId: req.user.id };
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { gstin: { $regex: req.query.search, $options: 'i' } },
            ];
        }
        const receivers = await Receiver.find(filter).sort({ updatedAt: -1 }).limit(50);
        res.json(receivers);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/receivers/:id
async function deleteReceiver(req, res, next) {
    try {
        const receiver = await Receiver.findOne({ _id: req.params.id, userId: req.user.id });
        if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
        await Receiver.findByIdAndDelete(req.params.id);
        res.json({ message: 'Receiver deleted successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * Upsert a receiver from invoice buyer data. Called internally from invoice controller.
 */
async function upsertReceiver(userId, buyerData) {
    if (!buyerData || !buyerData.name) return;
    try {
        const filter = { userId };
        // Match by GSTIN if available, otherwise by name
        if (buyerData.gstin) {
            filter.gstin = buyerData.gstin;
        } else {
            filter.name = buyerData.name;
        }

        await Receiver.findOneAndUpdate(
            filter,
            {
                userId,
                name: buyerData.name,
                address: buyerData.address || '',
                gstin: buyerData.gstin || '',
                state: buyerData.state || '',
                stateCode: buyerData.stateCode || '',
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        // Silently fail — receiver save is best-effort
        console.error('Receiver upsert error:', error.message);
    }
}

module.exports = { getReceivers, deleteReceiver, upsertReceiver };
