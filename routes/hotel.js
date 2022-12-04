const mongoose = require('mongoose');
const paypal = require('paypal-rest-sdk');
const express = require('express');
const { Bocking, bockingvalidation } = require('../models/pockingHotel');
const isHotel = require('../middleware/isHotel');
const fs = require('fs');
const Fawn = require('fawn');
const _ = require('lodash');
const { RequestPromotion } = require('../models/requsetPromotion');
const router = express.Router();
const { Hotel, hotelvalidation } = require('../models/hotel');
const { Trip, tripValidate } = require('../models/trips');
const { Branch, branchValidate } = require('../models/branch');
const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const isAdmin = require('../middleware/isAdmin');
const { Existence } = require('../models/existence');
const time = require('time-stamp');
const Joi = require('joi');
const { User } = require('../models/user');
const { date } = require('joi');
const { Console } = require('console');

router.post('/pay/:id', [auth], async(req, res) => {

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
        return res.send("sorry but the hotel not exist");
    }
    const user = await User({ _id: req.user._id });

    paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': hotel.client_id,
        'client_secret': hotel.client_secret
    });
    const { error } = payvalidation(req.body);
    if (error) {
        return res.send(error.details[0].message);
    }

    if (req.body.type_of_room === 'single_room' && (hotel.single_room == 0) && (hotel.single_room - req.body.num_of_bocking < 0))
        return res.send("sorry but there is no room for bocking")

    if (req.body.type_of_room === 'single_room' && (hotel.single_room > 0) && (hotel.single_room - req.body.num_of_bocking > 0)) {
        var price_one = hotel.price_single;
    }

    if (req.body.type_of_room === 'family_room' && (hotel.family_room > 0) && (hotel.single_room - req.body.num_of_bocking > 0)) {
        var price_one = hotel.price_family;
    }
    if (req.body.type_of_room === 'single_room' && (hotel.family_room == 0) && (hotel.single_room - req.body.num_of_bocking < 0))
        return res.send("sorry but there is no room for bocking")



    const { er } = bockingvalidation(req.body);
    if (error) return res.status(400).json(error.details[0].message);
    let durationfrom = new Date(req.body.durationFrom);
    let durationto = new Date(req.body.durationTo);
    var defirent = (durationto.getTime() - durationfrom.getTime());
    var def = defirent / (1000 * 3600 * 24);
    var days = def * (req.body.num_of_bocking);
    var all = price_one * days;
    let bocking = new Bocking({
        hotel_id: req.params.id,
        user_id: req.user._id,
        total_price: all,
        num_of_day: def,
        num_of_room: req.body.num_of_bocking,
        durationFrom: durationfrom, // durationfrom.toLocaleDateString("en-GB"),
        durationTo: durationto, //durationto.toLocaleDateString("en-GB"),
        user_name: req.body.name,
        type_of_room: req.body.type_of_room
    });


    bocking = await bocking.save();

    const port = process.env.PORT || 8000;
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `http://192.168.43.2:${port}/api/hotel/success/${req.params.id}/${user._id}`,
            "cancel_url": "http://cancel.url"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "item",
                    "sku": "item",
                    "price": price_one,
                    "currency": "USD",
                    "quantity": days
                }]
            },
            "amount": {
                "currency": "USD",
                "total": all
            },
            "description": "This is the payment description."
        }]
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            throw error;
        } else {
            //console.log("Create Payment Response");
            // console.log(payment);
            for (var index = 0; index < payment.links.length; index++) {
                //Redirect user to this endpoint for redirect url
                if (payment.links[index].rel === 'approval_url') {
                    return res.json(payment.links[index].href);
                }
            }
            //   console.log(payment);


        }


    });

});
router.get('/succes:id/:user_id', async(req, res) => {

    const pocking = await Bocking.find({ user_id: req.params.user_id, hotel_id: req.params.id });
    var execute_payment_json = {
        "payer_id": req.query.PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": all
            }
        }]
    };

    var paymentId = req.query.paymentId;

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            //console.log("Get Payment Response");
            // console.log(JSON.stringify(payment));

            const done = pocking.isbocking = true
            done.save();
        }
    });



});

