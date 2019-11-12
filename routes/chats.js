const express = require("express");

const request = require("request");

let db = require("../utilities/utils").db;

var router = express.Router();
// const bodyParser = require("body-parser");
// router.use(bodyParser.json());

router.get("/", (req,res) => {
  db.manyOrNone("SELECT * FROM Chats")
  .then((data) => {
    res.send({
      success: true,
      names: data
    });
  }).catch((error) => {
    console.log(error);
    res.send({
      success: false,
      error: error
    })
  });
});

module.exports = router;