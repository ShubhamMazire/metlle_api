"use strict";

const { adminAuth } = require("../middleware/auth")

module.exports = function (app) {

  var routes = require("../controllers/adminController.js");

  //------------------admin routes------------------
 
  
  app.post("/api/admin/login", routes.login);


  app.get("/api/admin/customers", adminAuth, routes.customers);
   
//   manufacutrer routes
app.get("/api/admin/manufacturers", adminAuth, routes.manufacturers);


// msaas routes

app.get("/api/admin/msaas", adminAuth, routes.msaas);

// rfqList

app.get("/api/admin/rfqList", adminAuth, routes.rfqList);

// ordered

app.get("/api/admin/ordered", adminAuth, routes.ordered);


// dashboard

app.get("/api/admin/dashboard", adminAuth, routes.dashboard);

  
  
};
