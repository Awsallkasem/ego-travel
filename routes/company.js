const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const fs = require('fs');
const Fawn = require('fawn');
const router = express.Router();
const { Company, companyValidate } = require('../models/company');
const { Place, placesValidate } = require('../models/places');
const { Trip, tripValidate } = require('../models/trips');
const { Branch, branchValidate } = require('../models/branch');
const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const isCompany = require('../middleware/isCompany');
const { Existence } = require('../models/existence');
const time = require('time-stamp');
const { date } = require('joi');
const Block = require('../models/blocking');
const { User } = require('../models/user');
const { RequestPromotion } = require('../models/requsetPromotion');


router.get('/showCompanyInf/:id', [auth, isCompany], async(req, res) => {
    const company = await Company.findById(req.params.id).populate('owner');
    if (!company) return res.status(404).json('not found');
    return res.status(200).json(company);
});

router.post('/addCompany/:id', [auth, isCompany], async(req, res) => {
    const user = await Company.findOne({ owner: req.user._id });
    if (user) return res.status(403).json('user have a company');
    const request = await RequestPromotion.findById(req.params.id);
    if (!requset.accepted) return res.status(403).json('ask promotion')
    const { error } = companyValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);
    const existence = await Existence.findById(req.body.extId);
    if (!existence) return res.status(404).json('the location is not found');

    const end = new Date(Date.now());
    end.setFullYear(end.getFullYear() + 1);

    const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;

    const image = fs.writeFile(`public/${path}`, req.body.profile, { encoding: 'base64' }, function(err) {
        if (err) {
            console.log(err);
        }

    });

    let company = new Company({
        name: req.body.name,
        email: req.body.email,
        country_city: {
            country: existence.country,
            city: existence.city,
        },
        end: end,
        owner: req.user._id,
        profile: path,
        location: { coordinates: [req.body.longitude, req.body.latitudes] },
        client_id: req.body.client_id,
        client_secret: req.body.client_secret
    });
    let branch = new Branch({
        country_city: {
            country: existence.country,
            city: existence.city,
        },
        companyId: company._id,
        location: { coordinates: [req.body.longitude, req.body.latitudes] },
    });

    copmany = await company.save();
    branch = await branch.save();



    res.status(200).json(company);
});

router.put('/update/:id', [auth, isCompany], async(req, res) => {
    let company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json('not found');

    if (req.user._id != company.owner || req.user.role != 'Admin')
        return res.status(403).json('you don`t have access');
    if (req.body.name) company.name = req.body.name;
    if (req.body.email) company.email = req.body.email;
    if (req.body.owner) company.owner = req.body.owner;
    if (!req.body.name && !req.body.email && !req.body.owner | !req.body.profile)
        return res.status(400).json('false');
    if (req.body.profile) {
        const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;

        const image = fs.writeFile(`public/${path}`, req.body.profile, { encoding: 'base64' }, function(err) {
            if (err) {
                console.log(err);
            }

        });
        company.profile = path;
    }
    if (req.body.extId) {
        const existence = await Existence.findById(req.body.extId);
        if (!existence) return res.status(404).json('the location is not found');
        if (!req.body.latitudes && !req.body.longitude)
            return res.status(400).json('bad request');
        company.country_city = {
            country: existence.country,
            city: existence.city
        };
        company.location = { coordinates: [req.body.longitude, req.body.latitudes] };
        let branch = await Branch.find({ companyId: req.params.id });
        let elementId;
        branch.forEach(element => {
            if (_.isEqual(element.location, company.location)) {
                elementId = element._id;
            }
        });
        branch = await Branch.findById(elementId);
        branch.country_city = {
            country: existence.country,
            city: existence.city
        };
        branch.location = { coordinates: [req.body.longitude, req.body.latitudes] };
        branch.save();
    }

    company = await company.save();
    return res.status(200).json(company);
});
router.get('/showBranch/:id', [auth], async(req, res) => {
    const branch = await Branch.findOne({ companyId: req.params.id }).populate('companyId');
    return res.status(200).json(branch);

});
router.post('/addBranch/:id', [auth, isCompany], async(req, res) => {
    const { error } = branchValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);
    let existence = await Existence.findById(req.body.existenceId);
    if (!existence) return res.status(404).json(' existence  didint found');
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json('the id isnt to comapny');
    let branch = new Branch({
        country_city: {
            country: existence.country,
            city: existence.city,
        },
        companyId: req.params.id,
        location: { coordinates: [req.body.longitude, req.body.latitudes] },
    });

    branch = await branch.save();
    return res.status(200).json(branch);

});
router.put('/updateBranch/:id', [auth, isCompany], async(req, res) => {
    const company = await Company.find({ owner: req.user._id });
    if (!company) return res.status(404).json('the company not found');

    let branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json('the branch not found');

    if (company._id != branch.companyId) return res.status(403).json('access denied');

    if (req.body.existenceId) {
        let existence = await Existence.findById(req.body.existenceId);
        if (!existence) return res.status(404).json(' existence  did`nt found');

        branch.country_city = {
            country: existence.country,
            city: existence.city,
        };
        branch.location = { coordinates: [req.body.longitude, req.body.latitudes] };
    }
    if (req.body.longitude) branch.location = { coordinates: [req.body.longitude, req.body.latitudes] };

    branch = await branch.save();
    return res.status(200).json(branch);

});

