/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("partner_company_details", function (table) {
    table.increments("id").primary();
    // user id
    table.integer("user_id").unsigned().notNullable();
    // industry enum  CNC 3D_printing Conventional_lathe_machining Finishing Inspection
    // table.enu('industry', ['CNC', '3D_printing', 'Conventional_lathe_machining', 'Finishing', 'Inspection']).notNullable();
    table.string("industry").notNullable();
    // experience
    table.integer("experience").notNullable();
    // CERTIFICATIONS
    table.string("certifications").notNullable();
    // any other services
    table.string("other_processes").notNullable();
  });

  // partner_company_processes


};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("partner_company_details");
  
};
