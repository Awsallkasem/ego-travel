const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const { User } = require('../models/user');

router.put('/update/:id', [auth, isOwner], async(req, res, next) => {
    const { error } = validateUpdate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let user = await User.findById(req.params.id);

    if (req.body.name) {
        user.name = req.body.name;
    }

    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
    }
    if (req.body.image) {
        const path = `${Math.random().toString(36).substring(2, 15)}`;
        const image = fs.writeFile(`public/${path}`, req.body.profile, { encoding: 'base64' }, function(err) {
            if (err) {
                console.log(err);
            }

        });
        user.profile = path;

    }

    if (req.body.email) {
        let isExiste = await User.findOne({ email: req.body.email });

        if (isExiste) {
            user = await user.save();
            return res.status(400).json('this email is already existe');
        }
        user.email = req.body.email;
    }
    user = await user.save();

    res.status(200).json(user);
});


function validateUpdate(user) {

    const schema = Joi.object({
        name: Joi.string().min(3),
        email: Joi.string().min(3).email(),
        password: Joi.string().min(3).max(255)
    });
    return schema.validate(user);
}


module.exports = router;