/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('order_items', function (table) {
        table.increments('id').primary();
        table.integer('order_id').unsigned().notNullable();
        table.integer('item_id').unsigned().notNullable();
        table.integer('quantity').unsigned().notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.timestamps(true, true);
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
