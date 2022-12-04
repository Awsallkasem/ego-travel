function isOwner(req, res, next) {
    if (req.user._id.toString() === req.params.id.toString() || req.user.role == 'Admin') {
        next();
        return;
    } else
        return res.status(403).json('you dont have permission');

}
module.exports = isOwner;