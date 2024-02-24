exports.up = function (knex) {
    return knex.schema.createTable("user_type", function (table) {
      // table.increments("user_type_id").primary();
      table.increments("id").primary();
      table.string("user_type", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("user_type");
  };
  