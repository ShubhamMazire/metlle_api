const db = require("../database/db");

exports.withGuest = async (req, res, next) => {
  const authorization = req.headers.authorization?req.headers.authorization:"0";

  const user = await db("user_table")
    .where({ token: authorization })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    req.user = user[0];
    next();
  } else {
    req.user = {
      id: 0,
      name: "Guest",
    }
    console.log('hii');
    next();
  }
};
