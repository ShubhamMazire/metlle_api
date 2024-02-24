/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(
    "partner_company_photos",
    function (table) {
      table.increments("id").primary();
      // user id
      table.integer("user_id").unsigned().notNullable();

      // picture path
      table.string("picture_path", 255).notNullable();
    }
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

    return knex.schema.dropTable("partner_company_photos");

};
