const OPW_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const WB_API_KEY = process.env.WEATHERBIT_API_KEY;
const DS_API_KEY = process.env.DARK_SKY_API_KEY;
const MQ_API_KEY = process.env.MAPQUEST_API_KEY;
//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express router
var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//request module is needed to make a request to a web service
const request = require('request');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;


router.post("/latLon", (req, res) => {
    // for info on use of tilde (`) making a String literal, see below. 
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
    let lat = req.body['lat'];
    let lon =  req.body['lon'];
    let url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPW_API_KEY}`;

    //When this web service gets a request, make a request to the Phish Web service
    request(url, function (error, _response, body) {
        if (error) {
            res.send(error);
            // res.send({
            //     success: false,
            //     errorMessage: "lat: " + lat + ", lon: " + lon + ", key: " + OPW_API_KEY + ", url: " + url,
            //     error: error
            // });
        } else {
            // pass on everything (try out each of these in Postman to see the difference)
            // res.send(response);
            
            // or just pass on the body
            res.send(body);
        }
    });    
});

router.post("/latLon/24h", (req, res) => {
    let lat = req.body['lat'];
    let lon =  req.body['lon'];
    let url = `https://api.darksky.net/forecast/${DS_API_KEY}/${lat},${lon}`;

    request(url, function (error, _response, body) {
        if (error) {
            res.send(error);
        } else {
            res.send(body);
        }
    });    
});

router.post("/latLon/10d", (req, res) => {
    let lat = req.body['lat'];
    let lon =  req.body['lon'];
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WB_API_KEY}`;

    request(url, function (error, _response, body) {
        if (error) {
            res.send(error);
        } else {
            res.send(body);
        }
    });    
});

router.post("/zip", (req, res) => {
    let zip = req.body['zip'];
    let url = `http://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${OPW_API_KEY}`;

    request(url, function (error, _response, body) {
        if (error) {
            res.send(error);
        } else {
            // pass on everything (try out each of these in Postman to see the difference)
            // res.send(response);
            
            // or just pass on the body
            res.send(body);
        }
    });    
});

router.post("/zip/24h", (req, res) => {
    let zip = req.body['zip'];

    let url = `http://www.mapquestapi.com/geocoding/v1/address?key=${MQ_API_KEY}&location=${zip}`;

    request(url, function (error, _response, body) {
        if (error) {    
            res.send(error);
        } else {
            let json = JSON.parse(body);
            let lat = json['results'][0]['locations'][0]['latLng']['lat'];
            let lon = json['results'][0]['locations'][0]['latLng']['lng'];
            let url2 = `https://api.darksky.net/forecast/${DS_API_KEY}/${lat},${lon}`;
            request(url2, function (error, _response, body) {
                if (error) {
                    res.send(error);
                } else {
                        res.send(body);
                }
            });  
        }
    });   

  
});

router.post("/zip/10d", (req, res) => {
    let zip = req.body['zip'];
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?postal_code=${zip}&key=${WB_API_KEY}`;

    request(url, function (error, _response, body) {
        if (error) {
            res.send(error);
        } else {
            res.send(body);
        }
    });    
});

router.post("/send", (req, res) => {
    let email = req.body['email'];
    let city = req.body['city'];
    let country = req.body['country'];
    let lat = req.body['lat'];
    let lon = req.body['lon'];
    let zip = req.body['zip'];
    if (!email || !city
        //  || !zip || !city || country 
         ) {
        res.send({
            success: false,
            error: "email:" +  email +  " city:" + city + " country:" + country + " lat:" + lat + " lon:" + lon + " " +
            !email + !lat + !lon + !city + 
            // ", zip"
            " not supplied"
        });
    } else {
        let insert = "INSERT INTO Locations (MemberID, Nickname) " //ZIP
        + "SELECT MemberID, $2" //$5
        + "FROM Members WHERE email=$1 AND NOT EXISTS (SELECT * FROM MEMBERS JOIN LOCATIONS ON MEMBERS.MEMBERID = LOCATIONS.MEMBERID WHERE email = $1 AND nickname = $2)"
        // let insert = "INSERT INTO LOCATIONS (MEMBERID, NICKNAME) SELECT MEMBERID, $2 FROM MEMBERS WHERE email=$1 AND NOT EXISTS (SELECT * FROM MEMBERS JOIN LOCATIONS ON MEMBERS.MEMBERID = LOCATIONS.MEMBERID WHERE email = $a AND nickname = $2)"
        // let insert = "INSERT INTO Locations (MemberID, Nickname)" //ZIP
        // + "SELECT MemberID, $2" //$5
        // + "FROM Members"
        // + "WHERE email=$1 AND NOT EXISTS (SELECT *"
        // +                        "FROM MEMBERS"
        // +                        "JOIN LOCATIONS ON MEMBERS.MEMBERID = LOCATIONS.MEMBERID"
        // +                        "WHERE email = $1 AND nickname = $2)"
        db.none(insert, [email, city + ", " + country])//zip
            .then((data) => {
                res.send({
                    success: true,
                    message: "success",
                    data: data
                });
            })
            .catch((err) => {
                res.send({
                    success: false,
                    errorMessage: "INSERT error",
                    error: err
                });
            });
    }



});

router.post("/get", (req, res) => {
    let email = req.body['email'];
    if (!email) {
        res.send({
            success: false,
            error: "email is not supplied"
        });
        return;
    }

    let query = "SELECT Nickname, Lat, Long, ZIP FROM Locations JOIN Members ON " + 
    "Members.MemberID = Locations.MemberID WHERE email=$1";
    db.manyOrNone(query, [email])
        .then((rows) => {
            res.send({
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
