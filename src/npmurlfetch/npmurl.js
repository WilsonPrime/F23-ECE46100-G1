"use strict";
// Purpose: Read a list of NPM Urls and fetch the JSON data from each URL.
Object.defineProperty(exports, "__esModule", { value: true });
//import setup for task
var fs = require("fs");
var https = require("https");
var regex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to check if url is valid
// read urls from file 
var url_list = function (filename) {
    return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean);
};
// match url with regex and return registry url to pull json data
var get_package_name = function (npmUrl) {
    var match = npmUrl.match(regex);
    if (match) { // if url is found with proper regex (package identifier)
        return "https://registry.npmjs.org/".concat(match[1]);
    }
    return null; // if url is invalid;
};
// create array of urls (.txt in project folder)
var urls = url_list('url.txt'); // creates array of urls accessed via urls[0], urls[1], etc.
// fetch json data from each url and print to console 
var i = 0;
for (var _i = 0, urls_1 = urls; _i < urls_1.length; _i++) {
    var url = urls_1[_i];
    var npmLink = get_package_name(url);
    if (npmLink) {
        https.get(npmLink, function (res) {
            var body = "";
            res.on("data", function (chunk) {
                body += chunk;
            });
            res.on("end", function () {
                try {
                    var json = JSON.parse(body);
                    //console.log("Start of JSON data:\n");
                    fs.writeFile("npm_url[".concat(i, "].json"), JSON.stringify(json, null, 4), function (err) {
                        if (err)
                            throw err;
                        console.log("File npm_url[".concat(i, "].json has been saved!"));
                    });
                    //console.log(json);
                    //console.log("End of JSON data");
                    i++;
                }
                catch (error) {
                    console.error(error.message);
                }
                ;
            });
        }).on("error", function (error) {
            console.error(error.message);
        });
    }
    else {
        console.error("Invalid URL: ".concat(url));
    }
}
