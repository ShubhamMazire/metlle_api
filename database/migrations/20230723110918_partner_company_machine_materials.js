/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  
    return knex.schema.createTable("partner_machine_materials", function (table) {

        table.increments("id").primary();
        // machine id
        table.integer("machine_id").unsigned().notNullable();

        table
        .enu("material", [
            "aluminium",
            "plain_carbon_steel",
            "alloy_steel",
            "tool_steel",
            "stainless_steel",
            "copper_alloy",
            "titanium",
            "super_alloys",
            "engineering_plastics",
            "pla",
            "ptfe",
            "petg",
            "abs",
            "nylon",
            "other"
        ])
        .notNullable();
    });

};




/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable("partner_machine_materials");
  
};
