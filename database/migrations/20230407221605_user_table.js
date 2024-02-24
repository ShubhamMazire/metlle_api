/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
/*
 `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_full_name` varchar(100) NOT NULL,
  `company_name` varchar(50) NOT NULL,
  `user_email_id` varchar(50) NOT NULL,
  `user_password` varchar(50) NOT NULL,
  `city` varchar(20) NOT NULL,
  `user_creation_date` datetime NOT NULL,
  `user_last_update_date` datetime NOT NULL,
  `address` varchar(50) NOT NULL,
  `industry_id` int(11) NOT NULL,
  `contact_number` int(11) NOT NULL,
  `address_pincode` int(11) NOT NULL,
  `country` varchar(20) NOT NULL,
  `token` varchar(56) DEFAULT NULL,
  `state` varchar(20) NOT NULL,
  `gst_number` varchar(20) NOT NULL,
  `user_type_id` int(11) NOT NULL,
  `status` varchar(10) NOT NULL,
  `credit` float NOT NULL,
  `pincode` int(6) DEFAULT NULL,*/

exports.up = function (knex) {
  return knex.schema.createTable("user_table", function (table) {
    table.increments("id").primary();
    table.enu("role", ['admin','msas','partner','customer']).defaultTo("customer");
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
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("user_table");
};
