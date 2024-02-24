const db = require("../database/db");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// const flask_path="http://3.111.137.87/process-model"
const flask_path = "http://127.0.0.1:5050/process-model";

const isFileValid = (file) => {
  // ALLOWED_EXTENSIONS are .stl and .step
  if (!file.name) return false;

  const extensions = [".stl", ".step"];

  if (!extensions.includes(path.extname(file.name))) return false;

  return true;
};
const rand = () => {
  return Math.random().toString(36).substr(2);
};

exports.login = async function (req, res) {
  const fields = req.fields;

  //   password and email validation

  if (!fields.email || !fields.password) {
    return res.json({
      status: "error",
      message: "Email and password are required",
    });
  }

  //hash password  using base64
  fields.password = Buffer.from(fields.password).toString("base64");

  //check if user exists
  const user = await db("user_table")
    .where({
      user_email_id: fields.email,
      user_password: fields.password,
    })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    //create token
    const token = rand() + rand();

    //update token in db
    await db("user_table")
      .where({ user_email_id: fields.email })
      .update({ token: token })
      .catch((err) => {
        console.log(err);
      });

    if (user && user.length == 0) {
      return res.json({
        status: "error",
        message: "Invalid email or password",
      });
    }

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

exports.register = async function (req, res) {
  const re = {
    firstName: "VIjay",
    lastName: "Mane",
    companyName: "Pressbuddy software solutions",
    gstNumber: "12rfdsfhfgh",
    companyAddress: "ghfgjghj",
    pinCode: "411057",
    contactNumber: "9975720525",
    email: "nilesh@pressbuddy.in",
    password: "12345678",
    confirmPassword: "12345678",
  };

  /*

  table schema

  table.increments("id").primary();
    table.string("user_full_name");
    table.string("company_name");
    table.string("user_email_id");
    table.string("user_password");
    table.string("city");
    table.datetime("user_creation_date");
    table.datetime("user_last_update_date");
    table.string("address");
    table.integer("industry_id");
    table.integer("contact_number");
    table.integer("address_pincode");
    table.string("country");
    table.string("token");
    table.string("state");
    table.string("gst_number");
    table.integer("user_type_id");
    table.string("status");
    table.float("credit");
    table.integer("pincode");

    */

  const query = {
    user_full_name: req.fields.firstName + " " + req.fields.lastName,
    company_name: req.fields.companyName,
    user_email_id: req.fields.email,
    user_password: req.fields.password,
    gst_number: req.fields.gstNumber,
    pinCode: req.fields.pinCode,
    contact_number: req.fields.contactNumber,
    address: req.fields.companyAddress,

    //add user_type_id
    role: "partner",

    //add user_creation_date
    user_creation_date: new Date(),
    //add user_update_date
    user_last_update_date: new Date(),

    //hash password  using base64
    user_password: Buffer.from(req.fields.password).toString("base64"),
  };

  console.log(JSON.stringify({ query }));

  // const files = req.files;
  const fields = req.fields;

  // check is email exist in db
  const user = await db("user_table")
    .where({ user_email_id: req.fields.email })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    return res.json({
      status: "error",
      message: "Email already exist",
    });
  }

  try {
    db("user_table")
      .insert(query)
      .catch((err) => {
        return res.json({
          status: "error",
          message: "Something went wrong",
          where: "insert query",
          err: err,
        });
      });

    const token = rand() + rand();

    //update token in db
    await db("user_table")
      .where({ user_email_id: req.fields.email })
      .update({ token: token })
      .catch((err) => {
        return res.json({
          status: "error",
          message: "Something went wrong",
          where: "update token in db",
          err: err,
        });
      });

    const user = await db("user_table")
      .where({ user_email_id: req.fields.email })
      .catch((err) => {
        return res.json({
          status: "error",
          message: "Something went wrong",
          where: "get user from db",
          err: err,
        });
      });

    res.json({
      status: "success",
      message: "User added successfully",
      token: token,
      user: {
        user_id: user[0].id,
        user_name: user[0].user_name,
        user_email: user[0].user_email_id,
      },
    });
  } catch (e) {
    console.log(e);

    res.json({
      status: "error",
      message: "Something went wrong",
      where: "try catch block",
      err: e,
    });
  }
};

exports.getIndustryList = async function (_req, res) {
  const data = await db.select("*").from("industry");

  res.json({
    status: "success",
    data: data,
  });
};

