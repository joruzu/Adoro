module.exports = app => {
  const news = require("../controllers/news.controller.js");
  
  var router = require("express").Router();

  router.get("/news/", news.findAll);

  app.use('/api', router);
}