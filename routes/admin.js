require('express-async-errors');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { User } = require('../models/user');
const { adminValidate, Admin } = require('../models/admin');
const Joi = require('joi');
const { Place, placesValidate } = require('../models/places');
const { Existence, existenceValidate } = require('../models/existence');
const fs = require('fs');
const { RequestPromotion } = require('../models/requsetPromotion');
const _ = require('lodash');


router.get('/showRequests', [auth, isAdmin], async(req, res) => {
    const reqe = await RequestPromotion.find({ isPay: true, reviewed: false });
    if (_.isEmpty(reqe)) return res.status(404).json('didnot found');
    return res.status(200).json(reqe);
});


router.get('/showOneRequest/:id', [auth, isAdmin], async(req, res) => {
    const reqe = await RequestPromotion.findById(req.params.id);
    if (!reqe) return res.status(404).json('didnot found');
    return res.status(200).json(reqe);
});

router.post('/changePermissions/:id', [auth, isAdmin], async(req, res) => {
    let reqe = await RequestPromotion.findById(req.params.id);
    if (!reqe) return res.status(404).json('didnot found');

    let user = await User.findById(reqe.userId);
    if (!user) return res.status(404).json('didnot found');
    if (req.body.accepted); {
        if (reqe.promotion == 'Company') {

            user.role = 'Company';
        }

        if (reqe.promotion == 'Hotel') {

            user.role = 'Hotel';
        }

        reqe.accepted = true;
    }
    reqe.reviewed = true;
    user = await user.save();
    reqe = await reqe.save();

    return res.status(200).json('promotion changed successfully');

});
router.post('/addExistence', [auth, isAdmin], async(req, res) => {
    const { error } = existenceValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let existence = new Existence({
        city: req.body.city,
        country: req.body.country
    });
    existence = await existence.save();
    return res.status(200).json(existence);

});
router.post('/addplaces', [auth, isAdmin], async(req, res) => {
    const { error } = placesValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);
    const pathMiniPic = `${Math.random().toString(36).substring(2, 15)}.jpg`;

    const miniPic = fs.writeFile(`public/${pathMiniPic}`, req.body.miniPic, { encoding: 'base64' }, function(err) {
        if (err) {
            return res.status(500).json('failed');
        }
    });
    let existence = await Existence.findById(req.body.existenceId);
    if (!existence) return res.status(404).json(' existence  didint found');

    let place = new Place({
        name: req.body.name,
        country_city: {
            country: existence.country,
            city: existence.city,
        },

        category: req.body.category,
        location: { coordinates: [req.body.longitude, req.body.latitudes] },
        miniPic: pathMiniPic
    });
    if (req.body.photo) {
        req.body.photo.forEach((element) => {

            const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;
            const image = fs.writeFile(`public/${path}`, element, { encoding: 'base64' }, function(err) {
                if (err) {
                    return res.status(500).json('failed');
                }
            });
            place.photo.push(path);
        });
    }
    place = await place.save();
    return res.status(200).json(place);

});


router.post('/information', [auth, isAdmin], async(req, res) => {
    const informations = await Admin.find().count();
    if (informations > 0) return res.status(400).json('please update current doc');
    const { error } = adminValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let information = new Admin({
        client_secret: req.body.client_secret,
        client_id: req.body.client_id,
        hotelPrice: req.body.hotelPrice,
        companyPrice: req.body.companyPrice
    });

    information = await information.save();
    return res.status(200).json(information);

});

router.put('/updateInfo/:id', [auth, isAdmin], async(req, res) => {

    let information = await Admin.findById(req.params.id);
    if (!information) return res.status(404).json(information);
    if (req.body.client_secret) information.client_secret = req.body.client_secret;
    if (req.body.client_id) information.client_id = req.body.client_id;
    if (req.body.hotelPrice) information.hotelPrice = req.body.hotelPrice;
    if (req.body.companyPrice) information.companyPrice = req.body.companyPrice;
    information = await information.save();
    return res.status(200).json(information);

});



module.exports = router;