const jwt = require('jsonwebtoken');
const config = require('config');

function auth(req, res, next) {
    const token = req.header('x-jwt');

    if (!token) return res.status(401).json('access denied');

    try {

        const decode = jwt.verify(req.header('x-jwt'), config.get('jwtPrivateKey'));
        req.user = decode;
        next();
    } catch (err) {
        res.status(400).json('invaild token');
    }
}
module.exports = auth;