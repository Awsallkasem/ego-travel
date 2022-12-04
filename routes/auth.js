const { User, validate } = require('../models/user');
const { Reset, validateRest } = require('../models/resetPassword');
const mongoose = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const express = require('express');
const _ = require('lodash');
const nodemailer = require('nodemailer');
const router = express.Router();
const config = require('config');
const fs = require('fs');


router.post('/register', async(req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).json('user already register');

    user = new User({
        name: req.body.name,
        email: req.body.email,
        playerId: req.body.playerId
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);



    user = await user.save();
    res.status(200).json(_.pick(user, ['_id', 'name', 'email']));
});



router.put('/uploadProfile/:id', async(req, res) => {
    if (!req.body.profile) {
        return res.status(400).json('send profile photo');
    }
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json('user did not found');

    const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;

    const image = fs.writeFile(`public/${path}`, req.body.profile, { encoding: 'base64' }, function(err) {
        if (err) {
            console.log(err);
        }

    });
    user.profile = path;
    user = await user.save();

    const token = user.genretauthToken();
    res.header('x-jwt', token).status(200).json(_.pick(user, ['_id', 'name', 'email', 'profile']));

});



router.post('/login', async(req, res) => {

    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json('email or password invaild');
    const validatePassword = await bcrypt.compare(req.body.password, user.password);

    if (!validatePassword) return res.status(400).json('email or password invaild');
    const token = user.genretauthToken();
    res.header('x-jwt', token).status(200).json(_.pick(user, ['_id', 'name', 'email', 'profile']));
});



router.post('/resetpassword', async(req, res) => {
    const { error } = validateRest(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json('user is not exist');

    var transporter = nodemailer.createTransport({

        service: 'gmail',
        auth: {
            user: 'egotraveler@gmail.com',
            pass: 'egotraveler882001'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    var randomCode = Math.floor(Math.random() * 1000000);


    var mailOptions = {
        from: 'egotraveler',
        to: req.body.email,
        subject: 'Hello',
        text: 'hello ',
        html: " Hello " + randomCode + " this is code fore config your password ",
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return console.log(error);
        }

        console.log('Message sent: ' + info.response);
    });

    let reset = await Reset.findOne({ email: req.body.email });
    if (!reset) {
        reset = new Reset({
            email: req.body.email,
            code: randomCode
        });

    } else {
        reset.email = req.body.email;
        reset.vaild = false;
    }
    reset = await reset.save();
    res.status(200).json('code send successfully');

});


router.put('validateCode/:email', async(req, res, next) => {

    let reset = await Reset.findOne({ email: req.params.email });
    if (!reset) { return res.status(404).json('email not found'); }

    if (!(reset.code == req.body.code)) {
        return res.status(401).json('code is invaild');
    }

    reset.vaild = true;
    reset = await reset.save();

    res.status(200).json('vaild code');
});


router.put('/resetpassword/:email', async(req, res, next) => {
    const { error } = validatePassword(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let reset = await Reset.findOne({ email: req.params.email });
    if (!reset) { return res.status(404).json('email not found'); }

    if (!reset.validate) return res.status(403).json('please enter the code ');

    let user = await User.findOne({ email: req.params.email });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    const token = user.genretauthToken();
    user = await user.save();

    res.header('x-jwt', token).status(200).json('password reset successfully');
});


function validateLogin(req) {
    const schema = Joi.object({
        email: Joi.string().min(3).required().email(),
        password: Joi.string().min(3).max(255).required()
    });
    return schema.validate(req);
}

function validatePassword(req) {
    const schema = Joi.object({
        password: Joi.string().min(3).max(255).required()
    });
    return schema.validate(req);
}

module.exports = router;