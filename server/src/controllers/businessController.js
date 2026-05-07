const Business = require('../models/Business');

// GET /api/businesses
async function getBusinesses(req, res, next) {
    try {
        const businesses = await Business.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
        res.json(businesses);
    } catch (error) {
        next(error);
    }
}

// POST /api/businesses
async function createBusiness(req, res, next) {
    try {
        const { name, address, gstin, state, stateCode } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Business name is required' });
        }

        // If this is the first business, make it default
        const count = await Business.countDocuments({ userId: req.user.id });
        const isDefault = count === 0;

        const business = await Business.create({
            userId: req.user.id,
            name: name.trim(),
            address: address || '',
            gstin: gstin || '',
            state: state || '',
            stateCode: stateCode || '',
            isDefault,
        });

        res.status(201).json(business);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A business with this GSTIN already exists' });
        }
        next(error);
    }
}

// PUT /api/businesses/:id
async function updateBusiness(req, res, next) {
    try {
        const business = await Business.findOne({ _id: req.params.id, userId: req.user.id });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        const { name, address, gstin, state, stateCode } = req.body;
        if (name !== undefined) business.name = name.trim();
        if (address !== undefined) business.address = address;
        if (gstin !== undefined) business.gstin = gstin;
        if (state !== undefined) business.state = state;
        if (stateCode !== undefined) business.stateCode = stateCode;

        await business.save();
        res.json(business);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A business with this GSTIN already exists' });
        }
        next(error);
    }
}

// DELETE /api/businesses/:id
async function deleteBusiness(req, res, next) {
    try {
        const business = await Business.findOne({ _id: req.params.id, userId: req.user.id });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        const wasDefault = business.isDefault;
        await Business.findByIdAndDelete(req.params.id);

        // If deleted business was default, make the next one default
        if (wasDefault) {
            const next = await Business.findOne({ userId: req.user.id }).sort({ createdAt: 1 });
            if (next) {
                next.isDefault = true;
                await next.save();
            }
        }

        res.json({ message: 'Business deleted successfully' });
    } catch (error) {
        next(error);
    }
}

// PUT /api/businesses/:id/default
async function setDefault(req, res, next) {
    try {
        const business = await Business.findOne({ _id: req.params.id, userId: req.user.id });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        // Unset all defaults for this user
        await Business.updateMany({ userId: req.user.id }, { isDefault: false });

        business.isDefault = true;
        await business.save();

        res.json(business);
    } catch (error) {
        next(error);
    }
}

module.exports = { getBusinesses, createBusiness, updateBusiness, deleteBusiness, setDefault };
