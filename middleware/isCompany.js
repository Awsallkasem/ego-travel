const { Company } = require("../models/company");

async function isCompany(req, res, next) {
    if (!req.user.role === 'Company' && !req.user.role == 'Admin') {
        return res.status(403).josn('you dont have permission');
    }
    const comapny=await Company.find({owner:req.user._id});
    const now=new Date(Date.now());
    if(company.end<now) return res.status(403).json('access denide')
    next();
}
module.exports = isCompany;