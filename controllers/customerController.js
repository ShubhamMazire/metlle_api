const db = require("../database/db");
const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");
const FormData = require("form-data");
const { stl2png } = require("@scalenc/stl-to-png");

const { configs } = require("../common/util");

const { myIp } = configs;

// const flask_path="http://3.111.137.87/process-model"
const flask_path = "http://127.0.0.1:5050/process-model";

const isFileValid = (file) => {
  // ALLOWED_EXTENSIONS are .stl and .step
  if (!file.name) return false;

  const extensions = [".stl", ".step", ".STEP", ".STL"];

  if (!extensions.includes(path.extname(file.name))) return false;

  return true;
};
const rand = () => {
  return Math.random().toString(36).substr(2);
};

exports.customerLogin = async function (req, res) {
  const fields = req.fields;

  //hash password  using base64
  fields.user_password = Buffer.from(fields.user_password).toString("base64");

  //check if user exists
  const user = await db("user_table")
    .where({
      user_email_id: fields.user_email_id,
      user_password: fields.user_password,
      role: "customer",
    })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    //create token
    const token = rand() + rand();

    //update token in db
    await db("user_table")
      .where({ user_email_id: fields.user_email_id })
      .update({ token: token })
      .catch((err) => {
        console.log(err);
      });

    res.json({
      status: "success",
      message: "User logged in",
      token: token,
      user: {
        user_id: user[0].id,
        user_name: user[0].user_full_name,
        user_email: user[0].user_email_id,
        user_role: user[0].role,
      },
    });
  } else {
    res.json({
      status: "error",
      message: "Invalid email or password",
    });
  }
};

exports.customerRegister = async function (req, res) {
  // const files = req.files;
  const fields = req.fields;

  // check is email exist in db
  const user = await db("user_table")
    .where({ user_email_id: fields.user_email_id })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    return res.json({
      status: "error",
      message: "Email already exist",
    });
  }

  //add user_type_id
  fields.role = "customer";

  //hash password  using base64
  fields.user_password = Buffer.from(fields.user_password).toString("base64");

  // remove user_password_2 field

  delete fields.user_password_2;

  try {
    db("user_table")
      .insert(fields)
      .catch((err) => {
        console.log(err);
      });
  } catch (e) {
    console.log(e);
  }
  return res.json({
    status: "success",
    fields: req.fields,
    files: req.files,
    message: "User registered successfully",
  });
};

exports.getIndustryList = async function (_req, res) {
  const data = await db.select("*").from("industry");

  res.json({
    status: "success",
    data: data,
  });
};

exports.fileUpload = async function (req, res) {
  //get uplaoded file path and store it in db
  const fileDir = path.join(__dirname, "../../uploads");

  //move file to uploads folder without using parse
  const files = req.files;

  var valid = true;
  // itrate object and move file to uploads folder
  Object.keys(files).forEach((key) => {
    const file = files[key];
    if (!isFileValid(file)) {
      return res.json({
        status: "error",
        message: "Invalid file type 1 ",
      });
    }
  });

  if (!valid)
    return res.json({
      status: "error",
      message: "Invalid file type 2 ",
    });

  var newFileName = "";

  var response = null;
  var newFilePath = "";
  var temp_path = "";

  error = false;

  var fileName = "";



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

  if (error)
    return res.json({
      status: "error",
      message: "Error while moving file",
      data: error,
    });

  // Call api http://127.0.0.1:5000/ send file and get response

  const dbObj = {
    user_id: req.user.id,
    p_id: fileName,
    file_path: newFileName,
    requested_part_date: new Date(),
    quote_type: "auto_generated",
    status: "pending",
    // default values
    process: "3D",
    material: 1,
    surface_roughness: 1,
    tolerances: 1,
    finishing: 1,
    threads: 1,
    inspection: 2,
    parts_quantity: 1,
    target_price_per_pcs: null,
    sub_grade_material: 1,
    shipping_cost:50,
  };

  const id = await db("quote_requests").insert(dbObj);


  const cartDb = {
    user_id: req.user.id,
    item_id: id[0],
    quantity: 1,
    price: 0,
    // status: "pending",
    // created_at: new Date(),
    // updated_at: new Date(),
  }

  await db("cart").insert(cartDb);

  return res.json({
    status: "success",
    message: "File uploaded successfully",
    data: {
      id: id[0],
      p_id: fileName,
      file_path: newFileName,
      absolute_path: myIp + "/uploads/" + newFileName,
      upload_path: newFilePath,
      temp_path,
      user: req.user,
      header: req.headers
    },
  });
};

exports.mapGuestFileToUser = async function (req, res) {
  // multiple file
  const user_id = req.user.id;

  const { files = "[]" } = req.fields;

  const files_array = JSON.parse(files);

  files_array.forEach((id) => {
    console.log(id);

    // update user id to user_id from quote_requests where id = id

    db("quote_requests")
      .where({ id, user_id: 0 })
      .update({ user_id })
      .catch((err) => {
        console.log(err);
      });
  });

  return res.json({
    status: "status",
    data: {
      user_id,
      files,
      files_array,
    },
  });
};

exports.calculateCNC = async (req, res) => {
  try {
    let data = new FormData();
    data.append("path", files.file.path);

    const dbObj = {
      user_id: 1,
      file_path: newFileName,
      requested_part_date: new Date(),
      quote_type: "auto_generated",
      status: "pending",
      // default values
      process: "CNC",
      material: 1,
      surface_roughness: 1,
      tolerances: 1,
      finishing: 1,
      threads: 1,
      inspection: 2,
      parts_quantity: 1,
      target_price_per_pcs: null,
      sub_grade_material: 1,
    };

    const id = await db("quote_requests").insert(dbObj);

    data.append("id", id[0]);

    let config = {
      method: "post",
      // maxBodyLength: Infinity,
      url: flask_path,
      headers: {
        // Cookie:
        //   "session=.eJztjr0KgzAUhV9F7hxCrkluft7AoR1ci5QgsRUUxcQu4rs3e6fuTgcOh_N9BzyHKaR3TOAfB1S5BMwxpfCKwOC-VMM4xWoNW4buZD-LA5r21oIXXNbSGSuVEU4SGk0MwhYDeKstIS8VWqMZrNvYR_BOIVdGkpNWGdJUM0g55L14QNr7vgAK_7NM-1zWiFKVV66FIoGk8bxkLpn_ZbrzC7PbygQ.ZDBVwg.Kgf4X8V99JcNW_Zovy83q2UCqPE",
        ...data.getHeaders(),
      },
      data: data,
    };

    config.headers["Content-Length"] = data.getLengthSync();
    response = await axios(config);

    const { IRMR, area, boundingBox, price, volume } = response.data;

    const updatedataObj = {
      irmr: IRMR,
      surface_area: area,
      bounding_box: boundingBox,
      predicted_cost: price,
      volume: volume,
    };

    await db("quote_requests")
      .where({ id: id[0] })
      .update(updatedataObj)
      .catch((err) => {
        console.log(err);
      });

    const {
      machineCost,
      weight_of_the_part,
      materialCost,
      c1,
      // market_rate,
      c2,
      c3,
      c4,
      c5,
      c6,
      costBeforeQuntity,
      costAfterQuntity,
      overHead,
      finalCost,
    } = calculateCosts({
      volume,
      area,
      price,
    });

    // table.float("machine_cost").nullable();
    // table.float("weight_of_part").nullable();
    // table.float("material_cost").nullable();
    // table.float("cost_before_quantity").nullable();
    // table.float("cost_after_quantity").nullable();
    // table.float("overhead").nullable();
    // table.float("profit").nullable();
    // table.float("final_cost").nullable();
    const updatedataObj2 = {
      machine_cost: machineCost,
      weight_of_part: weight_of_the_part,
      material_cost: materialCost,
      cost_before_quantity: costBeforeQuntity,
      cost_after_quantity: costAfterQuntity,
      overhead: overHead,
      profit: 0,
      final_cost: finalCost,
    };

    await db("quote_requests")
      .where({ id: id[0] })
      .update(updatedataObj2)
      .catch((err) => {
        console.log(err);
      });

    res.json({
      status: "success",
      message: "File uploaded successfully",

      data: {
        file: files.file,
        api_res: response.data,
        valid: valid,
        id: id,
      },
    });
  } catch (err) {
    console.log(err);
    response.data = { err };

    return res.json({
      status: "error",
      message: "Error while processing file",
      data: {
        file: files.file,
        api_res: response.data,
        valid: valid,
      },
    });
  }
};