router.post('/addhotel', [auth, isHotel], async(req, res) => {
    const user = await Hotel.findOne({ owner: req.user._id });
    if (user) return res.status(403).json('sorry you cannt add tow hotel ');
    const { error } = hotelvalidation(req.body);
    if (error) return res.status(400).json(error.details[0].message);
    const existence = await Existence.findById(req.body.extId);
    if (!existence) return res.status(404).json('the location is not found');

    const end = new Date(Date.now());
    end.setFullYear(end.getFullYear() + 1);

    let hotel = new Hotel({
        hotel_name: req.body.hotel_name,
        email: req.body.email,
        price_single: req.body.price_single,
        price_family: req.body.price_family,
        description: req.body.description,
        single_room: req.body.single_room,
        family_room: req.body.family_room,
        rating: req.body.rating,
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
        country_city: {
            country: existence.country,
            city: existence.city,
        },
        owner: req.user._id,
        location: { coordinates: [req.body.longitude, req.body.latitudes] },
    });
    if (req.body.photo) {
        req.body.photo.forEach((element) => {

            const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;
            const image = fs.writeFile(`public/${path}`, element, { encoding: 'base64' }, function(err) {
                if (err) {
                    return res.status(500).json('failed');
                }
            });
            hotel.photo.push(path);
        });
    }
    hotel = await hotel.save();

    return res.status(200).json(hotel);
});


router.post('/showhotel', auth, async(req, res) => {
    if (!(req.body.name || req.body.to))
        return res.status(400).json('enter filtter to your search')

    if (req.body.to) {
        let result = [];
        let hotel = await Hotel.find();
        hotel.forEach(element => {
            const reg = new RegExp('.*' + req.body.city + '.*', 'i');
            if (element.country_city.country.match(req.body.to) || element.country_city.match(req.body.to))
                result.push(element);

        });
        if (result.length == 0) return res.status(404).json('not found');
        return res.status(200).json(result);

    }
    if (req.body.name) {
        hotel = await Hotel.find({ hotel_name: new RegExp('.*' + req.body.name + '.*', 'i') });
        if (_.isEmpty(hotel)) return res.status(404).json('not found');

        return res.status(200).json(hotel);
    }



});
router.get('/showonehotel/:id', auth, async(req, res) => {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) return res.status(404).json('Not found');
    return res.status(200).json(hotel);
});

router.delete('/delethotel/:id', auth, async(req, res) => {
    let hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json('not found');
    if (req.user._id != hotel.owner && req.user.role != 'Admin') {
        return res.status(403).json('you don`t have a permission');
    }
    hotel = await Hotel.findByIdAndRemove(req.params.id);
    return res.status(200).json('deleted successfully');
});

router.put('/updatehotel/:id', auth, async(req, res) => {

    var hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json('the hotel not found');

    if (req.user._id != hotel.owner && req.user.role != 'Admin') {
        return res.status(403).json('you don`t have access');
    } else {

        if (req.body.hotel_name) hotel.hotel_name = req.body.hotel_name;
        if (req.body.email) hotel.email = req.body.email;
        if (req.body.price_single) hotel.price_single = req.body.price_single;
        if (req.body.price_family) hotel.price_family = req.body.price_family;
        if (req.body.description) hotel.description = req.body.description;
        if (req.body.client_id) hotel.client_id = req.body.client_id;
        if (req.body.client_secret) hotel.client_secret = req.body.client_secret;
        if (req.body.rating < 8 && req.body.rating > 0)
            hotel.rating = req.body.rating;
        else return res.send("You cannot rate a hotel for more than 7 or less than 1")
        if (req.body.family_room) hotel.family_room = req.body.family_room;
        if (req.body.single_room) hotel.single_room = req.body.single_room;
        const newhotel = await hotel.save();
        return res.send("updated");
    }


});

function payvalidation(pay) {
    const schema = Joi.object({
        type_of_room: Joi.string().required(),
        num_of_bocking: Joi.number().required(),
        durationFrom: Joi.string().required(),
        name: Joi.string().required(),
        durationTo: Joi.string().required(),
    });
    return schema.validate(pay);
}
module.exports = router;