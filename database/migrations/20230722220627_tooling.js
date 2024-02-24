exports.up = function (knex) {
    return knex.schema.createTable("tooling", function (table) {
      // table.increments("tooling_id").primary();
      table.increments("id").primary();
      table.string("tooling", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("tooling");
  };