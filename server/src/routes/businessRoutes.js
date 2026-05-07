const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    setDefault,
} = require('../controllers/businessController');

router.use(protect);

router.get('/', getBusinesses);
router.post('/', createBusiness);
router.put('/:id', updateBusiness);
router.delete('/:id', deleteBusiness);
router.put('/:id/default', setDefault);

module.exports = router;
