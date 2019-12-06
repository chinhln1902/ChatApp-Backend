//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//Get all of the messages from a chat session with id chatid
router.post('/remove', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberIdUser = req.body['memberIdUser'];
    let memberIdOther = req.body['memberIdOther'];

    let query = `DELETE FROM Contacts
                WHERE (memberId_A=$1 AND memberId_B=$2)
                OR (memberId_A=$2 AND memberId_B=$1)`
    db.none(query, [memberIdUser, memberIdOther])
        .then(() => {
            res.send({
                success: true,
                message: "successfully unconnected"
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});

//Get all of the messages from a chat session with id chatid
router.post('/add', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberIdUser = req.body['memberIdUser'];
    let memberIdOther = req.body['memberIdOther'];

    let check = `SELECT * FROM Contacts
                WHERE (memberId_A=$1 AND memberId_B=$2)
                OR (memberId_B=$2 AND memberId_A=$1)`

    let query = `INSERT INTO Contacts(memberId_A, memberId_B)
                VALUES($1, $2)`
    db.none(check, [memberIdUser, memberIdOther])
        .then(() => {
            db.none(query, [memberIdUser, memberIdOther])
                .then(() => {
                    db.oneOrNone('SELECT * FROM Push_Token WHERE MemberID=$1', [memberIdOther])
                        .then(row => {
                            msg_functions.sendToReceiver(row['token'], memberIdUser);
                            res.send({
                                success: true,
                                message: "successfully connected"
                            });
                        }).catch(err => {
                            res.send({
                                success: false,
                                error: "friend added but notification could not be sent",
                            });
                        })
                }).catch(err => {
                    res.send({
                        success: false,
                        error: err
                    })
                });
        }).catch((err) => {
            res.send({
                success: false,
                message: "already connected"
            })
        });
});

// Searches for user by username
router.post('/search', (req, res) => {
    let username = req.body['username'];

    let query = `SELECT MemberId, FirstName, LastName, Username, ProfileURI
                FROM Members
                WHERE Username=$1`
    db.one(query, [username])
        .then((row) => {
            res.send({
                success: true,
                member: row
            })
        }).catch((err) => {
            res.send({
                success: false,
                message: "member does not exist"
            })
        });
});

router.post('/confirm', (req, res) => {
    let memberIdUser = req.body['memberIdUser'];
    let memberIdOther = req.body['memberIdOther'];

    let query = `UPDATE Contacts
                SET Verified=1
                WHERE memberId_A=$2
                AND memberId_B=$1`
    db.none(query, [memberIdUser, memberIdOther])
        .then(() => {
            res.send({
                success: true,
                message: "successfully confirmed"
            })
        }).catch((err) => {
            res.send({
                success: false,
                message: err
            })
        });
});

// router.post('/reject', (req, res) => {
//     let memberIdUser = req.body['memberIdUser'];
//     let memberIdOther = req.body['memberIdOther'];

//     let query = `DELETE FROM Contacts
//                 WHERE memberId_A=$2
//                 AND memberId_B=$1`
//     db.none(query, [memberIdUser, memberIdOther])
//         .then(() => {
//             res.send({
//                 success: true,
//                 message: "successfully rejected"
//             })
//         }).catch((err) => {
//             res.send({
//                 success: false,
//                 message: err
//             })
//         });
// });

router.post('/requestsReceived', (req, res) => {
    let memberId = req.body['memberId'];

    let query = `SELECT MemberId, FirstName, LastName, Username, ProfileURI
                FROM Members
                INNER JOIN Contacts
                ON MemberId=memberId_A
                WHERE MemberId_B=$1
                AND Verified=0`
    db.manyOrNone(query, [memberId])
        .then((rows) => {
            res.send({
                success: true,
                connections: rows
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});

router.post('/requestsSent', (req, res) => {
    let memberId = req.body['memberId'];

    let query = `SELECT MemberId, FirstName, LastName, Username, ProfileURI
                FROM Members
                INNER JOIN Contacts
                ON MemberId=memberId_B
                WHERE MemberId_A=$1
                AND Verified=0`
    db.manyOrNone(query, [memberId])
        .then((rows) => {
            res.send({
                success: true,
                connections: rows
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});

//Get all of the friends that are verified
router.post('/getAll', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberId = req.body['memberId'];

    let query = `SELECT memberId, FirstName, LastName, Username, ProfileURI
                FROM Members
                WHERE memberId IN (SELECT memberId_A
                                    FROM Contacts
                                    WHERE memberId_A <> $1
                                    AND memberId_B=$1
                                    AND Verified=1)
                OR memberId IN (SELECT memberId_B
                                FROM Contacts
                                WHERE memberId_B <> $1
                                AND memberId_A=$1
                                AND Verified=1)`
    db.manyOrNone(query, [memberId])
        .then((rows) => {
            res.send({
                connections: rows
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});

//Get current person clicked
router.post('/getFriend', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberIdUser = req.body['memberIdUser'];
    let memberIdOther = req.body['memberIdOther'];

    let query = `SELECT memberId, FirstName, LastName, Username, Status.Verified, ProfileURI
                FROM Members LEFT JOIN (SELECT * From Contacts
                                        WHERE MemberId_B=$1
                                        AND MemberId_A=$2) AS Status
                ON Members.MemberId=Status.MemberId_A
                WHERE MemberId = $2`
    db.one(query, [memberIdUser, memberIdOther])
        .then((row) => {
            res.send({
                success: true,
                connections: row
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});

//Get current person clicked
router.post('/getPerson', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberIdUser = req.body['memberIdUser'];
    let memberIdOther = req.body['memberIdOther'];
    let check = `SELECT Verified, MemberId_A
                FROM Contacts
                WHERE (memberId_A=$1 AND memberId_B=$2)
                OR (memberId_A=$2 AND memberId_B=$1)
                LIMIT 1`;
    let query = `SELECT memberId, FirstName, LastName, Username, ProfileURI
                FROM Members
                WHERE MemberId=$1`;
    db.oneOrNone(check, [memberIdUser, memberIdOther])
        .then((row1) => {
            // console.log(row1);
            db.one(query, [memberIdOther])
                .then((row2) => {
                    let status = "";
                    if (row1 == null) {
                        status = "no connection at all";
                    } else if (row1['verified'] == 0) {
                        console.log(row1['memberid_a']);
                        if (row1['memberid_a'] == memberIdOther) {
                            status = "received request from person";
                        } else {
                            status = "sent request to person";
                        }
                    } else {
                        status = "already connected";
                    }
                    res.send({
                        success: true,
                        connection: row2,
                        status: status
                    })
                }).catch((err2) => {
                    res.send({
                        success: false,
                        error: err2
                    })
                });
        }).catch((err1) => {
            res.send({
                success: false,
                error: err1
            })
        });
});

module.exports = router; 