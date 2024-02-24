exports.up = function (knex) {
    return knex.schema.createTable("quote_request", function (table) {
      // table.increments("request_id").primary();
      table.increments("id").primary();
      table.datetime("request_date").notNullable();
      table.integer("user_id").unsigned().notNullable();
      table.string("status", 20).notNullable();
      table.datetime("request_last_updated_time").notNullable();
      table.float("packing_cost").notNullable();
      table.float("shipping_cost").notNullable();
      table.integer("promo_code").unsigned().notNullable();
      table.float("gst").notNullable();
      table.float("total_price").notNullable();
  
      //table.foreign("user_id").references("user_id").inTable("users");
      //table.foreign("promo_code").references("promo_code").inTable("promotions");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("quote_request");
  };
  