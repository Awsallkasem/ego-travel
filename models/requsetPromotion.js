const mongoose = require('mongoose');
const Joi = require('joi');


const requestPromotionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    proofs: {
        type: [String],
        required: true
    },
    promotion: {
        type: String,
        enum: ['Company', 'Hotel']
    },
    accepted: {
        type: Boolean,
        default: false
    },
    isPay: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        required: true
    },
    reviewed: {
        type: Boolean,
        default: false
    }
});
const RequestPromotion = mongoose.model('request', requestPromotionSchema);

function requestPromotionValidate(request) {
    const Schema = Joi.object({
        proofs: Joi.array().min(1).required(),
        promotion: Joi.string().required()
    });
    return Schema.validate(request);
}

module.exports.requestPromotionValidate = requestPromotionValidate;
module.exports.RequestPromotion = RequestPromotion;