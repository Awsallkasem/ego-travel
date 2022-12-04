const mongoose = require('mongoose');
const Joi = require('joi');

const existenceSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    }
});
const Existence = mongoose.model('existence', existenceSchema);

function existenceValidate(existence) {
    const schema = Joi.object({
        city: Joi.string().required(),
        country: Joi.string().required()
    });
    return schema.validate(existence);
}
module.exports.existenceSchema = existenceSchema;
module.exports.Existence = Existence;
module.exports.existenceValidate = existenceValidate;