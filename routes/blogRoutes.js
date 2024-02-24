
"use strict";

const { userAuth } = require("../middleware/auth");

module.exports = function (app) {

    var routes = require("../controllers/blogController");

    /*
          Route::get("/blog", "BlogController@index");             // list                   
          Route::get("/blog/{id}", "BlogController@show");         // show one item details    
          Route::post('/blog', 'BlogController@store');            // create new item          
          Route::post('/blog/edit/{id}', 'BlogController@update'); // update item            
          Route::delete('/blog/{id}', 'BlogController@destroy');   // delete item              
    */


// get all blogs
    app.route("/api/blogs").get(routes.list);

    // get single blog
    app.route("/api/blogs/:id").get(routes.show);

    // create new blog
    app.route("/api/blogs").post(userAuth, routes.create);

    // update blog

    app.route("/api/blogs/:id").put(userAuth, routes.update);

    // delete blog

    app.route("/api/blogs/:id").delete(userAuth, routes.delete);

}

