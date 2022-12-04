require('express-async-errors');
const winston = require('winston');
const express = require("express");
const mongoose = require('mongoose');
const config = require('config');
const app = express();
const refrish = require('./middleware/function')
const error = require('./middleware/error.js');
const auth = require('./routes/auth');
const profile = require('./routes/profile');
const admin = require('./routes/admin');
const hotel = require('./routes/hotel');
const Bocking = require('./models/pockingHotel');
const company = require('./routes/company');
const user = require('./routes/user');
const pushNotification = require('./routes/pushNotification');
const request = require('./routes/requestPromotion');
const update = require('./middleware/update');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

process.on('unhandledRejection', (ex) => {
    throw ex;
});

winston.handleExceptions(new winston.transports.File({ filename: 'uncaughtException.log' }));
winston.add(winston.transports.File, { filename: 'logFile.log' });

if (!config.get('jwtPrivateKey')) {
    console.error('FATEL ERROR:the env veriable is not defined');
    process.exit(1);
}



app.use(express.json());
app.use(express.static('public'));
app.use(update);
app.use(refrish);
app.use('/api/Auth', auth);
app.use('/api/admin', admin);
app.use('/api/profile', profile);
app.use('/api/company', company);
app.use('/api/hotel', hotel);
app.use('/api/user', user);
app.use('/api', pushNotification);
app.use('/api/request', request);
app.all('*', (req, res, next) => {
    res.status(404).json({
        statuse: 'false',
        message: 'page not found !'
    })
});
app.use(error);

mongoose.connect('mongodb://localhost/egotraveler', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...'));


const port = process.env.PORT || 8000;
app.listen(port, "192.168.43.249", () => console.log(`Listening on port ${port}...`));