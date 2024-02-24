exports.up = function (knex) {
    return knex.schema.createTable("manufacture_machine", function (table) {
      // table.increments("manufacure_machine_id").primary();
      table.increments("id").primary();
      table.string("machine", 20).notNullable();
      table.string("machine_status", 20).notNullable();
      table.string("model_make", 20).notNullable();
      table.string("max_allowed_part_size", 20).notNullable();
      table.string("min_allowed_part_size", 20).notNullable();
      table.float("finest_surface_roughness").notNullable();
      table.float("finest_acheivable_tolerance").notNullable();
      table.float("max_acheivable_hardness").notNullable();
      table.float("machine_avg").notNullable();
      table.integer("machine_material_id").unsigned().notNullable();
      //table.foreign("machine_material_id").references("machine_materials.machine_material_id").onDelete("CASCADE");
      table.integer("process_id").unsigned().notNullable();
      //table.foreign("process_id").references("process.process_id").onDelete("CASCADE");
      table.string("sub_process", 20).notNullable();
      table.integer("manufacturer_id").unsigned().notNullable();
      //table.foreign("manufacturer_id").references("manufacture.manufacturer_id").onDelete("CASCADE");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("manufacture_machine");
  };