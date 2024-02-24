exports.up = function (knex) {
    return knex.schema.createTable("promotions", function (table) {
      table.increments("id").primary();
      table.string("promo_code","15");
      table.string("promo_name", 20).notNullable();
      table.string("status", 10).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("promotions");
  };