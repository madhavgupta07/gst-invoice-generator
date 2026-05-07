const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getReceivers, deleteReceiver } = require('../controllers/receiverController');

router.use(protect);

router.get('/', getReceivers);
router.delete('/:id', deleteReceiver);

module.exports = router;
