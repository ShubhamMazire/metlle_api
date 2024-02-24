/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable("partner_company_processes", function (table) {
        table.increments("id").primary();
        // user id
        table.integer("user_id").unsigned().notNullable();
        // process enum
        table
          .enu("process", [
            "CNC",
            "3D_printing",
            "Conventional_lathe_machining",
            "Finishing",
            "Inspection",
          ])
          .notNullable();
    
        // sub process
        table.string("sub_process").notNullable();
      });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

    return knex.schema.dropTable("partner_company_processes");
  
};
