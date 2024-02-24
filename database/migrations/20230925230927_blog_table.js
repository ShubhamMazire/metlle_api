/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

//'title', 'description', 'cover_image', 'status', 'content',
exports.up = function(knex) {
    return knex.schema.createTable('blog', table => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('description').nullable();
        table.string('cover_image').nullable();
        table.boolean('status').notNullable();
        table.string('content').notNullable();
        table.timestamps(true, true);
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

    return knex.schema.dropTable('blog');
  
};
