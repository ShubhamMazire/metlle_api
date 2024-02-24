
const axios = require("axios");
const FormData = require("form-data");
const { stl2png } = require("@scalenc/stl-to-png");
const path = require("path");
const fs = require("fs-extra");
const db = require("../database/db");
const { configs } = require("../common/util");

const { myIp } = configs;


const isFileValid = (file) => {
    // ALLOWED_EXTENSIONS are .stl and .step
    if (!file.name) return false;

    const extensions = [".jpg", ".jpeg", ".png", ".gif"];

    if (!extensions.includes(path.extname(file.name))) return false;

    return true;
};


exports.list = async function (req, res) {

    const blogs = await db("blog").select("*").orderBy("id", "desc");

    return res.json({
        status: "success",
        message: "Blogs fetched successfully",
        data: blogs,
    });


}



exports.show = async function (req, res) {

    const { id } = req.params;

    const blog = await db("blog").where({ id }).first();

    return res.json({
        status: "success",
        message: "Blog fetched successfully",
        data: blog,
    });

}


// create

exports.create = async function (req, res) {



    const { title, description, content } = req.fields;
    const { image } = req.files;


    // validate fields

    if (!title || !description || !content || !image) {
        return res.status(400).json({
            message: "All fields are required",
            fields: req.fields,
            files: req.files,

        });
    }






    var valid = true;
    // itrate object and move file to uploads folder

    if (!isFileValid(image)) {
        return res.json({
            status: "error",
            message: "Invalid file type",
        });
    }

    var newFileName = "";

    var response = null;
    var newFilePath = "";
    var temp_path = "";

    error = false;

    var fileName = "";



    const fileDir = path.join(__dirname, "../../uploads/blogs");
    const file = image;
    newFileName = "blogs/" + Date.now() + path.extname(file.name);
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


    if (error)
        return res.json({
            status: "error",
            message: "Error while moving file",
            data: error,
        });

    // Call api http://127.0.0.1:5000/ send file and get response

    const dbObj = {
        title,
        description,
        cover_image: newFileName,
        status: 1,
        content,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const id = await db("blog").insert(dbObj);

    dbObj.id = id;

    return res.json({
        status: "success",
        message: "Blog created successfully",
        data: dbObj,
    });

}

// update

exports.update = async function (req, res) {

    const { title, description, content } = req.fields;
    const { image } = req.files;
    const { id } = req.params;

    // validate fields

    if (!title || !description || !content) {
        return res.json({
            status: "error",
            message: "Check require feild",
            fields: req.fields,
            files: req.files,

        });
    }

    var newFileName = null;

    if (image.filename) {

        var valid = true;
        // itrate object and move file to uploads folder

        if (!isFileValid(image)) {
            return res.json({
                status: "error",
                message: "Invalid file type",
            });
        }



        var newFilePath = "";
        var temp_path = "";

        error = false;

        var fileName = "";


        const fileDir = path.join(__dirname, "../../uploads/blogs");
        const file = image;
        newFileName = "blogs/" + Date.now() + path.extname(file.name);
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


        if (error)
            return res.json({
                status: "error",
                message: "Error while moving file",
                data: error,
            });


    }

    // Call api http://

    const dbObj = {
        title,
        description,

        status: 1,
        content,
        updated_at: new Date(),
    };

    if (newFileName)
        dbObj.cover_image = newFileName;

    await db("blog").where({ id }).update(dbObj);

    dbObj.id = id;

    return res.json({
        status: "success",
        message: "Blog updated successfully",
        data: dbObj,
    });



}

// delete

exports.delete = async function (req, res) {


    const { id } = req.params;

    await db("blog").where({ id }).delete();

    return res.json({
        status: "success",
        message: "Blog deleted successfully",
    });

}

