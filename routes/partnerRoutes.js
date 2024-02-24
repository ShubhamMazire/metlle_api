"use strict";

const { userAuth } = require("../middleware/auth");

module.exports = function (app) {
  var routes = require("../controllers/partnerController");

  //------------------customer routes------------------
  app.route("/api/partner/login").post(routes.login);
  app.route("/api/partner/register").post(routes.register);
  // processes
  app.post("/api/partner/processes", userAuth, routes.addProcessCapability);
  // machines
  ///partner/machines
  app.post("/api/partner/machines", userAuth, routes.addMachines);

  // Uplaod photos
  app.post("/api/partner/upload", userAuth,routes.uploadPhoto);
  // app.post("/api/partner/upload", routes.uploadPhoto);
  // get all photos
  app.get("/api/partner/photos", userAuth, routes.getPhotos);
};
