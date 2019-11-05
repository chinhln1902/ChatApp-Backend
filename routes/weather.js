const OPW_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express router
var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//request module is needed to make a request to a web service
const request = require('request');

//TODO: does below need /weather/something
router.post("/current", (req, res) => {
    // for info on use of tilde (`) making a String literal, see below. 
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
    let lat = req.body['lat'];
    let lon =  req.body['lon'];
    let url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPW_API_KEY}`;
// `http:// api.openweathermap.org/data/2.5/weather?zip=${zip},${country}&appid=${API_KEY}’;
// `http:// api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${API_KEY}’;
    //res.send(url);
    //When this web service gets a request, make a request to the Phish Web service
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

module.exports = router;
