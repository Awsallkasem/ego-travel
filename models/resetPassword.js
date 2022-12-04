const mongoose = require('mongoose');
const Joi = require('joi');

const resetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    code: {
        type: Number,
        required: true,
    },
    vaild: {
        type: Boolean,
        required: true,
        default: false
    },
});
const Reset = mongoose.model('reset_password', resetSchema);

function validateRest(data) {

    const schema = Joi.object({
        email: Joi.string().min(3).required().email(),
    });
    return schema.validate(data);
}
module.exports.Reset = Reset;
module.exports.validateRest = validateRest;