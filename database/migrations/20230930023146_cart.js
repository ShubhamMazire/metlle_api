/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('cart', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
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
    return knex.schema.dropTable('cart');
};
