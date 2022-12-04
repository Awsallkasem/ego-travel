const express = require('express');
var paypal = require('paypal-rest-sdk');
const Joi = require('joi');
const fs = require('fs');
const _ = require('lodash');
const mongoose = require('mongoose');

const router = express.Router();
const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const { Company } = require('../models/company');
const { Place } = require('../models/places');
const { User } = require('../models/user');
const { reviewValidate, Review } = require('../models/review');
const { Existence } = require('../models/existence');
const { Plane, planeValidation } = require('../models/userPlane');
const { Trip } = require('../models/trips');
const { Block, validateBlockTrip } = require('../models/blocking');
const { date } = require('joi');

router.get('/showAllPlaces', auth, async(req, res) => {
    const place = await Place.find();

    if (!place) return res.status(404).json('Not found');

    res.status(200).json(place);
});
router.post('/showPlacesBy', auth, async(req, res) => {
    if (!(req.body.name || req.body.ext || req.body.category)) return res.status(400).json('enter filtter to your search')

    if (req.body.ext) {
        let result = [];
        let place = await Place.find();
        place.forEach(element => {

            if (element.country_city.country.match(req.body.ext) || element.country_city.match(req.body.ext))
                result.push(element);

        });
        if (result.length == 0) return res.status(404).json('dont found');
        return res.status(200).json(result);

    }
    if (req.body.name) {
        place = await Place.find({ name: new RegExp('.*' + req.body.name + '.*', 'i') });
        if (_.isEmpty(place)) res.status(404).json('not found');

        return res.status(200).json(place);
    }
    if (req.body.category) {
        place = await Place.find({ category: req.body.category });
        if (_.isEmpty(place)) res.status(404).json('not found');
        return res.status(200).json(place);
    }


});
router.get('/showOnePlace/:id', auth, async(req, res) => {
    const place = await Place.findById(req.params.id);

    if (!place) return res.status(404).json('Not found');
    return res.status(200).json(place);
});

router.get('/showReviews/:id', auth, async(req, res) => {
    const review = await Review.find({ commentsOn: req.params.id });
    if (!review) return res.status(404).json('not found');

    res.status(200).json(review);
})

router.post('/addReview/:id', auth, async(req, res) => {

    const { error } = reviewValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let user = await User.findById(req.user._id);
    if (!user) return res.status(404).json('user not found');

    let review = new Review({
        text: req.body.text,
        from: {
            owner: req.user._id,
            name: user.name,
            profile: user.profile
        },
        commentsOn: req.params.id
    });

    if (req.body.photo) {
        const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;

        const image = fs.writeFile(`public/${path}`, req.body.photo, { encoding: 'base64' }, function(err) {

            if (err) {
                return res.status(500).json('failed');
            }
        });
        review.photo = path;
    }
    review = await review.save();
    review = await Review.find({ commentsOn: req.params.id });
    res.status(200).json(review);
});
router.delete('/deleteReview/:id', auth, async(req, res) => {
    let review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json('not found');
    if (req.user._id != review.from.owner || req.user.role != 'Admin') {
        return res.status(403).json('you don`t have access');
    }
    review = await Review.findByIdAndRemove(req.params.id);
    return res.status(200).json('deleted successfully');
});
router.get('/showExistence', [auth], async(req, res) => {
    const existence = await Existence.find();
    if (!existence) return res.status(404).json('not found');


    return res.status(200).json(existence);

});
router.post('/searchExistence', [auth], async(req, res) => {
    if (req.body.city) {
        let existence = await Existence.find({ city: new RegExp('.*' + req.body.city + '.*', 'i') });;
        if (!existence) return res.status(404).json('not found');
        return res.status(200).json(existence);
    } else if (req.body.country) {
        let existence = await Existence.find({ country: new RegExp('.*' + req.body.country + '.*', 'i') });;
        if (!existence) return res.status(404).json('not found');
        return res.status(200).json(existence);
    } else return res.status(400).json('user dont search about any thing')

});

router.get('/allCompany/:country', auth, async(req, res) => {
    let branch = await Branch.find().populate('companyId', { name: 1, email: 1, profile: 1 });
    let result = [];
    branch.forEach(element => {
        const reg = new RegExp('.*' + req.body.country + '.*', 'i');
        if (element.country_city.country.match(req.body.country))
            result.push(element);
    });
    if (!result) return res.status(404).json('not found');
    res.status(200).json(result);
});
router.get('/showCompanyInf/:id', [auth], async(req, res) => {
    const date = new Date(Date.now());

    const company = await Company.findById(req.params.id).and({ end: { $gte: date } }).populate('owner', { name: 1, email: 1, profile: 1 }).select('name email');
    if (!company) return res.status(404).json('not found');
    return res.status(200).json(company);
});



router.get('/showMyPlane', auth, async(req, res) => {
    const plane = await Plane.find({ userId: req.user._id });

    if (!plane) return res.status(404).json('not found');

    return res.status(200).json(plane);
});

router.post('/showSinglePlane', auth, async(req, res) => {
    const plane = await Plane.find({ planeName: req.body.planeName });

    if (!plane) return res.status(404).json('not found');

    return res.status(200).json(plane);
});

