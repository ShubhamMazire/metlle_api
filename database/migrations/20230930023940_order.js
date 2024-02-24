/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('order', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.enum('status', ['created', 'processing', 'completed', 'cancelled']).defaultTo('created');
        table.timestamps(true, true);
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('order');
};
