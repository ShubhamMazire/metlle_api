exports.up = function (knex) {
    return knex.schema.createTable("manufacture", function (table) {
      // table.increments("manufacturer_id").primary();
      table.increments("id").primary();
      table.integer("experience").notNullable();
      table.string("manufacture_status", 50).notNullable();
      table.string("certifications", 50).notNullable();
      table.string("additional_notes", 500).notNullable();
      table.integer("user_id").unsigned().notNullable();
      //table.foreign("user_id").references("users.user_id").onDelete("CASCADE");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("manufacture");
  };