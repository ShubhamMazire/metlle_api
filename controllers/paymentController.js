const db = require("../database/db");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const nodeCCAvenue = require("node-ccavenue");
const moment =  require('moment');

//---------------------------------------------------------------------------------

const test_url = `https://test.ccavenue.com`;
const prod_url = `https://test.ccavenue.com`;

//---------------------------------------------------------------------------------

const marchant_id = `2465319`;
const s_access_code = `AVHN67KE58BN83NHNB`;
const s_working_key = `B8773AECE4DCA30A7A55671B9F520A9A`;
const access_code = `AVSE66KE65BL62ESLB`;
const working_key = `3A7B4F155799531064939904939B0B45`;

const merchantId = "2465319";
const workingKey = "B8773AECE4DCA30A7A55671B9F520A9A";
const accessCode = "AVHN67KE58BN83NHNB";

const ccav = new nodeCCAvenue.Configure({
  merchant_id: merchantId,
  working_key: workingKey,
});

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

// @ccavenue initialization

// Function to encrypt data
function encrypt(text, key) {

  return  ccav.encrypt(text);

  const cipher = crypto.createCipheriv("aes-128-cbc", key, Buffer.alloc(16, 0));
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Route for initiating the CCAvenue transaction
exports.createOrder = async function (req, res) {
  const requestData = req.fields;
  console.log('requestData',requestData);

  const quote = await db("quote_requests").where({ id: requestData.quote_id }).first();
  const order_id = moment(requestData.requested_part_date).format("DDMMYYYY") +quote.id;
  const shipping = await db("shippings").where({ user_id: quote.user_id }).first();
  const biller = await db("billings").where({ user_id: quote.user_id }).first();
  const user = await db("user_table").where({ id: quote.user_id }).first();
  const data = {
    order_id: order_id,
    amount: "1",
    billing_name: user.user_full_name,
    quote_id: quote.p_id,
    billing_address: biller.address,
    billing_city: biller.city,
    billing_state: biller.state,
    billing_zip: biller.zip,
    billing_country: biller.country,
    billing_tel: user.contact_number,
    billing_email: user.user_email_id,
    delivery_name:  user.user_full_name,
    delivery_address: shipping.address,
    delivery_city: shipping.city,
    delivery_state:  shipping.state,
    delivery_zip:  shipping.zip,
    delivery_country: shipping.country,
    delivery_tel: user.contact_number,
    merchant_param1: "additional Info.",
    promo_code: "",
    customer_identifier: "",
    integration_type: "iframe_normal",
    redirect_url: "https://www.metlle.com/api/customer/handleccavenueresponse",
    cancel_url: "https://www.metlle.com/api/customer/handleccavenueresponse",
  };
  delete quote.id;
  quote['order_id'] = order_id;
  quote['payment_method'] = requestData.payment_method;
  quote['delivery'] = requestData.delivery;
 
  if(requestData.delivery == 'standard_delivery'){
    quote['end_final_cost'] = quote.sub_total;
  }else{
    quote['end_final_cost'] =quote.sub_total + surge;
  } 



  if(requestData.payment_method == 'net_30'){
      const fileDir = path.join(__dirname, "../../uploads");
      //move file to uploads folder without using parse
      const files = req.files;
      var newFileName = "";

      var response = null;
      var newFilePath = "";
      var temp_path = "";

      error = false;

      Object.keys(files).forEach((key) => {
        const file = files[key];
        newFileName = Date.now() + path.extname(file.name);
        newFilePath = fileDir + "/" + newFileName;
        temp_path = file.path;
        fileName = file.name;
    
        if (file.path != newFilePath) {
          fs.copy(file.path, newFilePath, function (err) {
            error = {
              error: err,
              from: file.path,
              to: newFilePath,
            };
          });
        }
        // req.files[key]["path"] = newFilePath;
      });
      quote['net_30_file'] = fileName;
      quote['po_number'] = requestData.po_number;
  }else{
    quote['net_30_file'] = null;
    quote['po_number'] = null;
  }
  
  // place order
  console.log('quote',quote);
  const orders = await db("orders").insert(quote);

  if(requestData.payment_method == 'cod'){
   
    
    return res.json({
      status: "success",
      message: "Congratulation Your order placed successfully.",
      orders:orders
    });
  
  }else if(requestData.payment_method == 'net_30'){
    await db("quote_requests").where({id:quote.id}).update({status:'ordered'});
    return res.json({
      status: "success",
      message: "Congratulation Your order placed successfully.",
      orders:orders
    });
  }else{

      
    // Construct the merchant data string
    let merchantData = "";
    for (const key in data) {
      merchantData += key + "=" + data[key] + "&";
    }

    // Add merchant_id, amount, order_id, and currency
    merchantData +=
      "merchant_id=" +
      merchantId +
      "&amount=" +
      data.amount +
      "&order_id=" +
      data.order_id +
      "&currency=INR";

    // Encrypt the merchant data
    const encryptedData = encrypt(merchantData, workingKey);

    // Construct the production URL
    const productionUrl = `https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&encRequest=${encryptedData}&access_code=${accessCode}`;
    // window.location.href = productionUrl;
    //   return res.json({
    //   status: "success",
    //   message: "Welcome to payment module",
    //   productionUrl: productionUrl,
    // });
    res.redirect(productionUrl);

  }

};

//----------------------------------------------------------------------------------

//---------------------------------------------------------------------------------

exports.root = async function (req, res) {
  res.json({
    status: "success",
    message: "Welcome to payment module",
  });
};

// exports.createOrder = async function (req, res) {
//   const orderParams = {
//     merchant_id: marchant_id, // your merchant id provided by bank
//     order_id: Date.now(), // uniuqe order_no
//     currency: "USD", // or any supported currency
//     amount: 100,
//     redirect_url: "https://your_domain.com/ccavResponseHandler", // any route name that where ccaveneue response hit back to sever
//     cancel_url: "https://your_domain.com/ccavResponseHandler", //any route name that where ccaveneue response hit back to sever
//     merchant_param1: "any_value", // extra information can be send in these params you are not allowed to use any other custom field
//     customer_identifier: 23, //can be you user_id to save card info on payment gateway side
//   };

//   const encryptedOrderData = ccav.getEncryptedOrder(orderParams);

//   res.json({
//     status: "success",
//     message: "Welcome to payment module",
//     encryptedOrderData: encryptedOrderData,
//   });
// };

exports.handleccavenueresponse = async function (req, res) {
  const { encResp } = req.body;
  const output = ccav.redirectResponseToJson(encResp);
  console.log('tres');
  logger.log(output);
  // The 'output' variable is the CCAvenue Response in JSON Format

  if (output.order_status === "Failure") {
    // DO YOUR STUFF
    res.writeHead(301, {
      Location: "https://www.metlle.com/customer/",
    });
    res.end();
  } else if (output.order_status === "Success") {
    // DO YOUR STUFF

    // update payment status for order id in db  123 

    res.writeHead(301, {
      Location: "https://localhost:3000/customer/",
    });
  }
};
