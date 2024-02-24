exports.up = function (knex) {
    return knex.schema.createTable("payment_method", function (table) {
      // table.increments("payment_method_id").primary();
      table.increments("id").primary();
      table.string("payment_method_name", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("payment_method");
  };