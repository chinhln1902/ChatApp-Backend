//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();
const bodyParser = require("body-parser");

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

let msg_functions = require('../utilities/utils').messaging;

//send a message to all users "in" the chat session with chatId
router.post("/send", (req, res) => {
    let memberId = req.body['memberId'];
    let message = req.body['message'];
    let chatId = req.body['chatId'];
    if (!memberId || !message || !chatId) {
        res.send({
            success: false,
            error: "memberId, message, or chatId not supplied"
        });
        return;
    }
    let selectSender = "SELECT MemberId, Username, ProfileUri FROM Members WHERE memberId = $1";
    //add the message to the database
    let insert = "INSERT INTO Messages(ChatId, Message, MemberId) SELECT $1, $2, MemberId FROM Members WHERE memberId=$3";
    db.none(insert, [chatId, message, memberId])
        .then(() => {
            db.one(selectSender, [memberId])
                .then(data => {
                    let username = data['username'];
                    let senderId = data['memberid'];
                    let profileuri = data['profileuri'];
                    //send a notification of this message to ALL members with registered tokens
                    db.manyOrNone('SELECT * FROM Push_Token WHERE MemberID IN (SELECT MemberID FROM ChatMembers Where ChatID=$1)', [chatId])
                        .then(rows => {
                            rows.forEach(element => {
                                msg_functions.sendToIndividual(element['token'], message, username, chatId, senderId, profileuri);
                            });
                            res.send({
                                success: true,
                            });
                        }).catch(err => {
                            res.send({
                                success: false,
                                error: err,
                            });
                        })
                }).catch((err) => {
                    res.send({
                        success: false,
                        error: err,
                    });
                });
        }).catch(err => {
            res.send({
                success: false,
                error: err,
            });
        });

});
//Get all of the messages from a chat session with id chatid
router.post("/getAll", (req, res) => {
    let chatId = req.body['chatId'];

    let query = `SELECT Members.Username, Members.MemberId, Messages.Message,
                to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US' )
                AS Timestamp, Members.ProfileUri FROM Messages
                INNER JOIN Members ON Messages.MemberId=Members.MemberId
                WHERE ChatId=$1
                ORDER BY Timestamp ASC`
    db.manyOrNone(query, [chatId])
        .then((rows) => {
            res.send({
                success: true,
                messages: rows
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});
module.exports = router;