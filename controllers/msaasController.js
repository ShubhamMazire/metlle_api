const db = require("../database/db");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");



// const flask_path="http://3.111.137.87/process-model"
const flask_path = "http://127.0.0.1:5050/process-model";

const rand = () => {
  return Math.random().toString(36).substr(2);
};

exports.login = async function (req, res) {
  const fields = req.fields;

  //   password and email validation

  if (!fields.user_email_id || !fields.user_password) {
    return res.json({
      status: "error",
      message: "Email and password are required",
    });
  }

  //hash password  using base64
  fields.password = Buffer.from(fields.user_password).toString("base64");

  const { user_email_id, password } = req.fields;


  //check if user exists
  const user = await db("user_table")
    .where({
      user_email_id: user_email_id,
      user_password: password,
      role: "msas",
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
        user_role: "msas",
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
    role: "msas",

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
          query: query,
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

  return res.json({
    status: "success",
    message: "Process capability added successfully",
  });
};

// addMachineCapability


exports.getAllMachines = async function (req, res) {

  const { id } = req.user;

  // const id = 8;

  const machines = await db("msaas_machine").where({ msass_id: id });


  const machineWIthMaterials = await Promise.all(machines.map(async (machine, index) => {

    let id = machine.id;

    const materials = await db("msaas_machine_material_mapping").where({ msaas_machine_id: id }).catch((err) => {
      console.log(err);
      return res.json({
        status: "error",
        message: "Something went wrong",
        where: "insert query 1",
        err: err,
      });
    });

    //  fetch sub materials for each material and add to material object syncronously

    const endResult = await Promise.all(materials.map(async (material) => {

      const sub_materials = await db("msaas_machine_material_sub_grade_mapping").where({ machine_material_id: material.machine_material_id }).catch((err) => {
        console.log(err);
        return res.json({
          status: "error",
          message: "Something went wrong",
          where: "insert query 1",
          err: err,
        });
      });
      material.subGrade = sub_materials;
    }))

    machines[index].materials = materials;
  }
  ));




  return res.json({
    status: "success",
    message: "Machines fetched successfully",
    data: machines,
  });
}

const deleteMachine = async (id) => {

  // delete machine of id from msaas_machine 

  const machine = await db("msaas_machine").where({ id: id }).delete();

  // delete machine_material_mapping of machine id from msaas_machine_material_mapping

  const machine_material_mapping = await db("msaas_machine_material_mapping").where({ msaas_machine_id: id });

  machine_material_mapping.map(async (material) => {
    await db("msaas_machine_material_sub_grade_mapping").where({ machine_material_id: material.id }).delete();
  })

  await db("msaas_machine_material_mapping").where({ msaas_machine_id: id }).delete();
}

exports.addMachine = async function (req, res) {

  const body = req.body;
  const user_id = req.user.id;

  const machine_obj = JSON.parse(req.fields.machine);

  console.log('machine_obj.id',machine_obj.id);
  if (machine_obj.id) {
    await deleteMachine(machine_obj.id)
  }

  // delete keys from machine_obj
  const {
    materials,
    maxAllowablePartSizeX,
    maxAllowablePartSizeY,
    maxAllowablePartSizeZ,
    minAllowablePartSizeX,
    minAllowablePartSizeY,
    minAllowablePartSizeZ,
  } = machine_obj;

  const dbObj = {
    max_allowed_part_size: JSON.stringify([maxAllowablePartSizeX, maxAllowablePartSizeY, maxAllowablePartSizeZ]),
    min_allowed_part_size: JSON.stringify([minAllowablePartSizeX, minAllowablePartSizeY, minAllowablePartSizeZ]),
    part_quantity: 1,
    threads_tapped_holes: 0,
  };

  // delete keys from machine_obj     materials,
  delete machine_obj["materials"];
  delete machine_obj["maxAllowablePartSizeX"];
  delete machine_obj["maxAllowablePartSizeY"];
  delete machine_obj["maxAllowablePartSizeZ"];
  delete machine_obj["minAllowablePartSizeX"];
  delete machine_obj["minAllowablePartSizeY"];
  delete machine_obj["minAllowablePartSizeZ"];

  let msaasmachinetableobj;
  if (machine_obj.id) {
    msaasmachinetableobj = {
      msass_id: user_id,
      ...dbObj,
      ...machine_obj,
      max_allowed_part_size:dbObj.max_allowed_part_size,
      min_allowed_part_size:dbObj.min_allowed_part_size,
    };
  }else{
    msaasmachinetableobj = {
      msass_id: user_id,
      ...dbObj,
      ...machine_obj
    };
  }

  if (machine_obj.id) {
    existingData = await db("price_matchings").where({ machine_id: machine_obj.id }).first();
    if (existingData) {
      const machine = await db("price_matchings").where({ machine_id: machine_obj.id }).delete();
    }
  }

 
  delete machine_obj["max_allowable_part_size"]
  console.log('machine_obj',msaasmachinetableobj);
  const data = await db("msaas_machine").insert(msaasmachinetableobj).catch((err) => {
    console.log(err);
    return res.json({
      status: "error",
      message: "Something went wrong",
      where: "insert query 1",
      err: err,
    });
  });

  const machine_id = data[0];
  
  // 
  materials.forEach(async (material) => {

    const {
      subGrade
    } = material

    const checkMaterialExist = await db("msaas_machine_material_mapping")
      .where({
        msaas_machine_id: machine_id,
        machine_material_id: material.machine_material_id,
      })
      .first();
      let machine_material_id;
      try {
        if (checkMaterialExist) {
          console.log('Do nothing');
        }else{
           machine_material_id = await db("msaas_machine_material_mapping").insert({
            msaas_machine_id: machine_id,
            machine_material_id: material.machine_material_id,
          });
        }
      } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: err,
        });
    }

    // update and insert msaas_machine_material_sub_grade_mapping
    subGrade.forEach(async (subGrade) => {
      const dbOBJMaterial = {
        msaas_machine_id: machine_id,
        machine_material_id: material.machine_material_id,
        machine_sub_material_id: subGrade.machine_sub_material_id,
        sub_material_price_per_kg: subGrade.sub_material_price_per_kg,
      };

      const checkSumaterialExist = await db("msaas_machine_material_sub_grade_mapping")
      .where({
          msaas_machine_id: machine_id,
          machine_material_id: material.machine_material_id,
          machine_sub_material_id: subGrade.machine_sub_material_id,
      })
      .first();
  
      console.log('checkSumaterialExist', checkSumaterialExist);
      
      let table_name = "msaas_machine_material_sub_grade_mapping";
      
      try {
          if (checkSumaterialExist) {
              // Update if the record exists
              await db(table_name)
                  .where({
                      msaas_machine_id: machine_id,
                      machine_material_id: material.machine_material_id,
                      machine_sub_material_id: subGrade.machine_sub_material_id,
                  })
                  .update(dbOBJMaterial);
      
              console.log('some', 'update');
          } else {
              // Insert if the record does not exist
              await db(table_name).insert(dbOBJMaterial);
              console.log('some', 'insert');
          }
      } catch (err) {
          console.error(err);
          return res.status(500).json({
              status: "error",
              message: "Something went wrong",
              error: err,
          });
      }

    })

  });

  return res.json({
    status: "success",
    message: "Machines added successfully",
    data: data,
  });
};

