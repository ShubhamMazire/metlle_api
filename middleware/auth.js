const db = require("../database/db");

exports.userAuth = async (req, res, next) => {
  const authorization = req.headers.authorization ?? "0";
  const user = await db("user_table")
    .where({ token: authorization })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0) {
    req.user = user[0];
    next();
  } else {
    return res.writeHead(401, { "Content-Type": "application/json" }).end(
      JSON.stringify({
        status: "error",
        message: "Unauthorized Access",
        token: authorization,
        headers: req.headers,
      })
    );
  }
};

// adminAuth

exports.adminAuth = async (req, res, next) => {
  const authorization = req.headers.authorization ?? "0";
  const user = await db("user_table")
    .where({ token: authorization })
    .catch((err) => {
      console.log(err);
    });

  if (user && user.length > 0 && user[0].role === "admin") {
    req.user = user[0];
    next();
  } else {
    return res.writeHead(401, { "Content-Type": "application/json" }).end(
      JSON.stringify({
        status: "error",
        message: "Unauthorized Access",
        token: authorization,
        headers: req.headers,
      })
    );
  }
};
