exports.up = function (knex) {
    return knex.schema.createTable("msaas", function (table) {
      // table.increments("msaas_id").primary();
      table.increments("id").primary();
      table.integer("experience").notNullable();
      table.string("certificate", 20).notNullable();
      table.string("additional_notes", 500).notNullable();
      table.integer("user_id").unsigned().notNullable();
      //table.foreign("user_id").references("users.user_id").onDelete("CASCADE");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("msaas");
  };
  