exports.up = function (knex) {
    return knex.schema.createTable("manufacture_machine_material_mapping", function (table) {
      // table.increments("manufacture_machine_material_mapping_id").primary();
      table.increments("id").primary();
      table.integer("manufacture_machine_id").unsigned().notNullable();
      //table.foreign("manufacture_machine_id").references("manufacture_machine.manufacure_machine_id").onDelete("CASCADE");
      table.integer("machine_material_id").unsigned().notNullable();
      //table.foreign("machine_material_id").references("machine_materials.machine_material_id").onDelete("CASCADE");
      table.integer("manufacturer_id").unsigned().notNullable();
      //table.foreign("manufacturer_id").references("manufacture.manufacturer_id").onDelete("CASCADE");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("manufacture_machine_material_mapping");
  };