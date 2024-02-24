const Printer = require("pdfmake");
const path = require("path");
const db = require("../database/db");
const moment = require("moment");

const translator = require("../common/translator");

// pdf


exports.getQuotePdf = async (req, res) => {
  const { user_id = 0 } = req.fields;


  const user = await db("user_table").where({ id: user_id }).first();








  if (!user) {
    return res.json({
      status: "error",
      message: "No users found",
    });
  }

  const {
    user_full_name,
  } = user


  const fileName = `quote-${user_full_name}-${moment().format("DDMMYYYY")}.pdf`;


  const cart = await db("cart").where({ user_id }).catch((err) => {
    console.log(err);
  });

  if (!cart) {
    return res.json({
      status: "error",
      message: "Cart is empty",
    });
  }



  const orders = await db("quote_requests").
    whereIn("id", cart.map((item) => item.item_id)).
    whereNot("quote_type", "manual_generated").
    catch((err) => {
      console.log(err);
    });

  const calcualtions = {

    production_cost: 0,
    packing_cost: 0,
    shipping_cost: 0,
    credit: 0,
    discount: 0,
    gst: 0,
    sub_total: 0,
    final_cost: 0,
  }


  var processing = false;

  // calculate totals
  orders.map(async (order) => {

    if (processing) return;

    if (order.thumbnail_path == null) {
      processing = true
      return;
    }

    const {
      status,
      production_cost,
      packing_cost,
      shipping_cost,
      credit,
      discount,
      gst,
      sub_total,
      final_cost } = order

    if (status != "finalized") {
      processing = true
      return;
    }

    calcualtions.production_cost += production_cost ?? 0
    calcualtions.packing_cost += packing_cost ?? 50
    calcualtions.shipping_cost += shipping_cost ?? 0
    calcualtions.credit += credit ?? 0
    calcualtions.discount += discount ?? 0
    calcualtions.gst += gst ?? 0
    calcualtions.sub_total += sub_total ?? 0
    calcualtions.final_cost += final_cost ?? 0
  })


  const parts = orders.map((order, index) => {
    let
      thumbnail_path = order.thumbnail_path,
      process = translator("process", "", order.process),
      material = translator("material", "", order.material),
      color = order.color,
      surface_roughness = translator("surface_roughness", "", order.surface_roughness),
      final_cost = order.final_cost;

    return ([
      index + 1,
      {
        image: "../uploads/" + thumbnail_path,
        width: 50,
        // fit: [100, 100], fit the image inside a rectangle',
      },



      // multiple lines
      {
           text: `
          Material: ${material}
          Process: ${process}
          Color: ${color}
          Surface Roughness: ${surface_roughness}
        `,
        margin: [0, 0, 0, 0],
        style: {
          fontSize: 8,
          fontWight: "100",
        },
      },
      "1",
      final_cost,
    ])
  })






  const pdfObject = {
    info: {
      title: "Quote",
      author: "Metlle.com",
      subject: "Quote",
    },
    content: [
      // image top left corner
      {
        image: "./assets/logo.png",
        width: 100,
        absolutePosition: { x: 40, y: 40 },
      },

      // Invoice Header
      {
        text: "QUOTE: " + moment().format("DDMMYYYY"), // Replace with actual invoice date
        style: "header",
        alignment: "right",
      },
      {
        text: `Date: ${moment().format(
          "DD/DD/YYYY HH:MM A"
        )}`, // Replace with actual date
        alignment: "right",
        margin: [0, 0, 0, 5],
      },

      {
        text: `SUMMARY OF ORDER: auto-generated`, // Replace with actual date
        alignment: "right",
        margin: [0, 0, 0, 0],
        style: {
          fontSize: 10,
          fontWight: "100",
          color: "#000000",
        },
      },

      // Separation Line

      // Ship To Address

      {
        columns: [
          { text: "PREPARED FOR", alignment: "left" },
          { text: "SHIP TO", alignment: "center", width: "33%" },
          { text: "QUOTE DETAILS", alignment: "right" }, // Replace with actual subtotal
        ],
        margin: [0, 15, 0, 0],
      },

      // customer details
      {
        columns: [
          {
            text: user_full_name,
            alignment: "left",
            style: {
              fontSize: 8,
              fontWight: "100",
              color: "#121212",
            },
          },
          {
            text: "Calculated at checkout",
            alignment: "center",
            width: "33%",
            style: {
              fontSize: 8,
              fontWight: "100",
              color: "#121212",
            },
          },
          {
            text: `Lead time: 7 business days
                   Shipping: Calculated at checkout
                   Ship date: ${moment()
                .add(7, "days")
                .format("DD/MM/YYYY")}
               `,
            alignment: "right",
            style: {
              fontSize: 8,
              fontWight: "100",
              color: "#121212",
            },
          }, // Replace with actual subtotal
        ],
      },

      {
        text: "",
        style: "subheader",
        alignment: "center",
      },

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 595 - 2 * 40, y2: 0 }] },
      { text: "\n" },

      // parts
      // Table: Item Details
      {
        layout: "noBorders", // optional
        table: {
          widths: [30, "*", "*", "*", "auto"],
          headerRows: 1,
          body: [
            ["No", "Item Image", "Description", "Qty", "Unit Price"],
            // Add data rows here...
            ...parts,
          ],
        },
      },

      // Separation Line
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 595 - 2 * 40, y2: 0 }] },
      { text: "\n" },

      // Summary
      {
        columns: [
          { text: "Subtotal:", alignment: "right", width: "80%" },
          { text: calcualtions.sub_total, alignment: "right" }, // Replace with actual subtotal
        ],
        margin: [0, 5, 0, 0],
      },
      {
        columns: [
          { text: "Packing:", alignment: "right", width: "80%" },
          { text: calcualtions.packing_cost, alignment: "right" }, // Replace with actual shipping cost
        ],
      },
      {
        columns: [
          { text: "Shipping:", alignment: "right", width: "80%" },
          { text: calcualtions.shipping_cost, alignment: "right" }, // Replace with actual shipping cost
        ],
      },
      {
        columns: [
          { text: "Tax:", alignment: "right", width: "80%" },
          { text: calcualtions.gst, alignment: "right" }, // Replace with actual tax
        ],
      },
      {
        columns: [
          { text: "Total:", alignment: "right", width: "80%" },
          { text: calcualtions.sub_total, alignment: "right" }, // Replace with actual total
        ],
      },

      // page break
      {
        text: `
              We want to earn your business.
              If you get a lower quote, send it to us. We will try to beat it.
              Contact:
              240-252-1138
              support@metlle.com
              The metlle Customer Service Agreement (www.metlle.com/service-agreement), Manufacturing Standards (www.metlle.com/manufacturing-standards), and website Terms of
              Use (www.metlle.com/terms) are incorporated by reference into this Quote and any order which results from this Quote and shall exclusively apply, notwithstanding any
              conflicting or additional terms in your purchase order or any other communications with us.`,
        pageBreak: "before",

        style: {
          fontSize: 8,
          fontWight: "100",
          color: "#121212",
        },
      },

      // line break
      {
        text: "\n",
      },
      { text: "\n" },

      // center bold text
      {
        text: "- PLEASE REVIEW THIS QUOTE FOR ACCURACY PRIOR TO ORDER -",
        alignment: "center",
        style: {
          marginTop: 20,
          fontSize: 12,
          fontWight: "200",
        },
      },

      // line break

      { text: "\n" },
      { text: "\n" },

      {
        text: `We have priced and estimated a delivery window for your job based on the geometry in 3D model you have provided, along with the tolerances, features and secondary
        operations you have selected during the submission process and which are specifically confirmed by us in this Quote. We do not automatically extract features, tolerances or
        other non-geometric information from your submitted 3D model, even if represented there (e.g. threads, tapped holes, etc.). Even though our prices are dynamically generated in real time, we will honor the price in this Quote for thirty (30) days from generation (although the estimated delivery window will be re-calculated at time of actual order
          placement).
          On-site Source Inspection requirements may add an additional charge and increase lead time.
          While we may provide you with design for manufacturing assistance, you are ultimately responsible for the suitability of your design, and associated material selection, for any
          intended purpose. You may submit one or more engineered drawings and or specification sheets to us. While we will do our best to identify any inconsistencies or conflicts in your
          materials prior to manufacturing your part, you alone are responsible for any inconsistencies between the materials you provide to us and what is reflected in this Quote.`,
        style: {
          fontSize: 8,
          fontWight: "100",
          color: "#121212",
        },
      },
    ],
    styles: {
      header: {
        fontSize: 13,
        bold: true,
      },
      subheader: {
        fontSize: 14,
        bold: true,
      },
    },
    defaultStyle: {
      fontSize: 11,
      font: "Roboto", // The font name was defined above.
      lineHeight: 1.2,
    },
  };


  var printer = new Printer({
    Roboto: {
      normal: path.resolve("fonts", "Roboto-Black.ttf"),
      bold: path.resolve("fonts", "Roboto-Bold.ttf"),
    },
  });

  var doc = printer.createPdfKitDocument(pdfObject);


  doc.end();

  res.setHeader("Content-type", "application/pdf");
  res.setHeader("Content-disposition", `inline; filename="${fileName}"`);

  doc.pipe(res);

  //   return res.json({
  //     status: "success",
  //     data: "pdf",
  //   });
};

