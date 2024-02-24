exports.up = function (knex) {
    return knex.schema.createTable("payment1_details", function (table) {
      // table.increments("payment1_details_id").primary();
      table.increments("id").primary();
      table.string("Name_on_card", 50).notNullable();
      table.integer("card_number").notNullable();
      table.datetime("expiry_date").notNullable();
      table.integer("payment_method_id").unsigned().notNullable();
      // Add foreign key references for the "payment_method_id" column here
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("payment1_details");
  };