const mongoose = require('mongoose');
const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 1024
    },

    email: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ['User', 'Admin', 'Company', 'Hotel'],
        'default': 'User'
    },
    profile: {
        type: String,
    },
    playerId: {
        type: String,
        required: true
    }
});
userSchema.methods.genretauthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role }, config.get('jwtPrivateKey'));
    return token;
}


const User = mongoose.model('user', userSchema);

function validateUser(user) {

    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().min(3).required().email(),
        password: Joi.string().min(3).max(255).required(),
        playerId: Joi.string().required(),

    });
    return schema.validate(user);
}


exports.User = User;
exports.validate = validateUser;
exports.userSchema = userSchema;