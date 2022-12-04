const mongoose = require('mongoose');
const Joi = require('joi');
const { companySchema } = require('../models/company');
const { existenceSchema } = require('./existence');
const { default: timestamp } = require('time-stamp');
const { PlacesSchema } = require('./places');
const tripSchema = new mongoose.Schema({
    from: {
        type: existenceSchema,
        required: true
    },
    to: {
        type: existenceSchema,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'company',
        required: true
    },
    date: {
        type: Date,
        required: true,
        match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/

    },
    time: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    vipPrice: {
        type: Number,
        required: true
    },

    unreservedSeats: {
        type: Number,
        required: true,
        min: 0
    },
    vipUnreservedSeats: {
        type: Number,
        required: true,
        min: 0
    }

});

const Trip = mongoose.model('trip', tripSchema);

function tripValidate(trips) {
    const Schema = Joi.object({
        from: Joi.string().min(3).required(),
        to: Joi.string().min(3).required(),
        date: Joi.date().required(),
        time: Joi.string().required(),
        price: Joi.number().required(),
        vipPrice: Joi.number().required(),
        unreservedSeats: Joi.number().min(0).required(),
        vipUnreservedSeats: Joi.number().min(0).required()
    });
    return Schema.validate(trips);
};
module.exports.Trip = Trip;
module.exports.tripValidate = tripValidate;