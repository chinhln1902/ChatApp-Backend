//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

//We use this create the SHA256 hash
// const crypto = require("crypto");

let getHash = require('../utilities/utils').getHash;

var router = express.Router();

const bodyParser = require("body-parser");

const Identicon = require("identicon.js");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/get', (req, res) => {
    let memberId = req.body['memberId'];

    let query = 'SELECT * FROM Members WHERE MemberId = $1';
    db.one(query, [memberId])
        .then((row) => {
            let salt = row['salt'];
            let username = row['username'];
            let size = 200;
            let hash = getHash(username, salt);
            let data = new Identicon(hash, size).toString();
            console.log(data);
            let image = 'data:image/png;base64,' + data;
            res.send({
                success: true,
                url: image
            })
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            })
        });
});

router.post('/otherGet', (req, res) => {
    var jdenticon = require("jdenticon"),
    size = 200,
    value = "icon value",
    png = jdenticon.toPng(value, size);
    
    // console.log();
    res.send({
        success: true,
        uri: Buffer.from(png).toString('base64')
    })
});
module.exports = router;