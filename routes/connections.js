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
                OR (memberId_B=$1 AND memberId_A=$2)`
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
                    res.send({
                        success: true,
                        message: "successfully connected"
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

    let query = `SELECT MemberId, FirstName, LastName, Username
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

router.post('/requests', (req, res) => {
    let memberId = req.body['memberId'];

    let query = `SELECT MemberId, FirstName, LastName, Username
                FROM Members
                INNER JOIN Contacts
                ON MemberId=memberId_A
                WHERE MemberId_B=$1
                AND Verified=0`
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

//Get all of the friends that are verified
router.post('/getAll', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberId = req.body['memberId'];

    let query = `SELECT memberId, FirstName, LastName, Username
                FROM Members
                WHERE memberId IN (SELECT memberId_A
                                    FROM Contacts
                                    WHERE memberId_A <> $1
                                    AND Verified=1)
                OR memberId IN (SELECT memberId_B
                                FROM Contacts
                                WHERE memberId_B <> $1
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

module.exports = router; 