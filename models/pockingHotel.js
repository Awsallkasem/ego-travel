const Joi = require("joi");
const Hotel=require('../models/hotel');
const mongoose = require('mongoose');
const User=require('../models/user');
const { boolean } = require("joi");
const { stream } = require("winston");

const bockingschema = new mongoose.Schema({
    hotel_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
     user_name:{
        type:String,
        required:true
     },
     durationFrom:{
        type:Date,
        match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/
     },
     durationTo:{
        type:Date,
        match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/
     },
   
     isbocking:{
     type:Boolean,
     default:"false"
     },
     done:{
        type:Boolean,
        default:"false"
        },
     total_price:{
        type:Number,
        default:0
     },
     type_of_room:{
        type:String,
        required:true
        },
        num_of_day:{
            type:Number,
            required:true
        },
        num_of_room:{
            type:Number,
            required:true
        }


});
const Bocking = mongoose.model('bocking', bockingschema);

function bockingvalidation(bocking) {
    const schema = Joi.object({
        user_name:Joi.string().required(),
       type_of_room:Joi.string().required(),
        durationFrom:Joi.date().required(),
        durationTo:Joi.date().required(),
        num_of_day:Joi.number().required(),
        num_of_room:Joi.number().required()
        
        
    });
    return schema.validate(bocking);
}

module.exports.Bocking = Bocking;
module.exports.bockingvalidation = bockingvalidation;
