"use strict";

const { userAuth } = require("../middleware/auth");

const { withGuest } = require("../middleware/withGuest");

module.exports = function (app) {
  var routes = require("../controllers/customerController");

  // app
  //   .route("/api/companies")
  //   .get(test.list_all_companies)
  //   .post(test.list_all_companies);

  // app.route("/api/company/:companyId").get(test.companyDetails);
  // app.route("/api/company/deleteBranch/:branchId").get(test.deleteBranch);
  // app.route("/api/company/addBranch/").post(test.addBranch);

  // app.route("/api/company/updateBranch/").post(test.updateBranch);

  // app.route("/api/addCompany/").post(test.addCompany);

  // app.route("/api/customer/login").post(test.customerLogin);

  //------------------customer routes------------------

  app.route("/api/customer/login").post(routes.customerLogin);
  app.route("/api/customer/register").post(routes.customerRegister);
  app.route("/api/customer/getIndustryList").get(routes.getIndustryList);
  



  // stl step routes
  app.post("/api/customer/upload-model", withGuest, routes.fileUpload);

  // map guest uploaded file to loggedin user
  app.post("/api/customer/map_guest_file_to_user", userAuth, routes.mapGuestFileToUser);
  
  // get target price
  app.route("/api/customer/getTargetPrice").post(routes.getTargetPrice);

  // send file for manual quote
  app.route("/api/customer/sendFileForManualQuote").post(routes.sendFileForManualQuote);

  // update kiri value to item
  app.route("/api/customer/updateKiriValue").post(routes.updateKiriValue);

  // call from Web
  app.route("/api/customer/getcncCost").post(routes.getcncCost);

  // Depricated
  app.route("api/customer/calculateCNC").post(routes.calculateCNC);

  // app.route("/api/customer/calculate3D").post(routes.calculate3D);
  app.route("/api/customer/calculate3D").post(routes.calculate3DV2);

  app.route("/api/customer/get-part-details").post(routes.getPartDetails);


  app.get("/api/customer/get-quotation-from-cart",userAuth,routes.getQuotationFromCart);

  // customer dashboard graphs

  app.get("/api/customer/getGraphData", withGuest, routes.getGraphData);

  app.get("/api/customer/getOrdersData", userAuth, routes.getOrdersData);

  // stlToPng
  app.route("/api/customer/stlToPng").post(routes.stlToPng_);

  // delete part
  app.route("/api/customer/deletePart").post(routes.deletePart);

  // shipping form
  app.post("/api/customer/upload-shipping", userAuth, routes.updateShipping);
  app.post("/api/customer/upload-billing", userAuth, routes.updateBilling);

  // app.route("/api/customer/verifyOtp").post(routes.verifyOtp);
  // app.route("/api/customer/forgotPassword").post(routes.forgotPassword);
  // app.route("/api/customer/resetPassword").post(routes.resetPassword);
  // app.route("/api/customer/updateProfile").post(routes.updateProfile);
  // app.route("/api/customer/getProfile").post(routes.getProfile);
};
