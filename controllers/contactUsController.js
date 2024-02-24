const Printer = require("pdfmake");
const path = require("path");
const db = require("../database/db");
const moment = require("moment");

const translator = require("../common/translator");




exports.addContactUs = async (req, res) => {
    try {
        const { firstName, lastName, email, companyName, companySize, topic, message } = req.fields;
        const contactUs = await db("contactus").insert({
            firstName,
            lastName,
            email,
            companyName,
            companySize,
            topic,
            message,
        });
        if (contactUs) {
            return res.status(200).json({ message: "ContactUs added successfully" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}

exports.getContactUs = async (req, res) => {

    try {
        const contactUs = await db("contactus").select("*");
        if (contactUs) {
            return res.status(200).json({status:"success",message:"", data:contactUs });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }




}

