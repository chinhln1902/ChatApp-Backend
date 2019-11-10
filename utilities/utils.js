//Get the connection to Heroku Database
let db = require('./sql_conn.js');

//We use this create the SHA256 hash
const crypto = require("crypto");
const ADMIN_EMAIL_KEY = process.env.ADMIN_EMAIL_KEY;
const ADMIN_PASSWORD_KEY = process.env.ADMIN_PASSWORD_KEY;

var nodemailer = require('nodemailer');

function sendEmail(receiver, subj, message) {
    //research nodemailer for sending email from node.
    // https://nodemailer.com/about/
    // https://www.w3schools.com/nodejs/nodejs_email.asp
    //create a burner gmail account
    //make sure you add the password to the environmental variables
    //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: ADMIN_EMAIL_KEY,
            pass: ADMIN_PASSWORD_KEY
        }
    });

    var mailOptions = {
        from: ADMIN_EMAIL_KEY,
        to: receiver,
        subject: subj,
        text: message
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    //fake sending an email for now. Post a message to logs.
    console.log('Email sent: ' + message);
}

function randomCode() {
    var code = "";
    for (var i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * (10 - 0) + 0);
    }
    return code;
}

/**
 * Method to get a salted hash.
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex");
}

let messaging = require('./pushy_services.js');
module.exports = {
    db, getHash, randomCode, sendEmail, messaging
};