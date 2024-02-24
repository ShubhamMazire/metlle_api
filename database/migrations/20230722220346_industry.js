exports.up = function (knex) {
    return knex.schema.createTable("industry", function (table) {
      // table.increments("industry_id").primary();
      table.increments("id").primary();
      table.string("industry_name", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("industry");
  };