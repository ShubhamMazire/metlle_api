
"use strict";

const { userAuth } = require("../middleware/auth");

module.exports = function (app) {

    var routes = require("../controllers/contactUsController");

app.route("/api/contactUs").post(routes.addContactUs);
app.route("/api/contactUs").get(routes.getContactUs);

}