/*

[
      // {
      //   image: image,
      //   width: 595, // Full A4 size width.
      //   absolutePosition: { x: 0, y: 0 },
      // },
      {
        fontSize: 11,
        table: {
          widths: ["50%", "50%"],
          body: [
            [
              {
                text: "Status: unpaid",
                border: [false, false, false, true],
                margin: [-5, 0, 0, 10],
              },
              {
                text: "Invoice# " + data.invoicenumber,
                alignment: "right",
                border: [false, false, false, true],
                margin: [0, 0, 0, 10],
              },
            ],
          ],
        },
      },
      {
        layout: "noBorders",
        fontSize: 11,
        table: {
          widths: ["50%", "50%"],
          body: [
            [
              { text: "Website.com", margin: [0, 10, 0, 0] },
              {
                text: "Invoice date: " + data.invoicedata,
                alignment: "right",
                margin: [0, 10, 0, 0],
              },
            ],
            ["...", ""],
            ["...", ""],
            ["...", ""],
          ],
        },
      },
      {
        fontSize: 11,
        table: {
          widths: ["50%", "50%"],
          body: [
            [
              {
                text: " ",
                border: [false, false, false, true],
                margin: [0, 0, 0, 10],
              },
              {
                text: "Payment amount: $" + data.price,
                alignment: "right",
                border: [false, false, false, true],
                margin: [0, 0, 0, 10],
              },
            ],
          ],
        },
      },
      {
        // layout: "noBorders",
        fontSize: 11,
        table: {
          widths: ["100%"],
          body: [
            [{ text: "User account for payment:", margin: [0, 10, 0, 0] }],
            [data.buyerinfo],
            [data.buyeraddress],
            ["Payment link:"],
            [
              {
                text: "link",
                margin: [0, 0, 0, 10],
              },
            ],
          ],
        },
      },
      {
        fontSize: 11,
        table: {
          widths: ["5%", "56%", "13%", "13%", "13%"],
          body: [
            [
              { text: "Pos", border: [false, true, false, true] },
              { text: "Item", border: [false, true, false, true] },
              { text: "Price", border: [false, true, false, true] },
              {
                text: "Quantity",
                alignment: "center",
                border: [false, true, false, true],
              },
              { text: "Total", border: [false, true, false, true] },
            ],
            [
              { text: "1", border: [false, true, false, true] },
              { text: data.item, border: [false, true, false, true] },
              { text: "$" + data.price, border: [false, true, false, true] },
              {
                text: "1",
                alignment: "center",
                border: [false, true, false, true],
              },
              { text: "$" + data.price, border: [false, true, false, true] },
            ],
          ],
        },
      },
      {
        layout: "noBorders",
        fontSize: 11,
        margin: [0, 0, 5, 0],
        table: {
          widths: ["88%", "12%"],
          body: [
            [
              { text: "Subtotal:", alignment: "right", margin: [0, 5, 0, 0] },
              { text: "$" + data.price, margin: [0, 5, 0, 0] },
            ],
            [{ text: "Tax %:", alignment: "right" }, "$0.00"],
          ],
        },
      },
      {
        fontSize: 11,
        table: {
          widths: ["88%", "12%"],
          body: [
            [
              {
                text: "Total:",
                alignment: "right",
                border: [false, false, false, true],
                margin: [0, 0, 0, 10],
              },
              {
                text: "$" + data.price,
                border: [false, false, false, true],
                margin: [0, 0, 0, 10],
              },
            ],
          ],
        },
      },
      {
        layout: "noBorders",
        fontSize: 11,
        alignment: "center",
        table: {
          widths: ["100%"],
          body: [
            [{ text: "Wire transfer info:", margin: [0, 10, 0, 0] }],
            ["SWIFT: ..."],
            ["Account number: ..."],
            ["Company name: ..."],
            [" "],
            ["Company address:"],
            ["..."],
          ],
        },
      },
    ],

    */
