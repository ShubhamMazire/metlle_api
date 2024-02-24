"use strict";

const { userAuth } = require("../middleware/auth");

module.exports = function (app) {
  var routes = require("../controllers/paymentController");

  //   handleccavenueresponse

  app
    .route("/api/customer/handleccavenueresponse")
    .post( routes.handleccavenueresponse);

  // createOrder
  app.post("/api/customer/createOrder", routes.createOrder);
};
