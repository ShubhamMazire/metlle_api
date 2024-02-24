exports.up = function (knex) {
    return knex.schema.createTable("machine_sub_materials", function (table) {
      // table.increments("machine_sub_material_id").primary();
      table.increments("id").primary();
      table.string("material", 20).notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("machine_sub_materials");
  };
  