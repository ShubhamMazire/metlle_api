exports.up = function (knex) {
    return knex.schema.createTable("manufacture_photos", function (table) {
      // table.increments("manufacture_photo_id").primary();
      table.increments("id").primary();
      table.string("photo_location", 100).notNullable();
      table.integer("manufacturer_id").unsigned().notNullable();
      //table.foreign("manufacturer_id").references("manufacture.manufacturer_id").onDelete("CASCADE");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("manufacture_photos");
  };