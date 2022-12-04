const mongoose = require('mongoose');
const Joi = require('joi');

const adminSchema = new mongoose.Schema({
    client_id: {
        type: String,
        required: true
    },
    client_secret: {
        type: String,
        required: true
    },
    hotelPrice: {
        type: Number,
        required: true
    },
    companyPrice: {
        type: Number,
        required: true
    },
});
const Admin = mongoose.model('admin', adminSchema);

function adminValidate(request) {
    const Schema = Joi.object({

        client_secret: Joi.string().required(),
        client_id: Joi.string().required(),
        hotelPrice: Joi.number().min(0).required(),
        companyPrice: Joi.number().min(0).required()
    });
    return Schema.validate(request);
}

module.exports.adminValidate = adminValidate;
module.exports.Admin = Admin;