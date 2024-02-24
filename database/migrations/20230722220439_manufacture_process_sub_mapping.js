exports.up = function (knex) {
    return knex.schema.createTable("manufacture_process_sub_mapping", function (table) {
      // table.increments("manufacture_process_sub_mapping_id").primary();
      table.increments("id").primary();
      table.integer("manufacturer_id").unsigned().notNullable();
      //table.foreign("manufacturer_id").references("manufacture.manufacturer_id").onDelete("CASCADE");
      table.integer("process_id").unsigned().notNullable();
      //table.foreign("process_id").references("process.process_id").onDelete("CASCADE");
      table.integer("sub_process_id").unsigned().notNullable();
      // Add foreign key references for the "sub_process_id" column here
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("manufacture_process_sub_mapping");
  };