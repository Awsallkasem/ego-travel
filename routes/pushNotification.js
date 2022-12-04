const { send } = require('../pushNotification');
const express = require('express');
const router = express.Router();

router.post('/pushNotification', send);
module.exports = router;