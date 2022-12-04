const mongoose = require('mongoose');
const { Trip } = require('../models/trips');

module.exports = async(req, res, next) => {
    const now = new Date(Date.now());
    const trip = await Trip.deleteMany({ date: { $lt: now } });
    next();
};