exports.up = function (knex) {
    return knex.schema.createTable('compnay', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.enu('Industry', [
        'Advertising',
        'Agriculture Industry',
        'Communications Industry',
        // ... (add all the industry values here)
      ]).notNullable();
      table.string('Website').notNullable();
      table.string('ContactEmail').notNullable();
       table.timestamps(true, true);
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('compnay');
  };