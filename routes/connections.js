//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

// router.post('/', (req, res) => {
//     let email = req.body['email'];
//     let theirPw = req.body['password'];
//     let wasSuccessful = false;
//     if (email && theirPw) {
//         //Using the 'one' method means that only one row should be returned
//         db.one('SELECT Password, Salt FROM Members WHERE Email=$1', [email])
//             .then(row => { //If successful, run function passed into .then()
//                 let salt = row['salt'];
//                 //Retrieve our copy of the password
//                 let ourSaltedHash = row['password'];

//                 //Combined their password with our salt, then hash
//                 let theirSaltedHash = getHash(theirPw, salt);

//                 //Did our salted hash match their salted hash?
//                 let wasCorrectPw = ourSaltedHash === theirSaltedHash;

//                 if (wasCorrectPw) {
//                     //credentials match. get a new JWT
//                     let token = jwt.sign({ username: email },
//                         config.secret,
//                         {
//                             expiresIn: '24h' // expires in 24 hours
//                         }
//                     );
//                     //package and send the results
//                     res.json({
//                         success: true,
//                         message: 'Authentication successful!',
//                         token: token
//                     });
//                 } else {
//                     //credentials dod not match
//                     res.send({
//                         success: false
//                     });
//                 }
//             })
//             //More than one row shouldn't be found, since table has constraint on it
//             .catch((err) => {
//                 //If anything happened, it wasn't successful
//                 res.send({
//                     success: false,
//                     message: err
//                 });
//             });
//     } else {
//         res.send({
//             success: false,
//             message: 'missing credentials'
//         });
//     }
// });

//Get all of the messages from a chat session with id chatid
router.post('/remove', (req, res) => {
    // let chatId = req.body['chatId'];
    let memberIdUser = req.body['memberIdUser'];
    let memberIdOther = req.body['memberIdOther'];

    let query = `DELETE FROM Contacts
                WHERE (memberIdUser=$1 AND memberIdOther=$2)
                OR (memberIdOther=$1 AND memberIdUser=$2)`
    db.one(query, [memberIdUser, memberIdOther])
        .then(row => {
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
                WHERE (memberIdUser=$1 AND memberIdOther=$2)
                OR (memberIdUser=$2 AND memberIdOther=$1)`
    let query = `INSERT INTO Contacts(memberIdUser, memberIdOther)
                VALUES($1, $2)`
    db.none(check, [memberIdUser, memberIdOther])
        .then(() => {
            db.one(query, [memberIdUser, memberIdOther])
                .then(row => {
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
    db.one(query, [memberIdUser, memberIdOther])
        .then((row) => {
            res.send({
                success: true,
                member: row
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
                ON MemberId=memberIdOther
                WHERE MemberId=$1
                AND Verified<>0`
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

    let query = `SELECT MemberID, FirstName, LastName, Username, Verification
                FROM Contacts INNER JOIN Members
                ON Contacts.memberIdOther=Members.MemberId
                WHERE (Contacts.memberIdUser=$1
                OR Contacts.memberIdOther=$1)
                AND Contacts.Verified=1`
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