exports.updateMachine = async function (req, res) { }


exports.deleteMachine = async function (req, res) {

  const id = req.params.id;

  await deleteMachine(id);

  return res.json({
    status: "success",
    message: "Machine deleted successfully",
  });

}

exports.getMachineDetails = async function (req, res) {

  const id = req.params.id;

  const machine = await db("msaas_machine").where({ id: id }).catch((err) => {
    console.log(err);
    return res.json({
      status: "error",
      message: "Something went wrong",
      where: "insert query 1",
      err: err,
    });
  });


  const materials = await db("msaas_machine_material_mapping").where({ msaas_machine_id: id }).catch((err) => {
    console.log(err);
    return res.json({
      status: "error",
      message: "Something went wrong",
      where: "insert query 1",
      err: err,
    });
  });

  //  fetch sub materials for each material and add to material object syncronously

  const endResult = await Promise.all(materials.map(async (material) => {
    console.log('nnnnn',material.machine_material_id);
    const sub_materials = await db("msaas_machine_material_sub_grade_mapping").where({ machine_material_id: material.machine_material_id }).catch((err) => {
      console.log(err);
      return res.json({
        status: "error",
        message: "Something went wrong",
        where: "insert query 1",
        err: err,
      });
    });
    material.subGrade = sub_materials;
  }))

  machine[0].materials = materials;

  return res.json({
    status: "success",
    message: "Machine details fetched successfully",
    data: machine[0],
  });




}


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

  const user_id = 1; //req.user.id;
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