router.post('/addToUserPlane', auth, async(req, res) => {
    const { error } = planeValidation(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let to = await Place.findById(req.body.to);
    if (!to) return res.status(404).json(' place  didint found');


    let durationFrom = new Date(req.body.durationFrom);
    let durationTo = new Date(req.body.durationTo);


    let plane = await Plane.findOne({ planeName: req.body.planeName, userId: req.user._id });
    if (!_.isEmpty(plane)) {
        plane.planeDetails.push({
            to: to,
            durationFrom: durationFrom,
            durationTo: durationTo
        });
        plane = await plane.save();
        return res.status(200).json('plan added successfully');
    }


    plane = new Plane({
        planeName: req.body.planeName,
        userId: req.user._id,
        planeDetails: {
            to: to,
            durationFrom: durationFrom,
            durationTo: durationTo
        },

    });
    plane = await plane.save();
    return res.status(200).json('plan added successfully');

});
router.put('/updatePlane/:planeName', auth, async(req, res) => {
    let plane = await Plane.find({ planeName: new RegExp('.*' + req.params.planeName + '.*', 'i') });
    if (!plane) return res.status(404).json('not found');
    if (req.user._id != plane.userId) return res.status(403).json('acces denied ');
    if (req.body.planeName) plane.planeName = req.body.planeName;
    if (req.body.id) {
        let planeDetails = plane.planeDetails.id(req.body.id);
        if (!planeDetails) return res.status(404).json('not found');
        if (req.body.durationTo) planeDetails.durationTo = req.body.durationTo;
        if (req.body.durationFrom) planeDetails.durationFrom = req.body.durationFrom;
        if (req.body.to) planeDetails.to = req.body.to;
    }
    plane = await plane.save();
    return res.status(200).json(plane);
});
router.delete('/deletePlane/:id', auth, async(req, res) => {
    let plane = await Plane.findOneAndRemove({ _id: req.params.id, userId: req.user._id });
    if (!plane) return res.status(403).json('acces denied ');

    return res.status(200).json('deleted successfully');

});

router.delete('/deletePlaneDetails/:id', auth, async(req, res) => {
    let plane = await Plane.find({ _id: req.params.id, userId: req.user._id });
    if (!plane) return res.status(403).json('acces denied ');
    const planeDetails = plane.planeDetails.id(req.body.id);
    planeDetails.remove();
    plane = await plane.save();
    return res.status(200).json('deleted successfully');

});



router.post('/searchTrip', auth, async(req, res) => {
    const { error } = validateSearchTrip(req.body);
    if (error) return res.status(400).json(error.details[0].message);
    let trip = await Trip
        .find();
    if (!trip) return res.status(404).json('not found');

    let result = [];
    trip.forEach(element => {
        const reg = new RegExp('.*' + req.body.to + '.*', 'i');

        if (element.from.country.match(req.body.from) || element.to.match(req.body.to)) {
            result.push(element);
        }
    });
    if (result.length == 0) return res.status(404).json('dont found');
    return res.status(200).json(result);


});

router.post('/blockTrip/:id', auth, async(req, res) => {
    const { error } = validateBlockTrip(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json('trip did`nt found');

    const company = await Company.findById(trip.companyId);
    paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': company.client_id,
        'client_secret': company.client_secret
    });
    let price;

    if (req.body.isVip == true) {

        price = trip.vipPrice;
        if (req.body.quantity > trip.vipUnreservedSeats)
            return res.status(400).json('unversed seats is less than quantity');
    } else {
        price = trip.price;
        if (req.body.quantity > trip.unreservedSeats)
            return res.status(400).json('unversed seats is less than quantity');

    }

    let block = new Block({
        userId: req.user._id,
        tripId: req.params.id,
        isVip: req.body.isVip,
        seat: req.body.quantity,
        isPay: false,
        totalPrice: req.body.quantity * price
    });
    block = await block.save();
    const port = process.env.PORT || 8000;

    var create_payment_json = {
        "intent": "authorize",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `http://192.168.43.2:${port}/api/user/success/${req.params.id}/${block._id}`,
            "cancel_url": "http://cancel.url"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": trip.name,
                    "price": price.toString(),
                    "sku": "item",
                    "currency": "USD",
                    "quantity": req.body.quantity
                }]
            },
            "amount": {
                "currency": "USD",
                "total": block.totalPrice.toString()
            },
            "description": "This is a block trip"
        }]
    };
    paypal.payment.create(create_payment_json, function(error, payment) {
        if (error) {
            res.status(500).json(error.response);
            throw error;
        } else {
            for (var index = 0; index < payment.links.length; index++) {
                if (payment.links[index].rel === 'approval_url') {
                    res.redirect(payment.links[index].href);
                }
            }
        }
    });
});

router.get('/success/:id/:idBlock', async(req, res) => {
    let block = await Block.findById(req.params.idBlock);
    var execute_payment_json = {
        "payer_id": req.query.PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": block.totalPrice.toString()
            }
        }]
    };

    var paymentId = req.query.paymentId;

    paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
            return res.status(500);
        }

    });
    let trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json('trip did`nt found');

    if (block.isVip) {
        trip.vipUnreservedSeats = trip.vipUnreservedSeats - block.seat;
    } else {
        trip.unreservedSeats -= block.seat;
    }
    block.isPay = true;
    trip = await save();
    block = await save();

    return res.status(200).json('booking trip done ');
});

router.get('/showMyBlocking', auth, async(req, res) => {
    const block = await Block.find({ userId: req.user._id });
    if (!block) return res.status(404).json('user didnt block any trip yet');

    return res.status(200).json(block);
});

function validateSearchTrip(trip) {
    const Schema = Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
    });
    return Schema.validate(trip);

}


module.exports = router;