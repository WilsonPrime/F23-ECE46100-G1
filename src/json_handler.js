"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
//Test Path
var file = 'browserify_info.json';
var readJSON = function (jsonPath, callback) {
    fs.readFile(jsonPath, 'utf-8', function (err, data) {
        if (err) {
            console.error('Error reading file:', err);
            callback(null); // Pass null to the callback to indicate an error
            return;
        }
        try {
            var jsonData = JSON.parse(data);
            callback(jsonData); // Pass the parsed JSON data to the callback
        }
        catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            callback(null); // Pass null to the callback to indicate an error
        }
    });
};
function check_npm_for_open_source(filePath) {
    return new Promise(function (resolve) {
        readJSON(filePath, function (jsonData) {
            if (jsonData !== null) {
                if (jsonData.repository.type == 'git') {
                    var gitUrl = jsonData.repository.url;
                    console.log('ssh url:', gitUrl);
                    var httpsUrl = 'https://' + gitUrl.substring(10, gitUrl.length);
                    console.log('https url:', httpsUrl);
                    resolve(httpsUrl);
                }
                else {
                    console.log('No git repository found.');
                    resolve("Invalid");
                }
            }
            else {
                console.error('Failed to read or parse JSON.');
                resolve(null);
            }
        });
    });
}
check_npm_for_open_source(file);
