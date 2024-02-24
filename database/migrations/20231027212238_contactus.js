/*
{
    "firstName": "Nilesh",
    "lastName": "Mahajan",
    "email": "nileshnmahajan@gmail.com",
    "companyName": "Pressbuddy software solutions",
    "companySize": "51-200",
    "topic": "Technical Support",
    "message": "No need"
}
*/


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('contactus', function (table) {
        table.increments('id').primary();
        table.string('firstName').notNullable();
        table.string('lastName').notNullable();
        table.string('email').notNullable();
        table.string('companyName').notNullable();
        table.string('companySize').notNullable();
        table.string('topic').notNullable();
        table.string('message').notNullable();
        table.timestamps(true, true);
    });
  

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('contactus');
};
