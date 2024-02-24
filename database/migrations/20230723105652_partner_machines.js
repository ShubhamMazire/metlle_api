/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("partner_machines", function (table) {
    table.increments("id").primary();
    // user id
    table.integer("user_id").unsigned().notNullable();
    // machine type
    table
      .enu("process", [
        "cnc_turning",
        "cnc_milling",
        "conventional_lathe_machining",
        "fused_deposition_modeling",
        "stereolithography",
        "selective_laser_sintering",
        "metal_3d_printing",
        "finishing",
        "co_ordinate_measuring_machine",
      ])
      .notNullable();
    // machine photo
    table.string("model_make", 20).notNullable();

    table.string("max_allowed_part_size", 20).notNullable();
    table.string("min_allowed_part_size", 20).notNullable();

    table.float("finest_surface_roughness").notNullable();
    table.float("finest_acheivable_tolerance").notNullable();

    table.float("max_machinable_hardness").notNullable();

    // maximum speed
    table.float("max_speed").notNullable();

    // status enable or disable

    table.boolean("status").defaultTo(true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
