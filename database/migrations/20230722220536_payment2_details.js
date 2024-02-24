exports.up = function (knex) {
    return knex.schema.createTable("payment2_details", function (table) {
      // table.increments("payment2_details_id").primary();
      table.increments("id").primary();
      table.integer("account_number").notNullable();
      table.string("bank_name", 50).notNullable();
      table.string("ifsc", 20).notNullable();
      table.integer("payment_method_id").unsigned().notNullable();
      // Add foreign key references for the "payment_method_id" column here
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("payment2_details");
  };