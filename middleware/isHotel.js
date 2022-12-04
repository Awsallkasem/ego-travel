async function isHotel(req, res, next) {
    if (!req.user.role === 'Hotel' && !req.user.role == 'Admin') {
        return res.status(403).josn('you dont have permission');
    }

    next();
}
module.exports = isHotel;