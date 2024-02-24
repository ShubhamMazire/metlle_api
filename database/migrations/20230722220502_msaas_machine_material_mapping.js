exports.up = function (knex) {
    return knex.schema.createTable("msaas_machine_material_mapping", function (table) {
      // table.increments("msaas_machine_material_mapping_id").primary();
      table.increments("id").primary();
      table.integer("msaas_id").unsigned().notNullable();
      // Add foreign key references for the "msaas_id" column here
      table.integer("machine_material_id").unsigned().notNullable();
      // Add foreign key references for the "machine_material_id" column here
      table.integer("machine_sub_material_id").unsigned().notNullable();
      // Add foreign key references for the "machine_sub_material_id" column here
      table.integer("msaas_machine_id").unsigned().notNullable();
      // Add foreign key references for the "msaas_machine_id" column here
      table.float("sub_material_price_per_kg").notNullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("msaas_machine_material_mapping");
  };
  