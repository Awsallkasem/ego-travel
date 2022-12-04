const mongoose = require('mongoose');
const Joi = require('joi');

const blockSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'trip'
    },
    isVip: {
        type: Boolean,
        required: true
    },
    seat: {
        type: Number,
        required: true
    },
    isPay: {
        type: Boolean,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    }
});
const Block = mongoose.model('block', blockSchema);

function validateBlockTrip(block) {
    const Schema = Joi.object({
        isVip: Joi.boolean().required(),
        quantity: Joi.number().min(1).required(),

    });
    return Schema.validate(block);

}
module.exports.validateBlockTrip = validateBlockTrip;
module.exports.Block = Block;