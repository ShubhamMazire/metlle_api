exports.up = function (knex) {
    return knex.schema.createTable("users", function (table) {
      // table.increments("user_id").primary();
      table.increments("id").primary();
      table.string("first_name", 50).notNullable();
      table.string("last_name", 50).notNullable();
      table.string("email", 100).notNullable();
      table.string("password", 100).notNullable();
      table.string("contact_number", 15).notNullable();
      table.string("address", 100).notNullable();
      table.string("user_type", 20).notNullable();
      // table role enum ('admin', 'msas', 'partner', 'customer')
      table.enu('role', ['admin', 'msas', 'partner', 'customer']).notNullable().defaultTo('customer'); 
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("users");
  };