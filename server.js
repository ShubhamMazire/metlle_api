const path = require("path");
const cors = require("cors");
var express = require("express"),
  app = express(),
  port = 8000,
  bodyParser = require("body-parser");

const public = path.join(__dirname, "../metlle_react/build");
const upload = path.join(__dirname, "../uploads");

app.use(cors());

app.use("/uploads",express.static(upload));

const formidableMiddleware = require("express-formidable");

app.use(
  formidableMiddleware({
    encoding: "utf-8",
    // uploadDir: 'uploads',
    multiples: true, // req.files to be arrays of files
    keepExtensions: true,
  })
);

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

//We are using the built-in body-parser middleware to parse JSON
// app.use(upload.any());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

const blogRoutes = require("./routes/blogRoutes"); //importing route
blogRoutes(app); //register the route


const adminRoutes = require("./routes/adminRoutes"); //importing route
adminRoutes(app); //register the route

const paymentRoutes = require("./routes/paymentRoutes"); //importing route Payments
paymentRoutes(app); //register the route

var authRoutes = require("./routes/authRoutes"); //importing route Payments
authRoutes(app); //register the route

var pdfRoutes = require("./routes/pdfRoutes"); //importing route
pdfRoutes(app); //register the route

var msaasRoutes = require("./routes/msaasRoutes"); //importing route
msaasRoutes(app); //register the route


var customerRoutes = require("./routes/customerRoutes"); //importing customer route
customerRoutes(app); //register the route

var partnerRoutes = require("./routes/partnerRoutes"); //importing partner route
partnerRoutes(app); //register the route

var PublicRoutes = require("./routes/PublicRoutes"); //importing route
PublicRoutes(app); //register the route


var contactUsRoutes = require("./routes/contactUsRoutes"); //importing route
contactUsRoutes(app); //register the route

app.use("/",express.static(public));

app.use(function (req, res) {
  // res.status(404).send({ url: req.originalUrl + " not found" });
  // redirect to the index.html file
  res.sendFile(path.join(__dirname, "../metlle_react/build/index.html"));
});

app.listen(port);

console.log(" RESTful API server started on: " + port);
