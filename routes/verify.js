//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let sendEmail = require('../utilities/utils').sendEmail;

let randomCode = require('../utilities/utils').randomCode;

var router = express.Router();
const bodyParser = require("body-parser");

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//send a message to all users "in" the chat session with chatId
router.post("/confirm", (req, res) => {
    let email = req.body['email'];
    let inputCode = req.body['verifycode'];
    if (!email || !inputCode) {
        res.send({
            success: false,
            error: "email or verify code not supplied"
        });
        return;
    }
    //add the message to the database
    let query = `SELECT * FROM MEMBERS WHERE Email=$1 AND Verification=0`;
    db.one(query, [email])
        .then((row) => {
            if (row['verifycode'] == inputCode) {
                // let token = jwt.sign({ username: email },
                //     config.secret,
                //     {
                //         expiresIn: '24h' // expires in 24 hours
                //     }
                // );
                db.none('UPDATE Members SET Verification=1 WHERE Email=$1', [email])
                    .then(() => {
                        res.send({
                            success: true,
                            message: 'Authentication successful!',
                            memberid: row['memberid'],
                            profileuri: row['profileuri'],
                            firstname: row['firstname'],
                            lastname: row['lastname'],
                            username: row['username']
                        });
                    }).catch(err => {
                        res.send({
                            success: false,
                            error: err,
                        });
                    })
            } else {
                res.send({
                    success: false,
                    error: "verify code does not match"
                });
            }
        }).catch((err) => {
            res.send({
                success: false,
                error: "already verified or account does not exist",
            });
        });
});

router.post("/confirm/pushy", (req, res) => {
    let email = req.body['email'];
    let inputCode = req.body['verifycode'];
    let pushyToken = req.body['token'];
    if (!email || !inputCode || !pushyToken) {
        res.send({
            success: false,
            error: "email, verify code, or pushy token not supplied"
        });
        return;
    }
    //add the message to the database
    let query = `SELECT * FROM MEMBERS WHERE Email=$1 AND Verification=0`;
    db.one(query, [email])
        .then((row1) => {
            if (row1['verifycode'] == inputCode) {
                db.none('UPDATE Members SET Verification=1 WHERE Email=$1', [email])
                    .then(() => {
                        // let token = jwt.sign({ username: email },
                        //     config.secret,
                        //     {
                        //         expiresIn: '24h' // expires in 24 hours
                        //     }
                        // );
                        let params = [row1['memberid'], pushyToken];
                        db.manyOrNone('INSERT INTO Push_Token (memberId, token) VALUES ($1, $2) ON CONFLICT(memberId) DO UPDATE SET token = $2; ', params)
                            .then(row2 => {
                                //package and send the results
                                res.json({
                                    success: true,
                                    message: 'Authentication successful!',
                                    memberid: row1['memberid'],
                                    profileuri: row1['profileuri'],
                                    firstname: row1['firstname'],
                                    lastname: row1['lastname'],
                                    username: row1['username']
                                });
                            })
                            .catch(err3 => {
                                console.log("error on insert");
                                console.log(err3);
                                //If anything happened, it wasn't successful
                                //some error on pushy token insert. See console logs
                                res.send({
                                    success: false,
                                    error: err3
                                });
                            });
                    }).catch(err2 => {
                        res.send({
                            success: false,
                            error: err2
                        });
                    })
            }
        }).catch((err1) => {
            res.send({
                success: false,
                error: "already verified or account does not exist"
            });
        });
});

//Get all of the messages from a chat session with id chatid
router.post("/resend", (req, res) => {
    let newCode = randomCode();
    let email = req.body['email'];
    if (!email) {
        res.send({
            success: false,
            error: "email not supplied"
        });
        return;
    }
    //add the message to the database
    let query = `SELECT MemberId FROM MEMBERS WHERE Email=$1 AND Verification=0`;
    db.one(query, [email])
        .then((row) => {
            db.none('UPDATE Members SET VerifyCode=$2 WHERE Email=$1', [email, newCode])
                .then(() => {
                    res.send({
                        success: true,
                        message: "new verify code sent"
                    });
                    sendEmail(email, 'Charles Angels Registration Confirmation',
                        "Greetings from Charles Angels,<br><br>" +
                        "Thank you for signing up for our services.<br>" +
                        "Input this code in the app to verify your account and to continue using our services:<br><br>" +
                        "<b>" + newCode + "</b><br><br>" +
                        "Good morning angel!<br>" +
                        "-Charles Angels Services Team");
                }).catch(err => {
                    res.send({
                        success: false,
                        error: err,
                    });
                })
        }).catch((err) => {
            res.send({
                success: false,
                error: "already verified or account does not exist",
            });
        });
});
module.exports = router;