const path = require("path");
module.exports = function (app) {
  var routes = require("../controllers/customerController");

//   app.route("/api/customer/login").post(routes.customerLogin);
    app.route("/").get( (req, res) => {
    console.log(__dirname)
    const fileDir = path.join(__dirname, "../../metlle_react/build/index.html");
    res.sendFile(fileDir);
  });

};
