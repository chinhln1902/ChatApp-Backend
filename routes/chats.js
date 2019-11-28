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
  Where ChatMembers.MemberId = $1
  Order By RecentMessage.Timestamp DESC`
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


//Create new chat
router.post('/create', (req, res) => {
    let chatName = req.body["chatName"];
    
    let memberID = req.body["contactID"];

    let query1 = `INSERT INTO Chats(Name) VALUES ($1)`
    let query2 = `INSERT INTO ChatMembers(ChatID, MemberID) VALUES ($1, $2)`

    db.none(query1, [chatName])
      .then(() => {
        db.one(`SELECT ChatID 
        FROM CHATS
        ORDER BY ChatID DESC LIMIT 1`)
          .then((data) => {
            db.none(query2, [data.chatid, memberID])
              .then(() => {
                res.send({
                  success: true,
                  message: "new chat created successfully"
                })
              }).catch((err) => {
                res.send({
                  success: false,
                  error: err
                })
              });
          }).catch((err) => {
            res.send({
              success: false,
              error: err
            })
          });
      }).catch((err) => {
        res.send({
          success: false,
          error: err
        })
      });
});

module.exports = router;