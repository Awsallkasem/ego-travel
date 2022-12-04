const mongoose = require('mongoose');
const { Bocking } = require('../models/pockingHotel');
const { Hotel } = require('../models/hotel');
const _ = require('lodash');

module.exports = async (req, res, next) => {

    let now = new Date(Date.now());
    const bocking = await Bocking.find({ durationFrom: { $lte: now }, isbocking: true });
    bocking.forEach(async (element) => {
        const hotel_id = element.hotel_id;
        const hotel = await Hotel.findById(hotel_id);
        if (element.type_of_room === 'single_room' && element.done === false) {
            hotel.single_room = hotel.single_room - element.num_of_room;
            element.done = true;
            await element.save();
            hotel.save();
        }
        hotel.family_room = hotel.family_room - element.num_of_room;
        element.done = true;
        await element.save();
        hotel.save();

    });

    next();


}