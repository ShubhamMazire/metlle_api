exports.up = function (knex) {
    return knex.schema.createTable("msaas_machine", function (table) {
      // table.increments("msaas_machine_id").primary();
      table.increments("id").primary();
      table.string("machine", 20).notNullable();
      table.integer("msass_id").unsigned().notNullable();
      // Add foreign key references for the "msass_id" column here
      table.string("machine_status", 20).notNullable();
      table.string("model_make", 20).notNullable();
      table.string("max_allowed_part_size", 20).notNullable();
      table.string("min_allowed_part_size", 20).notNullable();
      table.float("finest_surface_roughness").notNullable();
      table.float("finest_acheivable_tolerance").notNullable();
      table.float("max_machinable_hardness").notNullable();
      table.integer("machine_age").notNullable();
      table.float("per_hr_machine_rate_inr").notNullable();
      table.integer("part_quantity").notNullable();
      table.integer("msaas_machine_material_mapping_id").unsigned().notNullable();
      // Add foreign key references for the "msaas_machine_material_mapping_id" column here
      table.integer("tooling_id").unsigned().notNullable();
      // Add foreign key references for the "tooling_id" column here
      table.integer("threads_tapped_holes").notNullable();
      table.integer("process_id").unsigned().notNullable();
      // Add foreign key references for the "process_id" column here
      table.float("max_power").notNullable();
      table.float("max_rpm").notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("msaas_machine");
  };