const calculateCosts = (obj) => {
  const {
    quntity = 1,
    volume,
    area,
    price,
    material = 1,
    sub_grade_material = 1,

    // c2
    part_finish = 1,

    // C4

    roughness = 1,

    //C5
    tolerances = 1,

    // C6
    inspection = 2,
  } = obj;

  //--Data --------------------------------------------------------------------

  //multipliers
  const subGradeCosts = [
    [1, 1.5, 1.05, 1.1, 1.08, 0.95, 0.8], //Aluminum
    [
      1.01, 1.01, 1.1, 1.06, 1.07, 1.06, 0.9, 1.2, 1.1, 1.01, 1.01, 1.01, 1.05,
      1.06, 1.04, 1.05, 1.04,
    ], //Carbon Steel
    [2, 2.2, 2.01, 2.05, 1.98, 2.25, 2.04, 1.6, 1.95, 1.8, 2.8], //Stainless Steel
    [1.8, 1.4, 1.4, 1.4, 1.6, 1.7, 1.6, 1.5, 1.4, 1.8, 1.85, 1.7], //Alloy steel
    [2.8, 2.75, 2.65, 2.55, 2.78, 2.8, 2.7, 2.75, 2.75], //Tool Steel
    [1.1, 1.11, 1.11], //Copper
    [1.3, 1.4, 1.4, 1.3], //Brass
    [3, 3.05, 3.2], //Titanium			 Grade 1 Grade 2 Grade 5
    [3.1, 3.5, 3.11, 3.6, 3.2, 3.2], //Super alloy			 Hstelloy c276 inconel 718 incoloy 925 Inconel 625 Monel 400 Monel 500
  ];

  const densityOfMaterial = [
    [
      0.0000027, 0.0000027, 0.0000027, 0.0000027, 0.0000027, 0.0000027,
      0.0000027,
    ],
    [
      0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008,
      0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008,
      0.000008, 0.000008, 0.000008,
    ],
    [
      0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008,
      0.000008, 0.000008, 0.000008, 0.000008,
    ],
    [
      0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008,
      0.000008, 0.000008, 0.000008, 0.000008, 0.000008,
    ],
    [
      0.0000089, 0.0000089, 0.0000089, 0.0000089, 0.0000089, 0.0000089,
      0.0000089, 0.0000089, 0.0000089,
    ],
    [0.0000089, 0.0000089, 0.0000089],
    [0.0000087, 0.0000087, 0.0000087, 0.0000087],
    [0.000008, 0.000008, 0.000008],
    [0.000008, 0.000008, 0.000008, 0.000008, 0.000008, 0.000008],
  ];
  const rawMaterialCostPerKg = [
    [350, 450, 350, 330, 310, 350, 300],
    [80, 80, 85, 82, 84, 82, 78, 87, 89, 76, 78, 80, 82, 78, 74, 75, 76],
    [375, 420, 360, 385, 370, 430, 410, 390, 380, 350, 500],
    [150, 160, 150, 165, 170, 175, 180, 182, 170, 200, 210, 200],
    [350, 320, 250, 270, 300, 320, 340, 300, 280],
    [850, 900, 860],
    [600, 620, 700, 640],
    [460, 500, 470],
    [450, 470, 450, 500, 550, 450],
  ]; //from db

  //--------------------------------- C1 ---------------------------------------------------

  const weight_of_the_part =
    volume * densityOfMaterial[material - 1][sub_grade_material - 1];

  const machineCost =
    subGradeCosts[material - 1][sub_grade_material - 1] * price;

  const materialCost =
    weight_of_the_part *
    rawMaterialCostPerKg[material - 1][sub_grade_material - 1];

  const c1 = machineCost + materialCost;

  //================================================================================================

  //--------------------------------- C2 ---------------------------------------------------

  const part_finish_rate_in_market = [
    [24, 48, 60, 30, 40, 430],
    [20, 120, 4, 480, 2],
    [20, 120, 4, 480, 2],
    [20, 120, 4, 480, 2],
    [0],
    [120, 25, 480],
    [120, 25, 480],
    [0],
    [0],
  ];

  const market_rate = part_finish_rate_in_market[material - 1][part_finish - 1]; //E
  const E = market_rate;
  const B21 = quntity;
  const G = weight_of_the_part;
  const B3 = area;
  // market_rate  E;
  //quntity B21
  //weight_of_the_part G
  //Area B3
  //N

  var c2 = 0;

  console.log("material", material);
  console.log("part_finish", part_finish);

  switch (material) {
    //Aluminum
    case "1":
      console.log("part_finish", part_finish);
      /*
          Bead Blast
          Black anodize
          Blue anodize
          Clear Anodize
          Powder coating
          Electro plating
          */
      switch (part_finish) {
        case "1":
        case "5":
        case "3":
        case "4":
          console.log("E", E);
          c2 = E * G; //#f1
          break;
        case "2":
        case "6":
          console.log("--->>>", E);
          c2 = E * (B3 / 92900); //#f2
          break;
      }
      break;
    //Carbon Steel
    case "2":
      /*
          Black oxide
          Nickel plating
          Powder coating
          Silver plating
          Through harden
      */
      switch (part_finish) {
        case "1":
          c2 = E * B21; //#f3
          break;
        case "2":
          c2 = E * (B21 / 92900); //#f4
        case "3":
        case "4":
          c2 = E * (B3 / 92900); //#f2
          break;
        case "5":
          c2 = E * (B3 / 645.2); //#f2_2
      }
      break;
    //Stainless Steel
    case "3":
      /* Black oxide
          Nickel plating
          Powder coating
          Silver plating
          Through harden
          */
      switch (part_finish) {
        case "1":
          c2 = E * B21; //#f3
          break;
        case "2":
        case "3":
        case "4":
          c2 = E * (B3 / 92900); //#f2
          break;
        case "5":
          c2 = E * (B3 / 645.2); //#f2_2
      }
      break;
    //Alloy steel
    case "4":
      /*
        Black oxide
        Nickel plating
        Powder coating
        Silver plating
        Through harden
        */
      switch (part_finish) {
        case "1":
          c2 = E * B21; //#f3
          break;
        case "2":
        case "3":
        case "4":
          c2 = E * (B3 / 92900); //#f2
          break;
        case "5":
          c2 = E * (B3 / 645.2); //#f2_2
          break;
      }
      break;
    // Copper;
    case "6":
      /*
        Powder coating
        Shot blasting
        Silver plating
        */
      switch (part_finish) {
        case "1":
          c2 = E * (B3 / 1000000); //#f5
          break;
        case "2":
          c2 = E * G; //#f1
          break;
        case "3":
          c2 = E * (B3 / 92900); //#f2
          break;
      }
      break;

    //Brass
    case "7":
      /*
        Powder coating
        Shot blasting
        Silver plating
        */
      switch (part_finish) {
        case "1":
          c2 = E * (B3 / 1000000); //#f5
          break;
        case "2":
          c2 = E * G; //#f1
          break;
        case "3":
          c2 = E * (B3 / 92900); //#f2
          break;
      }
  }

  //================================================================================================

  //--------------------------------- C3 ---------------------------------------------------
  const c3 = 0;
  //================================================================================================

  //--------------------------------- C4 ---------------------------------------------------
  var c4 = 0;
  //3.2 1.6 0.8 0.4
  //o for first value i.e. 3.2
  switch (roughness) {
    case "1":
      c4 = c1 * 0.25;
      break;
    case "2":
      c4 = c1 * 0.35;
      break;
    case "3":
      c4 = c1 * 0.4;
      break;
  }
  //================================================================================================
  //--------------------------------- C5 ---------------------------------------------------

  var c5 = 0;
  switch (tolerances) {
    case "1":
      c5 = c1 * 0.1;
      break;
    case "2":
      c5 = c1 * 0.15;
      break;
    case "3":
      c5 = c1 * 0.2;
      break;
    case "4":
      c5 = c1 * 0.25;
      break;
  }
  //================================================================================================
  //--------------------------------- C6 ---------------------------------------------------
  var c6 = 0;
  switch (inspection) {
    case "Standard":
      c6 = 0;
      break;
    case "Formal":
      c6 = 50;
      break;
    case "CMM":
      c6 = 250;
  }

  //================================================================================================

  const costBeforeQuntity = c1 + c2 + c3 + c4 + c5 + c6;
  const costAfterQuntity = costBeforeQuntity * quntity;
  const overHeadPercentage = 10; //%
  const overHead = (overHeadPercentage / 100) * costAfterQuntity;
  const finalCost = costAfterQuntity + overHead;

  return {
    machineCost,
    weight_of_the_part,
    materialCost,
    c1,
    // market_rate,
    c2,
    c3,
    c4,
    c5,
    c6,
    costBeforeQuntity,
    costAfterQuntity,
    overHead,
    finalCost,
    // materialCost: materialCost,
  };
};

