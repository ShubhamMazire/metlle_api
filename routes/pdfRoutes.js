"use strict";
module.exports = function (app) {
  var routes = require("../controllers/pdfController");
  app.route("/api/pdf/getPdf").post(routes.getQuotePdf);
};

