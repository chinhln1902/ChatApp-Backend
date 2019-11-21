//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Pull in the JWT module along with out asecret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let randomCode = require('../utilities/utils').randomCode;

let sendEmail = require('../utilities/utils').sendEmail;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/', (req, res) => {
    res.type("application/json");

    //Retrieve data from query params
    var first = req.body['first'];
    var last = req.body['last'];
    var username = req.body['username'];
    var email = req.body['email'];
    var password = req.body['password'];
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if (first && last && username && email && password) {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);

        let newCode = randomCode();

        //Use .none() since no result gets returned from an INSERT in SQL
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let params = [first, last, username, email, salted_hash, salt, newCode];

        db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyCode) VALUES ($1, $2, $3, $4, $5, $6, $7)", params)
            .then(() => {
                let token = jwt.sign({ username: email },
                    config.secret,
                    {
                        expiresIn: '24h' // expires in 24 hours
                    }
                );
                //package and send the results
                res.json({
                    success: true,
                    message: 'Authentication successful!',
                    token: token
                });
                sendEmail(email, 'Charles Angels Registration Confirmation',
                    "Greetings from Charles Angels,<br><br>" +
                    "Thank you for signing up for our services.<br>" +
                    "Input this code in the app to verify your account and to continue using our services:<br><br>" +
                    "<b>" + newCode + "</b><br><br>" +
                    "Good morning angel!<br>" +
                    "-Charles Angels Services Team");
            }).catch((err) => {
                //log the error
                console.log(err);
                //If we get an error, it most likely means the account already exists
                //Therefore, let the requester know they tried to create an account that already exists
                res.send({
                    success: false,
                    error: err
                });
            });
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

module.exports = router; 