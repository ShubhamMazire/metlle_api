exports.up = function (knex) {
    return knex.schema.createTable("quote_requests", function (table) {
      table.increments("id").primary();
      table.integer("user_id").unsigned().notNullable();
      table.datetime("requested_part_date").nullable();
      table.datetime("last_updated_date").nullable();
      table.datetime("finalized_date").nullable();

      table.string("file_path", 50).nullable();
      table.enu("quote_type", ["auto_generated", "manual_generated"]).nullable();      
      table.enu("status", ["pending", "processing","finalized"]).nullable();

      // calculated by flask api
      table.float("irmr").nullable();
      table.float("surface_area").nullable();
      table.string("bounding_box", 50).nullable();
      table.float("predicted_cost").nullable();
      table.float("volume").nullable();
      //---------------------------------------------------------------------------------

      // after api for quote request

      table.string("process", 50).nullable();
      table.string("material", 50).nullable();

      table.float("surface_roughness").nullable();

      table.float("tolerances").nullable();
      table.string("finishing", 50).nullable();

      table.string("threads", 50).nullable();
      table.string("inspection", 50).nullable();

      table.integer("parts_quantity").nullable();
      table.string("target_price_per_pcs").nullable();
      table.string("sub_grade_material", 50).nullable();



      // ------------------------ after quote request per parts


      //------------------ After calculations

      table.float("machine_cost").nullable();
      table.float("weight_of_part").nullable();
      table.float("material_cost").nullable();
      table.float("cost_before_quantity").nullable();
      table.float("cost_after_quantity").nullable();
      table.float("overhead").nullable();
      table.float("profit").nullable();
      table.float("final_cost").nullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("quote_requests");
  };