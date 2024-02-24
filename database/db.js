// const mysql = require("mysql2/promise");
const config = require("./config");

// async function query(sql, params) {
//   const connection = await mysql.createConnection(config.db);
//   const [results] = await connection.execute(sql, params);
//   return results;
// }

const conn = require("knex")({
  client: "mysql",
  connection: config.db,
});

module.exports = conn;

//knex migrate:make migration_name 

//Once you have finished writing the migrations, you can update the database matching your NODE_ENV by running:
//knex migrate:latest