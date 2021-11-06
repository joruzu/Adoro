const db = require("../models/mongo");
const News = db.news;

exports.findAll = (req, res) => {
  News.find().sort({isoDate: -1}).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send({
      message: err.message || "error while retrieving"
    });
  });
};