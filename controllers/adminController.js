const db = require("../database/db");
const { stl2png } = require("@scalenc/stl-to-png");

const { configs } = require("../common/util");

const { myIp } = configs;

// const flask_path="http://3.111.137.87/process-model"

const rand = () => {
  return Math.random().toString(36).substr(2);
};

// login

exports.login = async function (req, res) {
  const fields = req.fields;

  fields.password = Buffer.from(fields.user_password).toString("base64");

  const { user_email_id, password } = req.fields;

  const user = await db("user_table")
    .where({ user_email_id: user_email_id, user_password: password, role: "admin" })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    const token = rand() + rand();
    await db("user_table")
      .where({ user_email_id: user_email_id })
      .update({ token: token })
      .catch((err) => {
        console.log(err);
      });

    res.json({
      status: "success",
      message: "Login Successfull",
      user: {
        user_id: user[0].id,
        user_name: user[0].user_full_name,
        user_email: user[0].user_email_id,
        user_role: user[0].role,
      },
      token: token,
    });
  } else {
    res.json({
      status: "error",
      message: "Invalid Credentials",
      fields,
    });
  }
};

exports.customers = async function (req, res) {
  const results = await db("user_table").where({
    role: "customer",
  });

  res.json({
    status: "success",
    data: results,
  });
};

exports.manufacturers = async function (req, res) {
  const results = await db("user_table").where({
    role: "partner",
  });

  res.json({
    status: "success",
    data: results,
  });
};

exports.msaas = async function (req, res) {
  const results = await db("user_table").where({
    role: "msas",
  });

  res.json({
    status: "success",
    data: results,
  });
};

// rfqList

exports.rfqList = async function (req, res) {
  const results = await db("quote_requests").where({
    quote_type: "manual_generated",
  });

  res.json({
    status: "success",
    data: results,
  });
};

// ordered

exports.ordered = async function (req, res) {
  const results = await db("quote_requests").where({
    status: "ordered",
  });

  res.json({
    status: "success",
    data: results,
  });
};

// dashboard

exports.dashboard = async function (req, res) {
  // diiferent metrics no of part orderd quoted in rfq no og custoemrs no of manufacturers no of msaas users , to tal no of part proccessed no of part under process

  const total_part_count = await db("quote_requests").count(
    "id as total_part_count"
  );

  const total_customer_count = await db("user_table")
    .count("id as total_customer_count")
    .where({ role: "customer" });

  const total_manufacturer_count = await db("user_table")
    .count("id as total_manufacturer_count")
    .where({ role: "partner" });

  const total_msaas_count = await db("user_table")
    .count("id as total_msaas_count")
    .where({ role: "msas" });

  const total_part_ordered = await db("quote_requests")
    .count("id as total_part_processed")
    .where({ status: "ordered" });

  // status is finalized or ordered

  const total_part_processed = await db("quote_requests")
    .count("id as total_part_processed")
    .where({ status: "finalized" })
    .orWhere({ status: "ordered" });

  const total_part_under_process = await db("quote_requests")
    .count("id as total_part_under_process")
    .where({ status: "processing" });

  const total_part_manual_quoted = await db("quote_requests")
    .count("id as total_part_quoted")
    .where({ quote_type: "manual_generated" });

  const total_part_auto_quoted = await db("quote_requests")
    .count("id as total_part_auto_quoted")
    .where({ quote_type: "auto_generated" });

  res.json({
    status: "success",
    data: {
      total_part_count: total_part_count[0].total_part_count,
      total_customer_count: total_customer_count[0].total_customer_count,
      total_manufacturer_count:
        total_manufacturer_count[0].total_manufacturer_count,
      total_msaas_count: total_msaas_count[0].total_msaas_count,
      total_part_ordered: total_part_ordered[0].total_part_ordered,
      total_part_processed: total_part_processed[0].total_part_processed,
      total_part_under_process:
        total_part_under_process[0].total_part_under_process,
      total_part_manual_quoted: total_part_manual_quoted[0].total_part_quoted,
      total_part_auto_quoted: total_part_auto_quoted[0].total_part_auto_quoted,
    },
  });
};
