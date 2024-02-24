// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

const config = require("./config");

module.exports = {
  development: {
    client: "mysql",
    connection: config.db,
  },

  staging: {
    client: "mysql",
    connection: config.db,
  },

  production: {
    client: "mysql",
    connection: config.db,
  },
};
