const { sendNotification } = require('./services/push-notification.services');
const auth = require('./middleware/auth');
const { Block } = require('./models/blocking');
const { Trip } = require('./models/trips');
const _ = require('lodash');
exports.send = async(req, res, next) => {
    const date = new Date(Date.now());
    const date1 = new Date(Date.now());
    date.setDate(date.getDate() + 2);
    let trip = await Trip.find({ date: { $gte: date1, $lte: date } });
    if (!trip) return res.status(404).json('not found');
    let result = [];


    trip.forEach((element) => {
        result.push(element._id);
    });
    let block = await Block.find({ tripId: { $in: result } }).populate('userId', 'playerId').select('block.userId.playerId');
    let playerId = [];
    block.forEach((element) => {
        playerId.push(element.userId.playerId);

    });

    let message = {
        app_id: "14b128b3-ae9c-4845-8bde-d545fbcfa2c6",
        contents: { en: "remembered in trip" },
        included_segments: ['included_player_ids'],
        included_player_ids: playerId,
        content_available: true,
        small_icon: "ic_notification_icon",
        date: {
            PushTitle: 'CUSTOM NOTIFICATION'
        },

    };

    sendNotification(message, (error, result) => {
        if (error) {
            return next(error);
        }
        return res.status(200).send({
            message: "success",
            data: result,
        });
    });
}