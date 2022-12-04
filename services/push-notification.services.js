async function sendNotification(data, callback) {

    var headers = {
        "Content-type": "application/json; charset=utf-8",
        "Authorization": "Basic NmUzNDQ1MTMtYjQyNC00YmU0LWI5ZDEtNzM5Y2QyZDUxMzQ2"
    };
    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    };
    const https = require("https");
    let req = https.request(options, (res) => {
        res.on("data", (data) => {
            return callback(null, JSON.parse(data));
        });

    });

    req.on("error", (e) => {
        return callback({
            message: e
        });
    });

    req.write(JSON.stringify(data));
    req.end();
}
module.exports.sendNotification = sendNotification;