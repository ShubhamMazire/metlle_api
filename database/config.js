const env = process.env;

const config = {
  db: {
    host: env.DB_HOST || "127.0.0.1",
    port: 3306,
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME || "metlle-db",
  },
  listPerPage: env.LIST_PER_PAGE || 10,
};

module.exports = config;

/*

    host: env.DB_HOST || "217.21.84.154",
    port: 3306,
    user: env.DB_USER || "u946054600_metlle",
    password: env.DB_PASSWORD || "MiM9N*~[|7",
    database: env.DB_NAME || "u946054600_metlle",
    
    host: env.DB_HOST || "52.66.107.82",
    port: 3306,
    user: env.DB_USER || "vivek-web",
    password: env.DB_PASSWORD || "13121312",
    database: env.DB_NAME || "metlle-db",


    */


    // db: {
    //   host: env.DB_HOST || "52.66.107.82",
    //   port: 3306,
    //   user: env.DB_USER || "vivek-web",
    //   password: env.DB_PASSWORD || "13121312",
    //   database: env.DB_NAME || "metlle-db",
    // },
    // listPerPage: env.LIST_PER_PAGE || 10,