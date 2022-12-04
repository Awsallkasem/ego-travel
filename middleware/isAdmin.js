function isAdmin(req, res, next) {
    if (!req.user.role === 'Admin') {
        return res.status(403).json('you dont have permission');
    }
    next();
}
module.exports = isAdmin;