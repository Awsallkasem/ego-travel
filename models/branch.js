const mongoose = require('mongoose');
const Joi = require('joi');
const { existenceSchema } = require('./existence');
const branchSchema = new mongoose.Schema({
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
        },

    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'company'
    }

});
const Branch = mongoose.model('branch', branchSchema);

function branchValidate(branch) {
    const schema = Joi.object({
        existenceId: Joi.string().required(),
        longitude: Joi.number(),
        latitudes: Joi.number(),
    });
    return schema.validate(branch);
}
module.exports.branchValidate = branchValidate;
module.exports.Branch = Branch;
module.exports.branchSchema = branchSchema;