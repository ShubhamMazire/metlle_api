exports.up = function (knex) {
    return knex.schema.createTable("shipment_order", function (table) {
      table.increments("id").primary();
      table.integer("order_id").unsigned().notNullable();
      table.integer("request_id").unsigned().notNullable();
      table.datetime("order_creation_date").notNullable();
      table.string("order_status", 25).notNullable();
      table.string("order_description", 500).notNullable();
      table.integer("manufacturer_id").unsigned().notNullable();
      table.string("shipping_address", 100).notNullable();
      table.string("billing_address", 100).notNullable();
  
      //table.foreign("request_id").references("request_id").inTable("quote_request");
      //table.foreign("manufacturer_id").references("manufacturer_id").inTable("manufacture");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("shipment_order");
  };