exports.getCost = async function (req, res) {
  const {
    //python api
    quntity,
    volume,
    area,

    price,
    material,
    sub_grade_material,
  } = req.fields;

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

  const { part_finish } = req.fields; //from ui
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
  const { roughness } = req.fields;
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
  const { tolerances } = req.fields;
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
  const { inspection } = req.fields;
  switch (inspection) {
    case "1":
      c6 = 50;
      break;
    case "2":
      c6 = 250;
      break;
  }

  //================================================================================================

  const costBeforeQuntity = c1 + c2 + c3 + c4 + c5 + c6;
  const costAfterQuntity = costBeforeQuntity * quntity;
  const overHeadPercentage = 10; //%
  const overHead = (overHeadPercentage / 100) * costAfterQuntity;
  const finalCost = costAfterQuntity + overHead;

  res.json({
    status: "success",
    data: {
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
    },
  });
};

// getProcesses
exports.addProcessCapability = async function (req, res) {
  const user_id = req.user.id;
  const partner_company_details = {
    user_id: user_id,
    industry: req.fields.industry,
    experience: req.fields.experience,
    certifications: req.fields.certification,
    other_processes: req.fields.otherProcesses,
  };

  db("partner_company_details")
    .insert(partner_company_details)
    .catch((err) => {
      console.log(err);
      return res.json({
        status: "error",
        message: "Something went wrong",
        where: "insert query 1",
        err: err,
      });
    });

  const processes = JSON.parse(req.fields.processes);

  processes.forEach((process) => {
    const dataObj = {
      user_id: user_id,
      process: process.process,
      sub_process: process.subProcess,
    };

    const table = "partner_company_processes";
    db(table)
      .insert(dataObj)
      .catch((err) => {
        console.log(err);
        return res.json({
          status: "error",
          message: "Something went wrong",
          where: "insert query 2",
          err: err,
        });
      });
  });

  return res.json({
    status: "success",
    message: "Process capability added successfully",
  });
};

// addMachineCapability

exports.addMachines = async function (req, res) {
  const body = req.body;
  var abc;
  const user_id = req.user.id;

  const machines = JSON.parse(req.fields.machines);

  var data = machines.forEach(async (machine) => {
    const dataObj = {
      user_id: user_id,
      process: machine.process,
      model_make: machine.model,
      max_allowed_part_size: machine.maxAllowablePartSize,
      min_allowed_part_size: machine.minAllowablePartSize,
      finest_surface_roughness: machine.finestSurfaceRoughness,
      finest_acheivable_tolerance: machine.finestAchievableTolerance,
      max_machinable_hardness: machine.maxMachinableHardness,
      max_speed: machine.maximumSpeed,
      status: true,
    };

    const table = "partner_machines";

    const machine_id = await db(table).insert(dataObj);

    machine.material.forEach((material) => {
      const dataObj = {
        machine_id: machine_id,
        material: material,
      };
      const table_name = "partner_machine_materials";
      db(table_name)
        .insert(dataObj)
        .catch((err) => {
          console.log(err);
          return res.json({
            status: "error",
            message: "Something went wrong",
            where: "insert query 2",
            err: err,
          });
        });
    });
  });

  return res.json({
    body: req.body,
    status: "success",
    message: "Machines added successfully",
    data: data,
    abc,
  });
};

// uploadPhoto
exports.uploadPhoto = async function (req, res) {
  // return res.json({
  //   status: "success",
  //   message: "Photo uploaded successfully",
  //   files: req.files,
  // });


  // is file exist and is it image and is it less than 5mb and field name is file

  if (!req.files || !req.files.file) {
    return res.json({
      status: "error",
      message: "No files were uploaded.",
      keys: req.files.file,
    });
  }

  const user_id = 1//req.user.id;
  const table = "partner_company_photos";
  const file = req.files.file;

  const moveFile = (file) => {
    const fileDir = path.join(__dirname, "../../uploads");
    const filename = "manufacturers/" + Date.now() + file.name;
    const newFilePath = fileDir + "/" + filename;
    fs.rename(file.path, newFilePath, function () {
      // console.log("file moved");
    });

    const data = {
      user_id: user_id,
      picture_path: filename,
    };

    db(table)
      .insert(data)
      .catch((err) => {
        console.log(err);
        return res.json({
          status: "error",
          message: "Something went wrong",
          where: "insert query 1",
          err: err,
        });
      });
  };

  if (Array.isArray(file)) {
    file.forEach((file) => {
      moveFile(file);
    });
  } else {
    moveFile(file);
  }

  return res.json({
    status: "success",
    message: "Photo uploaded successfully",
  });
};

//getPhotos
exports.getPhotos = async function (req, res) {
  const user_id = req.user.id;
  const table = "partner_company_photos";

  const data = await db(table).where("user_id", user_id);

  return res.json({
    status: "success",
    message: "Photos fetched successfully",
    data: data,
  });
};
