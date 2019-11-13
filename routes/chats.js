const express = require("express");

const request = require("request");

let db = require("../utilities/utils").db;

var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.post("/", (req, res) => {
  let memberId = req.body["memberId"];

  let query = `Select Chats.ChatID, Chats.Name, RecentMessage.Message, RecentMessage.Timestamp From Chats
  Inner Join ChatMembers On Chats.ChatId = ChatMembers.ChatId
  Left Join (Select Distinct On (ChatId) ChatId, Message, Timestamp From Messages Order By ChatId, Timestamp) As RecentMessage
  On Chats.ChatID = RecentMessage.ChatID
  Where ChatMembers.MemberId = $1`
  if (memberId) {

    db.manyOrNone(query, [memberId])
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
        });
      });
  } else {
    res.send({
      success: false,
      message: "missing memberId"
    });
  }
});

module.exports = router;