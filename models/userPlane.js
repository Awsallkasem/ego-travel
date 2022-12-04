const mongoose = require('mongoose');
const Joi = require('joi');
const { PlacesSchema } = require('./places');
const { existenceSchema } = require('./existence');

const Plane = mongoose.model('userPlane', new mongoose.Schema({
    planeName: {
        type: String,
        required: true
    },
    planeDetails: {
        type: [new mongoose.Schema({
            to: {
                type: PlacesSchema,
                required: true
            },
            durationFrom: {
                type: Date,
                required: true,
                //match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/

            },
            durationTo: {
                type: Date,
                required: true,
                //              match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/
            },

        })]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }

}));

function planeValidation(plane) {
    const schema = Joi.object({
        planeName: Joi.string().min(2).required(),
        to: Joi.string().required(),
        durationFrom: Joi.string().required(),
        durationTo: Joi.string().required(),
    });
    return schema.validate(plane);

}

module.exports.Plane = Plane;
module.exports.planeValidation = planeValidation;