// getModel
exports.getPartDetails = async (req, res) => {
  // request param id in get

  const { id } = req.fields;

  // get model from db by id

  var result = await db("quote_requests").where({ id }).first();

  if (!result)
    return res.json({
      status: "error",
      message: "Invalid id",
    });

  if (result.thumbnail_path == null) {
    await _stlToPng(id);
    result = await db("quote_requests").where({ id }).first();
  }

  if (result.final_cost == null) return this.calculate3DV2(req, res);

  result.absolute_path = myIp + "/uploads/" + result.file_path;
  // send response
  res.json({
    status: "success",
    data: result,
  });
};


exports.getQuotationFromCart = async (req, res) => {

  console.log("getQuotationFromCart");

  const user_id = req.user.id;


  const cart = await db("cart").where({ user_id }).catch((err) => {
    console.log(err);
  });

  const orders = await db("quote_requests").where({ user_id }).
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

  const oneId = orders[orders.length -1] ? orders[orders.length-1].id : null ;
  orders.map(async (order,index) => {
    if(oneId == order.id)
    {
      if (order.thumbnail_path == null) {
        processing = true;
        await _stlToPng(order.id);
        order = await db("quote_requests").where({ id: order.id }).first();
        orders[index] = order;
      }

      if (order.final_cost == null) {
        req.fields.id = order.id;
        let data = await calculationHelper3dV2({ id: order.id });
        console.log('dta',data)
        if (!data && data == null) {
          processing = true;
          return;
        }

        console.log("data", data);
        order = data;
      }

      if(order.final_cost  == 0){
        processing = true;
        return;
      }


      if (processing) return;



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
    }
  })

  return res.json({
    status: "success",
    data: orders,
    processing: processing,
    calcualtions
  });

}

exports.calculate3D = async (req, res) => {
  // Inputs we will get from Python API
  const {
    id,
    quntity = 1,
    material = 1,
    color = "White",
    inspection = "standard",
    infill_percentage = 25,
    note = "",
  } = req.fields;

  const result = await db("quote_requests").where({ id }).first();

  const {
    surface_area,
    bounding_box,
    volume,
    irmr,
    kiri_value: filament_length_kiri,
    status,
  } = result;

  absolute_path = myIp + "/uploads/" + result.file_path;

  if (!volume || !surface_area || !bounding_box || !filament_length_kiri)
    return res.json({
      status: "error",
      message: "This quote is not finalized yet 0",
      progress: result,
      data: { absolute_path },
    });

  const b10 = irmr < 1.9 ? 1.6504625 : 2.4040625;

  // ------   cost C1 ----------------
  //@ use material

  const c1_density = material == "2" ? 1.03 : material == "1" ? 1.25 : 1.23;
  const c1_volume = (b10 * filament_length_kiri) / 1000;
  const c1_weight = c1_density * c1_volume;
  const c1_cost_multiplier = material == "2" ? 12 : material == "1" ? 10 : 15;
  const c1 = c1_weight * c1_cost_multiplier;

  // ------------------------ C2  ------------------------------
  //@ use color

  const c2 = color == "White" ? 0 : 0;

  // ------------------------ C3  ------------------------------
  //@ use infill_percentage
  const c3 = infill_percentage == 25 ? 0 : c1 * 0.5;

  //------------------------ C4  ------------------------------
  //@use inspection

  const c4 = inspection == "standard" ? 0 : 60;

  // ------------------  Const before quntiy --------------------

  const costBeforeQuntity = c1 + c2 + c3 + c4;

  // ------------------  Const after quntiy --------------------

  const costAfterQuntity = costBeforeQuntity * quntity;

  // ------------------  Overhead --------------------
  const overheadPerc = 10;

  const overhead = (overheadPerc / 100) * costAfterQuntity;

  // -------------------  Final cost -------------------

  const finalCost = costAfterQuntity + overhead;

  // ----------------------  packing cost  ---------------------
  // @ 10rs per kg (Consider FInal weight of all parts mentioned in the perticular quotation)

  const packingCost = 10 * c1_weight;

  // ---------------------- Shipping cost ---------------------
  const shippingCost = 50;
  const credits = 0;
  const discounts = 0;

  const gstPercentage = 18;

  const gst = (gstPercentage / 100) * finalCost;

  const subTotal = finalCost + packingCost + shippingCost + gst;

  //updated calculations result in db

  await db("quote_requests")
    .where({ id })
    .update({
      process: "3d",
      parts_quantity: quntity,
      material,
      color,
      infill_percentage,
      inspection,
      //---------------
      cost_before_quantity: costBeforeQuntity,
      cost_after_quantity: costAfterQuntity,
      overhead,
      final_cost: finalCost,
      packing_cost: packingCost,
      shipping_cost: shippingCost,
      credit: credits,
      discount: discounts,
      gst,
      sub_total: subTotal,
      note,
    })
    .catch((err) => {
      console.log(err);
    });

  const inserted = await db("quote_requests").where({ id }).first();

  res.json({
    status: "success",
    data: inserted,
    cal: {
      c1,
      c2,
      c3,
      c4,
      costBeforeQuntity,
      costAfterQuntity,
      overhead,
      finalCost,
      packingCost,
      shippingCost,
      credits,
      discounts,
      gst,
      subTotal,
    },
  });
};


