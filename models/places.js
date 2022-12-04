const mongoose_geojson_schema = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Joi = require('joi');
const { existenceSchema } = require('./existence');

const placeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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
    category: {
        type: String,
        required: true,
        enum: ['sports', 'Art&culture', 'adventure']
    },
    photo: {
        type: [String],
    },
    miniPic: {
        type: String,
        required: true
    },



});
const Place = mongoose.model('place', placeSchema);

function placesValidate(place) {
    const Schema = Joi.object({
        name: Joi.string().required().min(3),
        existenceId: Joi.string().required().min(3),
        category: Joi.string().required().min(3),
        longitude: Joi.number(),
        latitudes: Joi.number(),
        photo: Joi.array(),
        miniPic: Joi.string().required()
    });
    return Schema.validate(place);
}
module.exports.Place = Place;
module.exports.PlacesSchema = placeSchema;
module.exports.placesValidate = placesValidate;