exports.calculate = async function (req, res) {

  const user_id = req.user.id;
  const { part_id, msaas_machine_id, material, sub_material } = req.fields;

  const part_details = await db("quote_requests").where({ id: part_id, user_id }).first()

  if (!part_details) {
    return res.json({
      status: "error",
      message: "Part not found",
      meta: {
        part_id,
        user_id,
      }
    });
  }

  const machine_details = await db("msaas_machine").where({ id: msaas_machine_id, msass_id: user_id }).first()

  if (!machine_details) {
    return res.json({
      status: "error",
      message: "Machine not found",
      meta: {
        msaas_machine_id,
        user_id,
      }
    });
  }



  // -------------------- Check 1 --------------------
  // PART SIZE RULE
  // Check if part size is within machine size
  // if not return error


  const {
    max_allowed_part_size,
    min_allowed_part_size,
    part_quantity,
    threads_tapped_holes,
    per_hr_machine_rate_inr,
    tooling_id
  } = machine_details;

  const {
    bounding_box_volume,
    surface_area,
    bounding_box,
    predicted_cost
  } = part_details;


  const [maxAllowedPartSizeX, maxAllowedPartSizeY, maxAllowedPartSizeZ] = JSON.parse(max_allowed_part_size);

  const [minAllowedPartSizeX, minAllowedPartSizeY, minAllowedPartSizeZ] = JSON.parse(min_allowed_part_size);

  const [boundingBoxX, boundingBoxY, boundingBoxZ] = JSON.parse(bounding_box);

  const largestPartSize = Math.max(boundingBoxX, boundingBoxY, boundingBoxZ);
  const largestMachineSize = Math.max(maxAllowedPartSizeX, maxAllowedPartSizeY, maxAllowedPartSizeZ);

  const smallestPartSize = Math.min(boundingBoxX, boundingBoxY, boundingBoxZ);
  const smallestMachineSize = Math.min(minAllowedPartSizeX, minAllowedPartSizeY, minAllowedPartSizeZ);



  if (largestPartSize > largestMachineSize) {
    return res.json({
      status: "error",
      message: "PART SIZE IS LARGER FOR YOUR MACHINE",
      meta: {
        largestMachineSize,
        largestPartSize
      }
    });
  }

  if (smallestPartSize < smallestMachineSize) {
    return res.json({
      status: "error",
      message: "PART SIZE IS SMALLER FOR YOUR MACHINE",
      meta: {
        smallestMachineSize,
        smallestPartSize
      }
    });
  }


  // --------------------- Actual Calculation ---------------------
  //   1. per_hr_machine_rate_inr 
  //   2. tooling_id
  //   3. material
  //   4. sub_material
  //   -------------------------------
  //   1. predicted_cost
  //   2. 


  // calcualte Machining cost considering user input

  //@ MC = Machining cost considering user input
  const MC = (predicted_cost * per_hr_machine_rate_inr) / 280



  return res.json({
    status: "success",
    message: "Calculation started",
    // machine_details,
    // part_details,
    MC,
    x
  });
}

const average = (array) => array.reduce((a, b) => a + b) / array.length;


exports.matchPrice = async function (req, res) {

  const user_id = req.user.id;

  const partId = req.params.id;

  const {matchFor,data} = req.fields;






  var d =[], e=[],g=[],h=[]

  data.map((item, key) => {
    d.push(item.msaasPrice)
    e.push(item.msaasPrice50nos)
    g.push(item.cost)
    h.push(item.cost50nos)
  })

  const [d5, d6, d7, d8, d9, d10, d11, d12, d13, d14] = d;
  const [e5, e6, e7, e8, e9, e10, e11, e12, e13, e14] = e;
  const [g5, g6, g7, g8, g9, g10, g11, g12, g13, g14] = g;
  const [h5, h6, h7, h8, h9, h10, h11, h12, h13, h14] = h;


  const ratioForSingleQnty=[]

  
  const ratioFor50Qnty=[]

  data.map ((item, key) => {
    ratioForSingleQnty.push(d[key]/g[key])
    ratioFor50Qnty.push(d[key]/e[key])
  })
  const ratioForSingleQntyAvg_k15 = average(ratioForSingleQnty)
  const ratioFor50QntyAvg_l15 = average(ratioFor50Qnty)




  const multiplier =  matchFor=="userValue"?ratioFor50QntyAvg_l15:1



  const x_M22 = (7.5*ratioFor50QntyAvg_l15)/1.081









console.log('ratioFor50QntyAvg_l15',ratioFor50QntyAvg_l15);
console.log('x_M22',x_M22);
//user_id
  const part_details = await db("msaas_machine").where({ id: partId }).first();

  if (!part_details) {
    return res.json({
      status: "error",
      message: "Part not found",
      meta: {
        partId,
        user_id,
      }
    });
  }

  const newData ={
    machine_id: partId,
    user_id:user_id,
    c_per_unit: JSON.stringify(d),
    c_50_unit: JSON.stringify(e),
    ai_per_unit: JSON.stringify(g),
    ai_50_unit: JSON.stringify(h),
    ratio_1_qty: JSON.stringify(ratioForSingleQnty),
    ratio_50_qty: JSON.stringify(ratioFor50Qnty),
    ratio_1_qty_average: ratioForSingleQntyAvg_k15,
    ratio_50_qty_average: ratioFor50QntyAvg_l15,
    percentage: x_M22
  }

  const existingData = await db("price_matchings").where({ machine_id: partId }).first();
  if (existingData) {
    // Update existing data
    await db("price_matchings").where({ machine_id: partId }).update(newData);
  } else {
    // Insert new data
    await db("price_matchings").insert({ machine_id: partId, ...newData });
  }

  return res.json({
    status: "success",
    message: "Calculation started",
    // machine_details,
    meta: {
      partId,
      user_id,
      matchFor,
      d,
      e,
      g,
      h,
      ratioForSingleQnty,
      ratioFor50Qnty,
      ratioForSingleQntyAvg_k15,
      ratioFor50QntyAvg_l15,
      x_M22
    }
  });
}