const calculationHelper3dV2 = async (feilds, item = null) => {

  const {
    id,
    quntity = 1,
    material = 1,
    color = "White",
    inspection = "standard",
    infill_percentage = 25,
    note = "",
  } = feilds;



  var {
    surface_area,
    bounding_box,
    bounding_box_volume,
    volume,
    irmr,
    kiri_value: filament_length_kiri,
    status,
    file_path,
    thumbnail_path
  } = item ?? await db("quote_requests").where({ id }).first();


  if (thumbnail_path == null)
    _stlToPng(id);


  if (!volume || !surface_area || !bounding_box)
    return null;




  absolute_path = myIp + "/uploads/" + file_path;

  // calcualte kiri value if unavailable

  if (!filament_length_kiri) {
    let kiri_value = 0;
    //kiri_value=IF(irmr>0.62,volume/3.5,IF(irmr>0.52,volume/2.3,IF(irmr>0.2,volume/2,volume/0.9)))

    if (irmr > 0.62) {
      kiri_value = volume / 3.5;
    } else if (irmr > 0.52) {
      kiri_value = volume / 2.3;
    } else if (irmr > 0.2) {
      kiri_value = volume / 2;
    } else {
      kiri_value = volume / 0.9;
    }

    await db("quote_requests")
      .where({ id })
      .update({
        kiri_value: kiri_value,
      })

    filament_length_kiri = kiri_value;
  }



  // ------   cost C1 ----------------
  //@ use material

  const c1_density = material == "2" ? 1.05 : material == "1" ? 1.25 : 1.23;
  const c1_volume = filament_length_kiri / 1000;
  const c1_weight = c1_density * c1_volume;

  const c1_cost_multiplier = material == "2" ? 16 : material == "1" ? 12 : 18;

  const c1 = c1_weight * c1_cost_multiplier;
  console.log('c1 value',c1);

  // ------------------------ C2  ------------------------------
  //@ use color

  const c2 = color == "White" ? 0 : 0;

  // ------------------------ C3  ------------------------------
  //@ use infill_percentage
  const c3 = infill_percentage == 25 ? 0 : c1 * 0.5;

  //------------------------ C4  ------------------------------
  //@use inspection

  const c4 = inspection == "standard" ? 60 : 0;

  // ------------------  Const before quntiy --------------------

  const costBeforeQuntity = c1 + c2 + c3 + c4;
  console.log('costBeforeQuntity',costBeforeQuntity);

  // ------------------  Const after quntiy --------------------

  const costAfterQuntity = costBeforeQuntity * quntity;

  // ------------------  Overhead --------------------
  const overheadPerc = 5;

  const overhead = (overheadPerc / 100) * costAfterQuntity;

  // -------------------  Final cost -------------------

  const finalCost = costAfterQuntity + overhead;
  console.log('finalCost',finalCost);

  const surge = finalCost * 0.15;

  // ----------------------  packing cost  ---------------------
  // @ 10rs per kg (Consider FInal weight of all parts mentioned in the perticular quotation)

  const packingCost = 10 * c1_weight;
  console.log('packingCost',packingCost);
  // ---------------------- Shipping cost ---------------------
  const shippingCost = 0;
  const credits = 0;
  const discounts = 0;

  const gstPercentage = 18;

  const gst = (gstPercentage / 100) * finalCost;

  const subTotal = finalCost + packingCost + shippingCost + gst;
  console.log('subTotal',subTotal);

  //updated calculations result in db

  await db("quote_requests")
    .where({ id })
    .update({
      process: "3d",
      parts_quantity: quntity,
      material,
      color,
      infill_percentage,
      inspection,
      //---------------
      cost_before_quantity: costBeforeQuntity,
      cost_after_quantity: costAfterQuntity,
      overhead,
      final_cost: finalCost,
      packing_cost: packingCost,
      shipping_cost: shippingCost,
      credit: credits,
      discount: discounts,
      gst,
      sub_total: subTotal,
      note,
      surge,
    })
    .catch((err) => {
      console.log(err);
    });

  const inserted = await db("quote_requests").where({ id }).first();


  return inserted;
}


exports.calculate3DV2 = async (req, res) => {
  // Inputs we will get from Python API
  const {
    id,
  } = req.fields;

  const result = await db("quote_requests").where({ id }).first();

  var {
    surface_area,
    bounding_box,
    bounding_box_volume,
    volume,
    irmr,
    kiri_value: filament_length_kiri,
    status,
  } = result;

  absolute_path = myIp + "/uploads/" + result.file_path;

  if (!volume || !surface_area || !bounding_box)
    return res.json({
      status: "error",
      message: "This quote is not finalized yet 3D",
      progress: result,
      data: { absolute_path },
    });

  const data = await calculationHelper3dV2(req.fields, result)

  res.json({
    status: "success",
    data: data,
  });
};


