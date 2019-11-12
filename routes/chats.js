const express = require("express");

const request = require("request");

let db = require("../utilities/utils").db;

var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.post("/", (req, res) => {
  let memberId = req.body["memberId"];

  if (memberId) {
    db.manyOrNone("SELECT * FROM ChatMembers, Chats WHERE Chats.chatid = ChatMembers.chatid AND memberID = $1", [memberId])
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
  } else {
    res.send({
      success: false,
      message: "missing memberId"
    })
  }
});

module.exports = router;