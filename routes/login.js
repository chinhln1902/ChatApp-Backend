//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//Pull in the JWT module along with out asecret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

router.post('/', (req, res) => {
    let email = req.body['email'];
    let theirPw = req.body['password'];
    let wasSuccessful = false;
    if (email && theirPw) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT * FROM Members WHERE Email=$1', [email])
            .then(row => { //If successful, run function passed into .then()
                let salt = row['salt'];
                //Retrieve our copy of the password
                let ourSaltedHash = row['password'];

                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);

                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash;

                let verified = row['verification'];

                if (wasCorrectPw) {
                    //credentials match. get a new JWT
                    let token = jwt.sign({ username: email },
                        config.secret,
                        {
                            expiresIn: '24h' // expires in 24 hours
                        }
                    );
                    if (verified) {
                        //package and send the results
                        res.json({
                            success: true,
                            message: 'Authentication successful!',
                            memberid: row['memberid'],
                            firstname: row['firstname'],
                            lastname: row['lastname'],
                            username: row['username'],
                            profileuri: row['profileuri'],
                            token: token
                        });
                    } else {
                        res.json({
                            success: false,
                            error: "not verified",
                            token: token
                        });
                    }
                } else {
                    //credentials did not match
                    res.send({
                        success: false,
                        error: "password incorrect"
                    });
                }
            })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
                //If anything happened, it wasn't successful
                res.send({
                    success: false,
                    error: err
                });
            });
    } else {
        res.send({
            success: false,
            error: 'missing credentials'
        });
    }
});

router.post('/pushy', (req, res) => {
    let email = req.body['email'];
    let theirPw = req.body['password'];
    let pushyToken = req.body['token'];
    let wasSuccessful = false;
    if (email && theirPw && pushyToken) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT * FROM Members WHERE Email=$1', [email])
            .then(row => { //If successful, run function passed into .then()
                let salt = row['salt'];
                //Retrieve our copy of the password
                let ourSaltedHash = row['password'];
                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);
                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash;

                let verified = row['verification'];
                
                if (wasCorrectPw) {
                    //credentials match. get a new JWT
                    let token = jwt.sign({ username: email },
                        config.secret,
                        {
                            expiresIn: '24h' // expires in 24 hours
                        }
                    );
                    if (verified) {
                        let params = [row['memberid'], pushyToken];
                        db.manyOrNone('INSERT INTO Push_Token (memberId, token) VALUES ($1, $2) ON CONFLICT(memberId) DO UPDATE SET token = $2; ', params)
                            .then(data => {
                                //package and send the results
                                res.json({
                                    success: true,
                                    message: 'Authentication successful!',
                                    memberid: row['memberid'],
                                    firstname: row['firstname'],
                                    lastname: row['lastname'],
                                    username: row['username'],
                                    profileuri: row['profileuri'],
                                    token: token
                                });
                            })
                            .catch(err => {
                                console.log("error on insert");
                                console.log(err);
                                //If anything happened, it wasn't successful
                                //some error on pushy token insert. See console logs
                                res.send({
                                    success: false,
                                    error: err
                                });
                            });
                    } else {
                        res.json({
                            success: false,
                            error: "not verified",
                            token: token
                        });
                    }

                } else {
                    //credentials dod not match
                    res.send({
                        success: false,
                        error: "credentials did not match"
                    });
                }
            })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
                //If anything happened, it wasn't successful
                console.log("Here (login) on error " + err);
                res.send({
                    success: false,
                    error: err
                });
            });
    } else {
        res.send({
            success: false,
            error: 'missing credentials'
        });
    }
});

module.exports = router; 