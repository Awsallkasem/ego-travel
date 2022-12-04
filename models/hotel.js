const mongoose = require('mongoose');
const Joi = require('joi');
const time = require('time-stamp');
const { existenceSchema } = require('./existence.js');

const hotelschema = new mongoose.Schema({
    hotel_name: {
        type: String,
        required: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
    },
     country_city: {
        type: existenceSchema,
        required: true

    }, 
    location: {
        type: {
            type: String,
            required:true,
            default: 'point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
     photo: {
        type: [String],
    }, 
    client_id:{
        type:String,
        required:true
    },
    client_secret:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true,
        minlength:1,
        max:7
         
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    description:{
        type:String,
        required:true,

    },
    single_room:{
        type:Number,
        required:true
    },
    family_room:{
        type:Number,
    },
    price_family:{
        type:Number,
        required:true
    },
    price_single:{
        type:Number,
        required:true
    }

});
const Hotel = mongoose.model('hotel', hotelschema);

function hotelvalidation(hotel) {
    const schema = Joi.object({
        hotel_name: Joi.string().min(3).required(),
        email: Joi.string().required().email(),
        description:Joi.string().required(),
        extId:Joi.string().required(),
        longitude: Joi.number().required(),
        photo: Joi.array().required(),
        latitudes: Joi.number().required(),
        family_room:Joi.number().required(),
        client_id:Joi.string().required(),
        client_secret:Joi.string().required(),
        single_room:Joi.number().required(),
        rating:Joi.number().max(7).min(1).required(),
        price_single:Joi.number().min(0).required(),
        price_family:Joi.number().min(0).required(),
    });
    return schema.validate(hotel);
}

module.exports.Hotel = Hotel;
module.exports.hotelvalidation = hotelvalidation;