exports.up = function (knex) {
    return knex.schema.createTable('branches', function (table) {
      table.increments('id').primary();
      table.integer('CompanyId').unsigned().notNullable();
      table.string('BranchName').notNullable();
      table.string('AddressLine1').notNullable();
      table.string('AddressLine2').notNullable();
      table.string('City').notNullable();
      table.string('State').notNullable();
      table.integer('PinCode').unsigned();
      table.string('Phone').notNullable();
      
      // created_at, updated_at
      table.timestamps(true, true);

    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('branches');
  };