router.delete('/deleteBranch/:id', [auth, isCompany], async(req, res) => {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json('the company not found');

    let branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json('the branch not found');


    if (!company._id == branch.companyId) return res.status(403).json('access denied');

    branch = await Branch.findByIdAndRemove(req.params.id);

    return res.status(200).json('deleted successfully');

});



router.post('/addTrip/:id', [auth, isCompany], async(req, res) => {
    const { error } = tripValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);


    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json('dont found');
    let from = await Existence.findById(req.body.from);
    if (!from) return res.status(404).json(' existence  didint found');
    let to = await Existence.findById(req.body.to);
    if (!to) return res.status(404).json(' existence  didint found');

    let date = new Date(req.body.date);


    let trip = new Trip({
        from: from,
        to: to,
        companyId: req.params.id,
        date: date,
        time: req.body.time,
        price: req.body.price,
        vipPrice: req.body.vipPrice,
        unreservedSeats: req.body.unreservedSeats,
        vipUnreservedSeats: req.body.vipUnreservedSeats

    });
    trip = await trip.save();
    res.status(200).json(trip);
});
router.put('/updateTrip/:id', [auth, isCompany], async(req, res) => {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json('the company not found');

    let trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json('the trip not found');

    if (!company._id == trip.companyId) return res.status(403).json('access denied');

    if (req.body.date) {

        const date = new Date(req.body.date);
        trip.date = date;
    }
    if (req.body.time) trip.time = req.body.time;
    if (req.body.unreservedSeats) trip.unreservedSeats = req.body.unreservedSeats;
    if (req.body.vipUnreservedSeats) trip.unreservedSeats = req.body.vipUnreservedSeats;

    trip = await trip.save();
    return res.status(200).json(trip);
});

router.delete('/deleteOldTrip/:id', [auth, isCompany], async(req, res) => {
    const now = new Date(Date.now());
    const trip = await Trip.deleteMany({ date: { $lt: now } });
    return res.status(200).json(trip);
});
router.get('/showTrips', [auth, isCompany], async(req, res) => {
    const copmany = await Company.find({ owner: req.user._id });
    if (!company) return res.status(404).json('not found');

    const trip = await Trip.find({ companyId: company._id });
    if (!trip) return res.status(404).json('not found');

    return res.status(200).json(trip);
});
router.get('/showBlocking/:id', [auth, isCompany], async(req, res) => {
    const block = await Block.find({ tripId: req.params.id });
    if (!block) return res.status(404).json('not found');

    return res.status(200).json(block);
});

router.post('/searchUser/:id', [auth, isCompany], async(req, res) => {
    const user = await User.find({ email: req.body.email });
    if (!user) return res.status(404).json('not found');
    const block = await Block.find({ tripId: req.params.id, userId: user._id });
    if (!block) return res.status(404).json('not found');
    return res.status(200).json(block);
});


module.exports = router;