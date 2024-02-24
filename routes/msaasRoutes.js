"use strict";

const { userAuth } = require("../middleware/auth");

module.exports = function (app) {

  var routes = require("../controllers/msaasController");
  app.route("/api/msaas/login").post(routes.login);
  app.route("/api/msaas/register").post(routes.register);
  // processes
  // ----------------------------------------------------------------------  
  app.get("/api/msaas/machines", userAuth, routes.getAllMachines);
  app.post("/api/msaas/machine", userAuth, routes.addMachine); // same will work for update
  // app.put("/api/msaas/machine", userAuth, routes.updateMachine);
  app.delete("/api/msaas/machine/:id", userAuth, routes.deleteMachine); 
  app.get("/api/msaas/machine/:id", userAuth, routes.getMachineDetails); 

  app.post("/api/msaas/calculate", userAuth, routes.calculate);
  app.post("/api/msaas/matchPrice/:id", userAuth, routes.matchPrice);
  // ---------------------------------------------------------------------- below routs are not used in the app 

  app.post("/api/msaas/processes", userAuth, routes.addProcessCapability);
  // machines
  ///msaas/machines
  // Uplaod photos
  app.post("/api/msaas/upload", userAuth,routes.uploadPhoto);
  // app.post("/api/msaas/upload", routes.uploadPhoto);
  // get all photos
  app.get("/api/msaas/photos", userAuth, routes.getPhotos);

};