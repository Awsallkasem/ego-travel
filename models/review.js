const mongoose = require('mongoose');
const Joi = require('joi');



const Review = mongoose.model('review', new mongoose.Schema({
    text: {
        type: String,
    },
    photo: {
        type: String,
    },
    from: {
        type: new mongoose.Schema({
            owner: {
                type: mongoose.Schema.Types.ObjectId
            },
            name: String,
            profile: String
        }),
        required: true
    },
    commentsOn: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}));

function reviewValidate(review) {
    const Schema = Joi.object({
        text: Joi.string(),
        photo: Joi.string()
    });
    return Schema.validate(review);
}

module.exports.Review = Review;
module.exports.reviewValidate = reviewValidate;