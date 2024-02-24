exports.up = function (knex) {
    return knex.schema.createTable("machine_materials", function (table) {
      // table.increments("machine_material_id").primary();
      table.increments("id").primary();
      table.string("machine", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("machine_materials");
  };