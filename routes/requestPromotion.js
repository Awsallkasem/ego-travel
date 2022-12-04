const { RequestPromotion, requestPromotionValidate } = require('../models/requsetPromotion');
const { Admin } = require('../models/admin');
const express = require('express');
const fs = require('fs');
const { User } = require('../models/user');
const { Company } = require('../models/company');
const auth = require('../middleware/auth');
const paypal = require('paypal-rest-sdk');


const router = express.Router();


router.post('/requestPromotion', auth, async(req, res) => {
    const { error } = requestPromotionValidate(req.body);
    if (error) return res.status(400).json(error.details[0].message);


    const admin = await Admin.findOne();

    let price;
    if (req.body.promotion == 'Hotel') price = admin.hotelPrice;
    else if (req.body.promotion == 'Company') price = admin.companyPrice;
    let request = new RequestPromotion({
        userId: req.user._id,
        promotion: req.body.promotion,
        price: price
    });

    req.body.proofs.forEach((element) => {

        const path = `${Math.random().toString(36).substring(2, 15)}.jpg`;
        const image = fs.writeFile(`public/${path}`, element, { encoding: 'base64' }, function(err) {
            if (err) {
                return res.status(500).json('failed');
            }
        });
        request.proofs.push(path);
    });

    request = await request.save();
    paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': admin.client_id,
        'client_secret': admin.client_secret
    });
    const port = process.env.PORT || 8000;

    var create_payment_json = {
        "intent": "authorize",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `http://192.168.43.2:${port}/api/request/success/${request._id}`,
            "cancel_url": "http://cancel.url"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": request.promotion,
                    "price": price.toString(),
                    "sku": "item",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": price.toString()
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



router.get('/success/:id', async(req, res) => {
    let request = await RequestPromotion.findById(req.params.id);
    var execute_payment_json = {
        "payer_id": req.query.PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": request.price.toString()
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
    request.isPay = true;
    request = await request.save();

    return res.status(200).json(request);
});

router.post('/updatePromotion/:id', auth, async(req, res) => {

    const user = await User.findById(req.user._id);
    const admin = await Admin.findOne();

    let price;
    if (user.role == 'Hotel') price = admin.hotelPrice;
    else if (user.role == 'Company') price = admin.companyPrice;

    let request = await RequestPromotion.find({ userId: req.user._id })
    request.price = price;

    request = await request.save();
    paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': admin.client_id,
        'client_secret': admin.client_secret
    });
    const port = process.env.PORT || 8000;

    var create_payment_json = {
        "intent": "authorize",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `http://localhost:${port}/api/request/successUpdate/${request._id}/${req.params.id}`,
            "cancel_url": "http://cancel.url"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": request.promotion,
                    "price": price.toString(),
                    "sku": "item",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": price.toString()
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

router.get('/successUpdate/:id/:cId', async(req, res) => {
    let request = await RequestPromotion.findById(req.params.id);
    var execute_payment_json = {
        "payer_id": req.query.PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": request.price.toString()
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
    let update;
    if (request.promotion === 'Company') update = await Company.findById(req.params.cId);
    // if(request.promotion=='Hotel') 


    const end = update.end;
    end.setFullYear(end.getFullYear() + 1);

    update.end = end;
    update = await update.save();

    return res.status(200).json(update);
});

router.get('/chekRequest', auth, async(req, res) => {
    const request = await RequestPromotion.find({ userId: req.user._id });
    if (!request) res.status(404).json('you did not have any request');


    return res.status(200).json(request);

});

module.exports = router;