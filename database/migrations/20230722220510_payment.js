exports.up = function (knex) {
    return knex.schema.createTable("payment", function (table) {
      // table.increments("payment_id").primary();
      table.increments("id").primary();
      table.integer("payment_method_details_id").unsigned().notNullable();
      // Add foreign key references for the "payment_method_details_id" column here
      table.integer("order_id").unsigned().notNullable();
      // Add foreign key references for the "order_id" column here
      table.string("status", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("payment");
  };