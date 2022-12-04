const mongoose = require('mongoose');
const Joi = require('joi');
const time = require('time-stamp');
const { existenceSchema } = require('./existence.js');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    country_city: {
        type: existenceSchema,
        required: true

    },
    location: {
        type: {
            type: String,
            default: 'point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    profile: {
        type: String,
        required: true
    },


    start: {
        type: Date,
        default: new Date(Date.now()),
        match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/
    },
    end: {
        type: Date,
        required: true,
        match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/
    },
    client_id: {
        type: String,
        required: true
    },
    client_secret: {
        type: String,
        required: true
    }

});
const Company = mongoose.model('company', companySchema);

function companyValidate(company) {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().required().email(),
        extId: Joi.string().required(),
        longitude: Joi.number().required(),
        latitudes: Joi.number().required(),
        profile: Joi.string().required(),
        client_id: Joi.string().required(),
        client_secret: Joi.string().required(),
    });
    return schema.validate(company);
}

module.exports.Company = Company;
module.exports.companyValidate = companyValidate;
module.exports.companySchema = companySchema;