exports.updateShipping = async function (req, res) {
  const { address, city, state, zip, country } = req.fields;
  const user_id = req.user.id;
  // return address;
  if (!address || !city || !state || !zip || !country) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if shipping record exists for the user
    const existingShipping = await db("shippings").where({ user_id }).first();

    if (existingShipping) {
      // Update existing shipping record
      await db("shippings").where({ user_id }).update({ address, city, state, zip, country });
    } else {
      // Insert new shipping record
      await db("shippings").insert({ user_id, address, city, state, zip, country });
    }

    return res.json({
      status: "success",
      message: "Data updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.updateBilling = async function (req, res) {
  const { address, city, state, zip, country } = req.fields;
  const user_id = req.user.id;
  // return address;
  if (!address || !city || !state || !zip || !country) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if shipping record exists for the user
    const existingBilling = await db("billings").where({ user_id }).first();

    if (existingBilling) {
      // Update existing shipping record
      await db("billings").where({ user_id }).update({ address, city, state, zip, country });
    } else {
      // Insert new shipping record
      await db("billings").insert({ user_id, address, city, state, zip, country });
    }

    return res.json({
      status: "success",
      message: "Data updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// from configure customer part screen
exports.getcncCost = async function (req, res) {
  // Inputs we will get from Python API
  console.log('knp',req.fields);
  const {
    id,
    quntity = 1,
    material = 1,
    sub_grade_material = 1,
    part_finish = 1,
    thread_tap_hole = 1,
    tolerances,
    roughness,
    inspection,
    certificate = 1,
    note = "",
    machine,
    numberOfWeeklyOffDays =1,
    numberOfWorkingHours = 1,
    numberOfWorkingSHifts =1,
    numberOfThread = 1,
    targetLeadTimeInDays = 1
  } = req.fields;

  const result = await db("quote_requests").where({ id }).first();
  const {
    surface_area: area,
    bounding_box,
    bounding_box_volume,
    volume,
    irmr,
    predicted_cost,
    status,
    user_id
  } = result;

  if (status != "finalized")
    return res.json({
      status: "error",
      message: "This quote is not finalized yet 123",
      progress: result,
    });

  const boundingBoxFaces = JSON.parse(bounding_box)

  // there are 3 values in bounding box faces example 100 100 20 
  // we need to get if 2 of them are same

  const are2ValuesSame = Math.round(boundingBoxFaces[0]) == Math.round(boundingBoxFaces[1]) || 
  Math.round(boundingBoxFaces[1]) == Math.round(boundingBoxFaces[2]) || 
  Math.round(boundingBoxFaces[0]) == Math.round(boundingBoxFaces[2]);

  var costMultiplier = 0;

  var set = "C"

  if (are2ValuesSame) {
    if (irmr <= 0.5) {
      costMultiplier = 2.8
      set = "A"
    } else if (irmr <= 0.7) {
      costMultiplier = 5
      set = "B"
    }
    else
      costMultiplier = 9
  } else {
    if (irmr <= 0.5) {
      costMultiplier = 3.2
      set = "A"
    } else if (irmr <= 0.7) {
      costMultiplier = 5.5
      set = "B"
    }
    else
      costMultiplier = 3.5
  }


  // practical cost
  var preictedCOstWIthIrmr = costMultiplier * predicted_cost
  console.log('preictedCOstWIthIrmr',preictedCOstWIthIrmr);

  const resultUser = await db("user_table").where({ id:user_id }).first();
  const {
    role,
    user_full_name,
  } = resultUser;
  
 
 
  //   +20% added for qty based gets practical cost
  const oldPrice = preictedCOstWIthIrmr + preictedCOstWIthIrmr * 0.20;
  console.log('oldPrice',oldPrice);

  let machineRate;  // Declare machine variable outside the if block
  let msaasMachine;  // Declare machine variable outside the if block
  let price;  // Declare machine variable outside the if block
  let mch;  // Declare machine variable outside the if block
  let practical_price;  // Declare machine variable outside the if block
  let existingData;

  if (role == 'msas') {
   
      if (typeof machine === 'undefined') {
          
          msaasMachine = await db("msaas_machine").where({ msass_id: user_id }).first();
          if (typeof msaasMachine === 'undefined') {
              return res.json({
                  status: "error",
                  message: "The machine is not added. First add machine",
                  progress: result,
              });
          }
          machineRate = msaasMachine['per_hr_machine_rate_inr'];
          mch = msaasMachine.id;
      } else {
          msaasMachine = await db("msaas_machine").where({ id: machine }).first();
          if (typeof msaasMachine === 'undefined') {
              return res.json({
                  status: "error",
                  message: "The machine is not added. First add machine",
                  progress: result,
              });
          }
          machineRate = msaasMachine['per_hr_machine_rate_inr'];
      }

      // check max size code start 
      const allowedSize = msaasMachine.max_allowed_part_size;
      // Remove square brackets
      const removedSizes = allowedSize.replace(/[\[\]']/g, '');
      const maxSizes = removedSizes.split(','); // Assuming msaasMachine is an object
      let maxIndex;
      if (Array.isArray(maxSizes) && maxSizes.length > 0) {
         maxIndex = maxSizes.reduce((maxIndex, currentValue, currentIndex, array) => {
          return currentValue < array[maxIndex] ? currentIndex : maxIndex;
        }, 0);

        const maxNode = msaasMachine[maxIndex];

        console.log('Max Value:', maxSizes[maxIndex]);
        console.log('Corresponding Node:', maxNode);
      } else {
        console.error('max_allowed_part_size is not a non-empty array.',typeof(maxSizes));
      }

      // size check
      // Remove double quotes
      const stringWithoutQuotes = maxSizes[maxIndex].replace(/"/g, '');

      // Convert to number
      const numberValue = parseFloat(stringWithoutQuotes);
      const maxSizeCheck = Math.round(numberValue) < Math.round(boundingBoxFaces[0]) || 
      Math.round(numberValue) < Math.round(boundingBoxFaces[1]) || 
      Math.round(numberValue) < Math.round(boundingBoxFaces[2]);

      console.log('maxSizeCheck',maxSizeCheck);
      
      // check max size code end

      // Check min size code start
        const minAllowedSize = msaasMachine.min_allowed_part_size;
        // Remove square brackets
        const removedMinSizes = minAllowedSize.replace(/[\[\]']/g, '');
        const minSizes = removedMinSizes.split(','); // Assuming msaasMachine is an object
        let minIndex;
        if (Array.isArray(minSizes) && minSizes.length > 0) {
          minIndex = minSizes.reduce((minIndex, currentValue, currentIndex, array) => {
            return currentValue > array[minIndex] ? currentIndex : minIndex;
          }, 0);
          console.log('Min Value:', minSizes[minIndex]);
        } else {
          console.error('min_allowed_part_size is not a non-empty array.', typeof(minSizes));
        }

        // size check
        // Remove double quotes
        const stringWithoutMinQuotes = minSizes[minIndex].replace(/"/g, '');

        // Convert to number
        const minNumberValue = parseFloat(stringWithoutMinQuotes);
        const minSizeCheck = Math.round(minNumberValue) < Math.round(boundingBoxFaces[0]) &&
          Math.round(minNumberValue) < Math.round(boundingBoxFaces[1]) &&
          Math.round(minNumberValue) < Math.round(boundingBoxFaces[2]);

        console.log('Math.round(minNumberValue)', Math.round(minNumberValue));
        console.log('Math.round(boundingBoxFaces[0])', Math.round(boundingBoxFaces[0]));
        console.log('minSizeCheck', minSizeCheck);
        if (minSizeCheck ) {
          return res.json({
            status: "error",
            message: "The Part Size Is Smaller Than Allowable Size.",
            progress: result,
          });
        }
        // Check min size code end



      console.log('practical cost price',price);
     

      if (typeof machine === 'undefined') {
        existingData = await db("price_matchings").where({ machine_id: mch }).first();
      }else{
        existingData = await db("price_matchings").where({ machine_id: machine }).first();
      }

      if (existingData) {
        practical_price = oldPrice;
        price = practical_price * existingData.ratio_1_qty_average;
      } else {
        practical_price = (oldPrice * machineRate) / 280;
        price = practical_price
      }
      
  }else{
    price = oldPrice;
  }

  
  if(role == 'msas'){
    
    
  }
  

  console.log('practical cost price',price);



  //--Data --------------------------------------------------------------------
  
  let densityOfMaterial;
  let rawMaterialCostPerKg;

   // density
   const machineMaterial = await db("machine_sub_materials").select('density','material_id');
   const materialDensity = {};

   machineMaterial.forEach((row) => {
     const { density, material_id } = row;
     if (!materialDensity[material_id]) {
       materialDensity[material_id] = [];
     }
     materialDensity[material_id].push(parseFloat(density));
   });

  densityOfMaterial = Object.values(materialDensity);

  if(role == 'msas'){

    // raw material cost per kg
    const machineRawMaterialCost = await db("machine_sub_materials").select('sub_material_price_per_kg','material_id');
    const subMaterialCost = {}; 

    machineRawMaterialCost.forEach((row) => {
      const { sub_material_price_per_kg, material_id } = row;
      if (!subMaterialCost[material_id]) {
        subMaterialCost[material_id] = [];
      }
      subMaterialCost[material_id].push(parseFloat(sub_material_price_per_kg));
    });

    rawMaterialCostPerKg = Object.values(subMaterialCost);
  
  }else{

   

    // raw material cost per kg
    const machineRawMaterialCost = await db("machine_sub_materials").select('sub_material_price_per_kg','material_id');
    const subMaterialCost = {}; 

    machineRawMaterialCost.forEach((row) => {
      const { sub_material_price_per_kg, material_id } = row;
      if (!subMaterialCost[material_id]) {
        subMaterialCost[material_id] = [];
      }
      subMaterialCost[material_id].push(parseFloat(sub_material_price_per_kg));
    });

    rawMaterialCostPerKg = Object.values(subMaterialCost);
  
  }

  //multipliers
  const subGradeCosts = [
    [0.9, 0.95, 0.87, 0.86, 0.86, 1.05, 0.95], //Aluminum
    [
      1.00, 1.11, 1.2, 1.05, 1.00, 1.18, 1.13, 1.35, 1.01, 1.01, 1.01, 1.01, 1.27,
      1.15, 1.11, 1.5, 1.1,
    ], //Carbon Steel
    [1.4, 1.48, 1.36, 1.43, 1.2, 1.5, 1.3, 1.3, 1.3, 1.3, 2.8], //Stainless Steel
    [1.3, 1.4, 1.18, 1.35, 1.27, 1.29, 1.35, 1.35, 1.3, 1.15, 1.3, 1.35], //Alloy steel
    [1.8, 1.84, 1.95, 2.0, 2.0, 2.2, 2.0, 2.0, 4.0], //Tool Steel
    [1, 1.02, 1.03], //Copper
    [0.92, 0.98, 0.9, 1.0], //Brass
    [2.0, 2.5, 2.9], //Titanium			 Grade 1 Grade 2 Grade 5
    [2.75, 3.5, 3.11, 3.08, 2.5, 2.65], //Super alloy			 Hstelloy c276 inconel 718 incoloy 925 Inconel 625 Monel 400 Monel 500
  ];


  //--------------------------------- C1 ---------------------------------------------------

  // now multiplying with bounding box volume previously it was volume
  let materialIndex ,  gradeIndex ;
  if(role == 'msas'){
    materialIndex =material - 1;
    gradeIndex =sub_grade_material;
  }else{
    materialIndex =material - 1;
    gradeIndex =sub_grade_material -1;
  }
  const weight_of_the_part =
    bounding_box_volume * densityOfMaterial[materialIndex][gradeIndex];


  const machineCost =
    subGradeCosts[materialIndex][gradeIndex] * price;
    console.log('materialIndex',materialIndex)
    console.log('gradeIndex',gradeIndex)
    console.log('machineCost',subGradeCosts[materialIndex][gradeIndex])
    console.log('machineCost',machineCost)

    let materialCost;
  if(role == 'msas'){
      var sub_materialMachine = await db('msaas_machine_material_sub_grade_mapping').where({msaas_machine_id:msaasMachine.id,machine_sub_material_id:sub_grade_material,machine_material_id:material - 1}).first();
    if(!sub_materialMachine){
      var sub_materialMachine = await db('msaas_machine_material_sub_grade_mapping').where({msaas_machine_id:msaasMachine.id, machine_material_id:material - 1}).first();
    }
    console.log('sub_cost',sub_materialMachine['sub_material_price_per_kg']);
    materialCost =
    weight_of_the_part *
    sub_materialMachine['sub_material_price_per_kg'];
  }else{
     materialCost =
    weight_of_the_part *
    rawMaterialCostPerKg[materialIndex][gradeIndex];
  }
  

  const c1 = machineCost + materialCost; //c1A + C1B
  console.log('materialIndex2',materialIndex);
  console.log('gradeIndex2',gradeIndex);
  console.log('densityOfMaterial[materialIndex][gradeIndex]',densityOfMaterial[materialIndex][gradeIndex]);
  console.log('bounding_box_volume',bounding_box_volume);
  console.log('weight_of_the_part',weight_of_the_part);
  console.log('materialCost',materialCost);
  console.log('c1',c1);

  //================================================================================================

  //--------------------------------- C2 ---------------------------------------------------

  const part_finish_rate_in_market = [
    [24, 48, 60, 30, 40, 430],
    [20, 120, 50, 480, 2],
    [20, 120, 50, 480, 2],
    [20, 120, 50, 480, 2],
    [0],
    [200, 25, 480],
    [200, 25, 480],
    [0],
    [0],
  ];

  const market_rate = part_finish_rate_in_market[materialIndex][part_finish - 1]; //E
  const E = market_rate;
  const B21 = quntity;
  const G = weight_of_the_part;
  const B3 = area;
  // market_rate  E;
  //quntity B21
  //weight_of_the_part G
  //Area B3
  //N

  var c2 = 0;

  console.log("material", material);
  console.log("part_finish", part_finish);

  switch (material) {
    //Aluminum
    case "1":
        console.log("part_finish1", part_finish);
        switch (part_finish) {
          case "1":c2 = G * E;
          case "5":c2 = G * E;
          case "3":
            console.log("E", E);
            c2 = G * E;
          case "4":c2 = G * E;
            console.log("E", E);
            c2 = E * G; //#f1
            break;
          case "2":c2 =  (B3 / 92900)*E;
          case "6":
            console.log("--->>>", E);
            c2 = E * (B3 / 92900); //#f2
            break;
        }
        break;
    //Carbon Steel
    case "2":
      /*
          Black oxide
          Nickel plating
          Powder coating
          Silver plating
          Through harden
      */
      switch (part_finish) {
        case "1":
          c2 = E * B21; //#f3
          break;
        case "2":
          c2 = E * (B21 / 92900); //#f4
        case "3":E * (B21 / 92900);
        case "4":
          c2 = E * (B3 / 92900); //#f2
          break;
        case "5":
          c2 = E * (B3 / 645.2); //#f2_2
      }
      break;
    //Stainless Steel
    case "3":
      /* Black oxide
          Nickel plating
          Powder coating
          Silver plating
          Through harden
          */
      switch (part_finish) {
        case "1":
          c2 = E * B21; //#f3
          break;
        case "2":E * (B3 / 92900);
        case "3":E * (B3 / 92900);
        case "4":
          c2 = E * (B3 / 92900); //#f2
          break;
        case "5":
          c2 = E * (B3 / 645.2); //#f2_2
      }
      break;
    //Alloy steel
    case "4":
      /*
        Black oxide
        Nickel plating
        Powder coating
        Silver plating
        Through harden
        */
      switch (part_finish) {
        case "1":
          c2 = E * B21; //#f3
          break;
        case "2":E * (B3 / 92900);;
        case "3":E * (B3 / 92900);
        case "4":E * (B3 / 92900);
          c2 = E * (B3 / 92900); //#f2
          break;
        case "5":
          c2 = E * (B3 / 645.2); //#f2_2
          break;
      }
      break;
    // Copper;
    case "6":
      /*
        Powder coating
        Shot blasting
        Silver plating
        */
      switch (part_finish) {
        case "1":
          c2 = E * (B3 / 1000000); //#f5
          break;
        case "2":
          c2 = E * G; //#f1
          break;
        case "3":
          c2 = E * (B3 / 92900); //#f2
          break;
      }
      break;

    //Brass
    case "7":
      /*
        Powder coating
        Shot blasting
        Silver plating
        */
      switch (part_finish) {
        case "1":
          c2 = E * (B3 / 1000000); //#f5
          break;
        case "2":
          c2 = E * G; //#f1
          break;
        case "3":
          c2 = E * (B3 / 92900); //#f2
          break;
      }
  }
  console.log('part_finish',part_finish);
  console.log('c2',c2);

  //================================================================================================

  //--------------------------------- C3 ---------------------------------------------------
  const c3 = 0;
  //================================================================================================

  //--------------------------------- C4 ---------------------------------------------------

  var c4 = 0;
  //3.2 1.6 0.8 0.4
  //o for first value i.e. 3.2
  switch (roughness) {
    case "1":
      c4 = c1 * 0;
      break;
    case "2":
      c4 = c1 * 0.15;
      break;
    case "3":
      c4 = c1 * 0.17;
      break;
    case "4":
      c4 = c1 * 0.2;
      break;
  }
  console.log('roughness',roughness);
  console.log('c4',c4);
  //================================================================================================
  //--------------------------------- C5 ---------------------------------------------------

  var c5 = 0;

  switch (tolerances) {
    case "1":
      c5 = c1 * 0;
      break;
    case "2":
      c5 = c1 * 0.05;
      break;
    case "3":
      c5 = c1 * 0.1;
      break;
    case "4":
      c5 = c1 * 0.13;
      break;
    case "5":
      c5 = c1 * 0.15;
      break;
  }
  console.log('tolerances',tolerances);
  console.log('c5',c5);
  //================================================================================================
  //--------------------------------- C6 ---------------------------------------------------
  var c6 = 0;
  switch (inspection) {
    case "1":
      c6 = 50;
      break;
    case "2":
      c6 = 250;
      break;
  }
  console.log('c6',c6);

  //================================================================================================

  const CBQ = c1 + c2 + c3 + c4 + c5 + c6; //   C"
  let costBeforeQuntity; //   C"
  let cycleTime;
  let workingMinOneDay;
  let maxPartProOneDay;
  let maxPartProtargetDay;

  if(role == 'msas'){
    // tooling cost
    toolingMachine = await db('msaas_machine').where({id:msaasMachine.id}).first();
    console.log('toolingMachine',toolingMachine);
    if(toolingMachine){
      var toolingCost = 0;
      console.log('toolingMachine.tooling_id',toolingMachine.tooling_id);
      if(toolingMachine.tooling_id == 1){
        toolingCost = CBQ * 0.15;
      }else if(toolingMachine.tooling_id == 2){
        toolingCost = CBQ * 0.25;
      }else{
        toolingCost = 0;
      }
     
      console.log('toolingCost',toolingCost);
      costBeforeQuntity = toolingCost + CBQ;
    }else{
      costBeforeQuntity = CBQ;
    }
    
    // calculate cycle time
    cycleTime = (costBeforeQuntity * 60)/machineRate;
    workingMinOneDay =((numberOfWorkingSHifts * numberOfWorkingHours)* 60);
    maxPartProOneDay = workingMinOneDay/cycleTime;
    maxPartProtargetDay = maxPartProOneDay * targetLeadTimeInDays;
    console.log('workingMinOneDay',workingMinOneDay);
    console.log('maxPartProOneDay',maxPartProOneDay);
    console.log('maxPartProtargetDay',maxPartProtargetDay);
    console.log('numberOfWorkingSHifts',numberOfWorkingSHifts);
    console.log('numberOfWorkingHours',numberOfWorkingHours);
    console.log('targetLeadTimeInDays',targetLeadTimeInDays);
    console.log('cycleTime',cycleTime);
  }else{
    costBeforeQuntity = CBQ;
    cycleTime = 1;
    workingMinOneDay = 1;
    maxPartProOneDay = 1;
    maxPartProtargetDay = 1;
  }
  const finalMachinCost = machineCost + c2 + c3 + c4 + c5 + c6; //   Final Machine Cost"
  console.log('costBeforeQuntity',costBeforeQuntity);
  console.log('set',set);

  // msaas price mactching value ratio calculation

  var finalMachinCostAfterQuantity = null;
  var finalMaterialAfterQuantity = null;
  var temp_caq;

  do {
    let q1, disc;

    if (finalMachinCostAfterQuantity === null) {
        q1 = finalMachinCost;
    } else {
        q1 = materialCost;
    }

    let q2;

    if (existingData) {
        q2 = q1 - q1 * (existingData.percentage / 100);
    } else {
        q2 = q1 - q1 * 0.075;
    }

    const q3 = q2 - q2 * 0.075;
    const q4 = q3 - q3 * 0.20;
    const q5 = q4 - q4 * 0.22;

    temp_caq = q5;

    // machine matching
    if ((set == "A" && quntity <= 12) || (quntity <= 8 && set == "B") || (quntity <= 5 && set == "C")) {
        temp_caq = q1;
    } else if (quntity <= 50) {
        var subtracter = set == "A" ? 12 : (set == "B" ? 8 : 5)
        var count = 50 - subtracter
        disc = (q1 - q2) / count;
        temp_caq = q1 - disc * (quntity - subtracter)
    } else if (quntity <= 100) {
        disc = (q2 - q3) / 50
        temp_caq = q2 - disc * (quntity - 50)
    } else if (quntity <= 500) {
        disc = (q3 - q4) / 400
        temp_caq = q3 - disc * (quntity - 100)
    } else if (quntity <= 1000) {
        disc = (q4 - q5) / 500
        temp_caq = q4 - disc * (quntity - 500)
    }

    if (finalMachinCostAfterQuantity === null) {
        finalMachinCostAfterQuantity = temp_caq;
    } else {
        finalMaterialAfterQuantity = temp_caq;
    }

} while (finalMaterialAfterQuantity === null);

console.log('finalMaterialAfterQuantity',finalMaterialAfterQuantity)
console.log('finalMachinCostAfterQuantity',finalMachinCostAfterQuantity)
  caq = finalMaterialAfterQuantity + finalMachinCostAfterQuantity;

  // cost based on quantity effect calculated


  console.log('caq',caq);
  const costAfterQuntity = caq * quntity;
  let overHeadPercentage;
  if(role == 'msas'){
     overHeadPercentage = 5; //%
  }else{
     overHeadPercentage = 10; //%
  }
  const overHead = (overHeadPercentage / 100) * costAfterQuntity;
  const finalCost = costAfterQuntity + overHead;

  console.log('finalCost',finalCost);
  const surge = finalCost*0.15;

  // ------------------------------  Packing cost --------------------------------------------------
  // @

  const post_process = c2 + c3 + c4 + c5 + c6;

  const packingCost = 10 * weight_of_the_part;

  const gstPercentage = 18;

  const gst = (gstPercentage / 100) * finalCost;


  const shippingCost = 0;


  const subTotal = finalCost + packingCost + shippingCost + gst;

  // save calculated values to db

  const dbObj = {
    process: "cnc",
    material,
    sub_grade_material,
    finishing: part_finish,
    threads: thread_tap_hole,
    tolerances,
    surface_roughness: roughness,
    inspection,
    certificate,
    note,
    shipping_cost: shippingCost,
    weight_of_part: weight_of_the_part,
    machine_cost: finalMachinCost,
    material_cost: materialCost,
    cost_before_quantity: costBeforeQuntity,
    cost_after_quantity: costAfterQuntity,
    overhead: overHead,
    final_cost: finalCost,
    packing_cost: packingCost,
    gst,
    sub_total: subTotal,
    post_process,
    surge,
  };

  await db("quote_requests").where({ id }).update(dbObj);

  var inserted = await db("quote_requests").where({ id }).first();
  inserted['caq'] = caq;
  inserted['cycleTime'] = cycleTime;
  inserted['targetLeadTimeInDays'] = targetLeadTimeInDays;
  inserted['quntity'] = quntity;
  inserted['workingMinOneDay'] = workingMinOneDay;
  inserted['maxPartProOneDay'] = maxPartProOneDay;
  inserted['maxPartProtargetDay'] = maxPartProtargetDay;
  inserted['finalMaterialAfterQuantity'] = finalMaterialAfterQuantity;
  inserted['finalMachinCostAfterQuantity'] = finalMachinCostAfterQuantity;
  res.json({
    status: "success",
    data: inserted,
  });
};

exports.getGraphData = async (req, res) => {
  /*
  320 mins = total number of quotation done * 30				
Eg. 40 quotations checked, so 40 * 30 = 120 mins saved				
*/

  const user_id = req.user.id ?? 1;

  const total_quotation_done = await db("quote_requests")
    .where({ user_id })
    .count("id as total")
    .first();
  const total_time_saved_in_minutes = total_quotation_done.total * 30;

  //   Quote to order conversion

  // Quoted percentage = 	Quotation checked / (Quotation checked + Ordered) * 100
  // Ordered percentage = 	Ordered / (Quotation checked + Ordered) * 100

  // Eg. 	Quotation checked		80	Nos
  // 	Ordered		10	Nos

  // 	Quoted percentage =		80 / (80+10) * 100

  // 	Ordered percentage =		10 / (80+10) * 100

  const total_quotation_checked = await db("quote_requests").where({user_id:user_id})
    .count("id as total")
    .first();

  const total_order = await db("orders").where({user_id:user_id}).count("id as total").first();

  const quoted_percentage =
    Math.round((total_quotation_checked.total /
      (total_quotation_checked.total + total_order.total)) *
    100);

  const ordered_percentage =
  Math.round((total_order.total / (total_quotation_checked.total + total_order.total)) *
    100);

  // Order completion status

  // Completed percentage =	Completed orders / Ordered

  // In progress percentage =	In progress orders / Ordered

  const total_order_completed = await db("orders")
    .where({ status: "completed" })
    .count("id as total")
    .first();

  const total_order_in_progress = await db("orders")
    .where({ status: "in_progress" })
    .count("id as total")
    .first();

  const completed_percentage =
    (total_order_completed.total / total_order.total) * 100;
  const in_progress_percentage =
    (total_order_in_progress.total / total_order.total) * 100;

  //get quote_requests where user id = user_id and status != ordered

  const pending_orders = await db("quote_requests")
    .where({ user_id })
    .whereNot({ status: "ordered" })
    .limit(100)
    .orderBy("id", "desc");

  const recent_orders = await db("quote_requests")
    .where({ user_id, status: "ordered" })
    .orderBy("id", "desc")
    .limit(100)
    .orderBy("id", "desc");

  return res.json({
    status: "success",
    data: {
      pending_orders,
      recent_orders,
      total_quotation_done: total_quotation_done.total,
      total_time_saved_in_minutes,

      quote_to_order_conversion: {
        total_quotation_checked: total_quotation_checked.total,
        total_order: total_order.total,
        quoted_percentage,
        ordered_percentage,
      },

      order_completion_status: {
        total_order_completed: total_order_completed.total,
        total_order_in_progress: total_order_in_progress.total,
        completed_percentage,
        in_progress_percentage,
      },
    },
  });
};

exports.getOrdersData = async (req, res) => {
  /*
  320 mins = total number of quotation done * 30				
Eg. 40 quotations checked, so 40 * 30 = 120 mins saved				
*/

  const user_id = req.user.id ?? 1;

  const total_quotation_done = await db("orders")
    .where({ user_id })
    .count("id as total")
    .first();
  const total_time_saved_in_minutes = total_quotation_done.total * 30;

  //   Quote to order conversion

  // Quoted percentage = 	Quotation checked / (Quotation checked + Ordered) * 100
  // Ordered percentage = 	Ordered / (Quotation checked + Ordered) * 100

  // Eg. 	Quotation checked		80	Nos
  // 	Ordered		10	Nos

  // 	Quoted percentage =		80 / (80+10) * 100

  // 	Ordered percentage =		10 / (80+10) * 100

  const total_quotation_checked = await db("orders")
    .count("id as total")
    .first();

  const total_order = await db("orders").count("id as total").first();

  const quoted_percentage =
    (total_quotation_checked.total /
      (total_quotation_checked.total + total_order.total)) *
    100;

  const ordered_percentage =
    (total_order.total / (total_quotation_checked.total + total_order.total)) *
    100;

  // Order completion status

  // Completed percentage =	Completed orders / Ordered

  // In progress percentage =	In progress orders / Ordered

  const total_order_completed = await db("orders")
    .where({ status: "completed" })
    .count("id as total")
    .first();

  const total_order_in_progress = await db("orders")
    .where({ status: "in_progress" })
    .count("id as total")
    .first();

  const completed_percentage =
    (total_order_completed.total / total_order.total) * 100;
  const in_progress_percentage =
    (total_order_in_progress.total / total_order.total) * 100;

  //get quote_requests where user id = user_id and status != ordered

  const pending_orders = await db("orders")
    .where({ user_id })
    .limit(100)
    .orderBy("id", "desc");

  const recent_orders = await db("orders")
    .where({ user_id})
    .orderBy("id", "desc")
    .limit(100)
    .orderBy("id", "desc");

  return res.json({
    status: "success",
    data: {
      pending_orders,
      recent_orders,
      total_quotation_done: total_quotation_done.total,
      total_time_saved_in_minutes,

      quote_to_order_conversion: {
        total_quotation_checked: total_quotation_checked.total,
        total_order: total_order.total,
        quoted_percentage,
        ordered_percentage,
      },

      order_completion_status: {
        total_order_completed: total_order_completed.total,
        total_order_in_progress: total_order_in_progress.total,
        completed_percentage,
        in_progress_percentage,
      },
    },
  });
};

exports.getTargetPrice = async (req, res) => {
  const { id } = req.fields;

  const targeted_price = req.fields.targeted_price
    ? parseInt(req.fields.targeted_price)
    : 0;

  const result = await db("quote_requests").where({ id }).first();

  if (!result) return res.json({ status: "error", message: "Invalid id" });

  const {
    cost_before_quantity: price,
    bounding_box,
    surface_area,
    irmr,
    volume,
    material,
    tolerances,
    surface_roughness,
    bounding_box_volume,
    status,
  } = result;

  if (status != "finalized")
    return res.json({
      status: "error",
      message: "This quote is not finalized yet 968",
      progress: result,
      st: status,
    });

  // targeted_price is less by 10% of predicted cost then send success else send error

  const goemetry_complexity = (1-irmr)*100;

  // find max element from JSON.parse(bounding_box)
  const longest_part = Math.max(...JSON.parse(bounding_box));

  /*
  longest part    complexity

  0 mm to 25 mm		50%
26 mm to 76 mm		70%
77 mm to 150 mm		90%
150 mm to 500 mm 		70%
500 to 2000 mm 		50%


  */

  var part_length_complexity = 0;
  if (longest_part <= 25) part_length_complexity = 50;
  else if (longest_part <= 76) part_length_complexity = 70;
  else if (longest_part <= 150) part_length_complexity = 90;
  else if (longest_part <= 500) part_length_complexity = 70;
  else if (longest_part <= 2000) part_length_complexity = 50;

  //tolerances

  var toleranceComplexity = 50;
    // console.log('tolerances',tolerances);
  switch (tolerances) {
    case 1:
      toleranceComplexity = 50;
      break;
    case 2:
      toleranceComplexity = 60;
      break;
    case 3:
      toleranceComplexity = 65;
      break;
    case 4:
      toleranceComplexity = 70;
      break;
    case 5:
      toleranceComplexity = 80;
      break;
  }

  var roughness_complexity = 40;

  switch (surface_roughness) {
    case 1:
      roughness_complexity = 40;
      break;
    case 2:
      roughness_complexity = 60;
      break;
    case 3:
      roughness_complexity = 80;
      break;
    case 4:
      roughness_complexity = 90;
      break;
  }

  var material_complexity = [25, 40, 50, 60, 80, 25, 30, 80, 90][material - 1];

  const avg_complexity =
    (goemetry_complexity +
      part_length_complexity +
      toleranceComplexity +
      roughness_complexity +
      material_complexity) /
    5;

  // insert avg_complexity in db to column dfm_comp

  if (avg_complexity)
    await db("quote_requests")
      .where({ id })
      .update({ dfm_comp: avg_complexity });

  var accept = false;

  if (
    targeted_price > price * 0.9 &&
    avg_complexity < 50 &&
    targeted_price <= price
  )
    accept = true;
    console.log('goemetry_complexity',goemetry_complexity)
    console.log('toleranceComplexity',toleranceComplexity)
    console.log('part_length_complexity',part_length_complexity)
    console.log('material_complexity',material_complexity)
    console.log('roughness_complexity',roughness_complexity)
    console.log('avg_complexity',avg_complexity)
  return res.json({
    status: "success",
    data: {
      price,
      targeted_price,
      price2: price * 0.9,
      accept,
      goemetry_complexity,
      toleranceComplexity,
      part_length_complexity,
      roughness_complexity,
      material_complexity,
      avg_complexity: parseInt(avg_complexity),
    },
  });
};

exports.sendFileForManualQuote = async (req, res) => {
  const { id = 0 } = req.fields;

  const result = await db("quote_requests").where({ id }).first();

  if (!result) return res.json({ status: "error", message: "Invalid id" });

  // update quote_type to manual_generated and status to manual

  await db("quote_requests")
    .where({ id })
    .update({ quote_type: "manual_generated", status: "manual" });

  return res.json({
    status: "success",
    data: {
      id,
    },
  });
};

exports.updateKiriValue = async (req, res) => {
  const { id, kiri_value } = req.fields;

  if (!kiri_value)
    return res.json({ status: "error", message: "kiri_value is required" });

  // update kiri_value where id is id in table quote_requests

  // TODO:  use this in future to calculate kiri value based on kirimoto
  // await db("quote_requests").where({ id }).update({ kiri_value });

  return res.json({
    status: "success",
    data: {
      id,
      kiri_value,
    },
  });
};

const _stlToPng = async (id) => {
  const fileDir = path.join(__dirname, "../../uploads");

  const result = await db("quote_requests").where({ id }).first();

  const { file_path } = result;

  // is filename ends with .stl
  console.log('upload');
  if (!file_path.endsWith(".stl")) return;
  console.log('upload1');
  const stlPath = fileDir + "/" + file_path;

  const pngPath = fileDir + "/thumbnails/" + file_path.split(".")[0] + ".png";

  const stlData = fs.readFileSync(stlPath);

  const pngData = await stl2png(stlData, { width: 500, height: 500 });

  fs.writeFileSync(pngPath, pngData);

  // update thumbnail_path in db

  await db("quote_requests")
    .where({ id })
    .update({ thumbnail_path: pngPath.split("uploads/")[1] });
};

exports.stlToPng_ = async (req, res) => {
  const { id } = req.fields;

  await _stlToPng(id);

  return res.json({
    status: "success",
    data: {
      id,
    },
  });
};

exports.deletePart = async (req, res) => {
  const { id } = req.fields;

  // delete file and thumbnail from uploads folder

  const result = await db("quote_requests").where({ id }).first();

  const { file_path, thumbnail_path } = result;

  const fileDir = path.join(__dirname, "../../uploads");

  const stlPath = fileDir + "/" + file_path;

  const pngPath = fileDir + "/" + thumbnail_path;

  try {
    fs.unlinkSync(stlPath);
  } catch (error) { }

  try {
    fs.unlinkSync(pngPath);
  } catch (error) { }

  // delete from db

  await db("quote_requests").where({ id }).delete();

  return res.json({
    status: "success",
    data: {
      id,
      stlPath,
      pngPath,
    },
  });
};
