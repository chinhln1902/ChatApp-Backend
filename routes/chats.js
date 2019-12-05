const express = require("express");

const request = require("request");

let db = require("../utilities/utils").db;

var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.post("/", (req, res) => {
  let memberId = req.body["memberId"];

  let query = `Select Chats.ChatID, RecentMessage.Message, RecentMessage.Timestamp From Chats
  Inner Join ChatMembers On Chats.ChatId = ChatMembers.ChatId
  Left Join (Select Distinct On (ChatId) ChatId, Message, Timestamp From Messages Order By ChatId, Timestamp DESC) As RecentMessage
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

router.post('/createChat', (req, res) => {
  let chatName = req.body["chatName"];
  
  let query = `INSERT INTO Chats(Name) VALUES ($1)`
  db.none(query, [chatName])
    .then(() => {
      res.send({
        success: true,
        message: "created new chat"
      })
    }).catch((err) => {
      res.send({
        success: false,
        error: err
      })
    });
});

//Add friend to new chat
router.post('/addFriendToChat', (req, res) => {

  let memberID = req.body["contactID"];

  let query1 = `INSERT INTO ChatMembers(ChatID, MemberID) VALUES ($1, $2)`
  let query2 = `SELECT ChatID 
                FROM CHATS
                ORDER BY ChatID DESC LIMIT 1`
  db.one(query2)
    .then((data) => {
      db.none(query1, [data.chatid, memberID])
        .then(() => {
          res.send({
            success: true,
            message: "new chat created successfully",
            chatid: data.chatid
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
});

router.get('/getNewestChatId', (req, res) => {
  let query = `SELECT ChatID 
                FROM CHATS
              ORDER BY ChatID DESC LIMIT 1`
  db.one(query)
    .then((data) => {
      res.send({
        success: true,
        chatid: data.chatid
      })
      }).catch((err) => {
        res.send({
          success: false,
          error: err
        });
    })
});
module.exports = router;