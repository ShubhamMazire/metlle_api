exports.up = function (knex) {
    return knex.schema.createTable("request_quote", function (table) {
      // table.increments("request_quote_id").primary();
      table.increments("id").primary();
      table.datetime("request_date").notNullable();
      table.integer("user_id").unsigned().notNullable();
      table.string("status", 20).notNullable();
      table.datetime("request_last_updated_date").notNullable();
      table.float("predicted_cost").notNullable();
      table.float("volume").notNullable();
      table.float("area").notNullable();
      table.string("requested_stl_file_name", 50).notNullable();
      table.integer("msaas_machine_id").unsigned().notNullable();
  
      //table.foreign("user_id").references("user_id").inTable("users");
      //table.foreign("msaas_machine_id").references("msaas_machine_id").inTable("msaas_machine");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("request_quote");
  };
  